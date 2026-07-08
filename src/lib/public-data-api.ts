// src/lib/public-data-api.ts
import { calculateATMStraddle } from './calculator';

/**
 * Returns the most recent business day (YYYYMMDD) for EOD data.
 * If today is Monday, returns last Friday.
 * If today is Sunday or Saturday, returns last Friday.
 * Otherwise, returns yesterday.
 * Note: Does not account for public holidays dynamically, but sufficient for basic operation.
 */
function getBusinessDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  // 간단히 주말이면 이전 금요일로 이동
  if (d.getDay() === 0) d.setDate(d.getDate() - 2); // Sun -> Fri
  if (d.getDay() === 6) d.setDate(d.getDate() - 1); // Sat -> Fri
  
  const yyyy = d.getFullYear();
  // 사용자의 요청에 따라 2026년 기준 실시간 데이터를 그대로 사용 (연도 보정 제거)
  
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export async function getEodOptionsStraddleSum(): Promise<{ items: import('@/types/options').OptionChainItem[], atmStrike: number, sum: number, call: number, put: number, isMock: boolean } | null> {
  try {
    const apiKey = process.env.DATA_GO_KR_DERIVATIVE_API_KEY;
    if (!apiKey) {
      throw new Error("DATA_GO_KR_DERIVATIVE_API_KEY is not set");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let items: any[] = [];
    let basDt = '';
    
    // 최근 1일 전부터 최대 5일 전까지 거슬러 올라가며 데이터 존재 여부 확인 (공공데이터 업데이트 지연 대비)
    for (let offset = 1; offset <= 5; offset++) {
      basDt = getBusinessDay(offset);
      // prdCtg 파라미터를 추가하여 코스피200 옵션만 수신
      const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=10000&pageNo=1&basDt=${basDt}&prdCtg=${encodeURIComponent('파생 옵션 코스피200')}`;

      console.log(`[PublicDataAPI] Fetching Options EOD data for basDt: ${basDt}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[PublicDataAPI] Error fetching data for ${basDt}: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      if (data?.response?.header?.resultCode !== '00') {
         console.warn(`[PublicDataAPI] Non-00 resultCode for ${basDt}:`, data?.response?.header);
         continue;
      }
      
      if (data?.response?.body?.items?.item && data.response.body.items.item.length > 0) {
        items = data.response.body.items.item;
        break; // 데이터 찾음!
      }
    }

    if (items.length === 0) {
       throw new Error("현재 파생상품 시장의 데이터를 불러올 수 없습니다. API 반환 데이터 없음.");
    }

    // 위클리 옵션(종목명에 'W' 포함) 우선 필터링
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const weeklies = items.filter((i: any) => i.itmsNm.startsWith('코스피200') && i.itmsNm.includes('W') && parseFloat(i.clpr) > 0);
    
    // 만약 위클리 옵션이 없으면 일반 코스피200 옵션 중 거래(clpr > 0)가 있는 것
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetOptions = weeklies.length > 0 ? weeklies : items.filter((i: any) => i.itmsNm.startsWith('코스피200') && parseFloat(i.clpr) > 0);

    if (targetOptions.length === 0) {
      throw new Error("No KOSPI 200 options with valid prices found for date " + basDt);
    }

    // 그룹화: 동일 만기일(Expiration) 중 가장 가까운 만기일 찾기
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expirations = Array.from(new Set(targetOptions.map((opt: any) => {
      const parts = opt.itmsNm.split(/\s+/);
      return parts[parts.length - 2];
    })));
    expirations.sort(); // 가장 가까운 만기일순
    const nearestExpiration = expirations[0];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const frontMonthOptions = targetOptions.filter((opt: any) => {
      const parts = opt.itmsNm.split(/\s+/);
      return parts[parts.length - 2] === nearestExpiration;
    });

    // Group by Strike Price
    const strikeMap = new Map<string, { call: number | null, put: number | null, itmsNm: string, prdCtg: string }>();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    frontMonthOptions.forEach((opt: any) => {
      const nameParts = opt.itmsNm.split(/\s+/);
      // C 또는 P 찾기
      const type = nameParts.find((part: string) => part === 'C' || part === 'P') || 'C';
      const strikeStr = nameParts[nameParts.length - 1].replace(/,/g, ''); 
      const strike = parseFloat(strikeStr).toString();
      
      const price = parseFloat(opt.clpr);
      
      // 거래가 없어서 가격이 0인 행사가 제외
      if (price <= 0) return;
      
      if (!strikeMap.has(strike)) {
        strikeMap.set(strike, { call: null, put: null, itmsNm: opt.itmsNm, prdCtg: opt.prdCtg });
      }
      
      const entry = strikeMap.get(strike)!;
      if (type === 'C') entry.call = price;
      if (type === 'P') entry.put = price;
    });

    // Find empirical ATM (where |Call - Put| is minimal) using calculator
    const result = calculateATMStraddle(strikeMap);
    
    if (!result) {
      throw new Error("Calculator returned null. No valid ATM found.");
    }
    
    // D-1 및 옵션 체인 구성 로직
    const { getMarketData, setMarketData } = await import('./data-store');
    
    // 기존의 옵션 체인 로그 불러오기
    let savedChains = await getMarketData('option_chains') || [];
    if (!Array.isArray(savedChains)) savedChains = [];
    
    // 전일 데이터 찾기 (가장 최근에 저장된 다른 날짜의 데이터)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevChainObj = savedChains.find((chain: any) => chain.date !== basDt);
    const prevChainData = prevChainObj ? prevChainObj.items : null;

    // 현재 체인 배열 만들기
    const currentChainItems: import('@/types/options').OptionChainItem[] = [];
    
    Array.from(strikeMap.entries()).forEach(([strikeStr, entry]) => {
      const strike = parseFloat(strikeStr);
      const sum = (entry.call !== null && entry.put !== null) ? entry.call + entry.put : null;
      let d1Variance: number | null | 'N/A' = 'N/A';
      
      // D-1 분산 계산: (전일 양합 - 당일 양합) / 전일 양합 * 100
      if (prevChainData && sum !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prevItem = prevChainData.find((p: any) => p.strike === strike);
        if (prevItem && prevItem.sum && prevItem.sum > 0) {
          d1Variance = ((prevItem.sum - sum) / prevItem.sum) * 100;
        } else {
          console.warn(`[PublicDataAPI] Missing or invalid previous sum for strike ${strike}. Setting D-1 to N/A`);
        }
      }

      currentChainItems.push({
        date: basDt,
        strike,
        call: entry.call,
        put: entry.put,
        sum,
        d1Variance,
        isATM: strike === result.atmStrike,
        itmsNm: entry.itmsNm,
        prdCtg: entry.prdCtg
      });
    });

    // 오름차순 정렬
    currentChainItems.sort((a, b) => a.strike - b.strike);

    const newChainData = {
      date: basDt,
      items: currentChainItems,
      timestamp: new Date().toISOString()
    };
    
    // 중복 저장 방지
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    savedChains = savedChains.filter((chain: any) => chain.date !== basDt);
    savedChains.unshift(newChainData); // 최신을 맨 앞에
    
    await setMarketData('option_chains', savedChains);

    return { 
      items: currentChainItems,
      atmStrike: result.atmStrike,
      sum: result.sum,
      call: result.call,
      put: result.put,
      isMock: false
    };

  } catch (e) {
    console.error("Public Data API Error:", e);
    // API 데이터 로드 실패 시 가상 데이터 대신 null 반환
    return null;
  }
}
