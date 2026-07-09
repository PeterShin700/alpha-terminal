import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';
const KV_KEY = 'vkospi:history';
const MAX_DAYS = 1095; // 약 3년간 누적 후 슬라이딩 윈도우 적용

// Helper to format date as YYYYMMDD
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

async function fetchVkospiData(targetDate: string) {
  const apiKey = process.env.DATA_GO_KR_DERIVATIVE_API_KEY || process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    throw new Error('API Key is missing');
  }

  // 공공데이터 포털에 VKOSPI 단일 지수 조회 API가 확인되지 않아, 파생상품 옵션 시세의 내재변동성(IV) 평균을 VKOSPI 대용으로 산출합니다.
  const baseUrl = 'https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo';
  const url = `${baseUrl}?serviceKey=${apiKey}&resultType=json&basDt=${targetDate}&numOfRows=100&prdCtg=${encodeURIComponent('파생 옵션 코스피200')}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { 
      next: { revalidate: 0 }, 
      signal: controller.signal 
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch data for ${targetDate}: ${res.statusText}`);
    }

    const data = await res.json();
    const items = data?.response?.body?.items?.item || [];
    
    if (items.length === 0) {
      return null;
    }

    // 거래가 발생한 옵션들의 내재변동성(iptVlty) 평균을 계산 (0인 값 제외)
    let sumVlty = 0;
    let countVlty = 0;

    for (const item of items) {
      const iptVlty = parseFloat(item.iptVlty);
      // 이상치 검증 (Outlier Removal): 100 초과 시 파싱 에러로 간주하여 무시
      if (!isNaN(iptVlty) && iptVlty > 0 && iptVlty <= 100) {
        sumVlty += iptVlty;
        countVlty++;
      }
    }

    if (countVlty === 0) {
      return null;
    }

    const avgIptVlty = parseFloat((sumVlty / countVlty).toFixed(2));

    // 최종 산출된 값에 대해서도 한 번 더 검증
    if (avgIptVlty > 100) {
      return null;
    }

    return {
      date: targetDate,
      value: avgIptVlty,
      clpr: avgIptVlty
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

class RedisAdapter {
  private redis: Redis | null = null;
  private isUpstash: boolean = false;

  constructor() {
    if (process.env.REDIS_URL || (process.env.KV_URL && !process.env.KV_REST_API_URL)) {
      this.redis = new Redis(process.env.REDIS_URL || process.env.KV_URL!);
      this.isUpstash = false;
    } else {
      this.isUpstash = true;
    }
  }

  async del(key: string) {
    if (this.redis) return this.redis.del(key);
    return kv.del(key);
  }

  async rpush(key: string, items: string[]) {
    if (this.redis) return this.redis.rpush(key, ...items);
    return kv.rpush(key, ...items);
  }

  async llen(key: string) {
    if (this.redis) return this.redis.llen(key);
    return kv.llen(key);
  }

  async lpop(key: string) {
    if (this.redis) return this.redis.lpop(key);
    return kv.lpop(key);
  }

  async lrange(key: string, start: number, stop: number) {
    if (this.redis) return this.redis.lrange(key, start, stop);
    return kv.lrange(key, start, stop);
  }

  disconnect() {
    if (this.redis) this.redis.disconnect();
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isInit = searchParams.get('init') === 'true';
  const adapter = new RedisAdapter();

  try {
    if (isInit) {
      const results = [];
      const today = new Date();
      let daysBack = 0;
      
      await adapter.del(KV_KEY);

      while (results.length < MAX_DAYS && daysBack < 120) {
        const d = new Date(today);
        d.setDate(d.getDate() - daysBack);
        const targetDate = formatDate(d);
        
        try {
          const item = await fetchVkospiData(targetDate);
          if (item) {
            results.unshift(item);
          }
        } catch (err) {
          console.error(`Error fetching for ${targetDate}:`, err);
        }
        
        daysBack++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (results.length > 0) {
        await adapter.rpush(KV_KEY, results.map(r => JSON.stringify(r)));
      }

      adapter.disconnect();
      return NextResponse.json({ message: 'Initialized successfully', count: results.length, data: results });
    } else {
      // 현재 KST 시각 기준
      const now = new Date();
      const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
      const todayKst = new Date(kstTime);
      
      let item = null;
      let targetDate = '';

      // 당일부터 과거 5일까지 거슬러 올라가며 가장 최신의 유효한 데이터를 찾음
      for (let offset = 0; offset <= 5; offset++) {
        const d = new Date(todayKst);
        d.setDate(d.getDate() - offset);
        
        // 주말 건너뛰기
        if (d.getDay() === 0) d.setDate(d.getDate() - 2);
        if (d.getDay() === 6) d.setDate(d.getDate() - 1);

        targetDate = formatDate(d);
        item = await fetchVkospiData(targetDate);
        if (item) {
          break; // 데이터를 찾으면 루프 종료
        }
      }
      
      if (!item) {
        adapter.disconnect();
        return NextResponse.json({ message: '최근 5일간 유효한 데이터를 찾을 수 없습니다.' });
      }

      // 이미 저장된 데이터인지 확인하기 위해 마지막 아이템을 체크
      const currentLength = await adapter.llen(KV_KEY);
      if (currentLength > 0) {
         const lastItemArr = await adapter.lrange(KV_KEY, -1, -1);
         if (lastItemArr && lastItemArr.length > 0) {
           try {
             // Upstash는 객체를 반환할 수 있고 ioredis는 문자열을 반환할 수 있음
             const lastItemStr = typeof lastItemArr[0] === 'string' ? lastItemArr[0] : JSON.stringify(lastItemArr[0]);
             const lastItem = JSON.parse(lastItemStr);
             if (lastItem.date === targetDate) {
               adapter.disconnect();
               return NextResponse.json({ message: '이미 오늘자 데이터가 저장되어 있습니다.', data: item });
             }
           } catch (e) {
             console.error("Failed to parse last item", e);
           }
         }
      }

      await adapter.rpush(KV_KEY, [JSON.stringify(item)]);
      
      if (currentLength + 1 > MAX_DAYS) {
        const exceedCount = (currentLength + 1) - MAX_DAYS;
        for (let i = 0; i < exceedCount; i++) {
          await adapter.lpop(KV_KEY);
        }
      }

      adapter.disconnect();
      return NextResponse.json({ message: 'Updated successfully', data: item });
    }
  } catch (error: unknown) {
    adapter.disconnect();
    console.error('VKOSPI Cron Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
