// src/lib/public-data-api.ts
import { calculateATMStraddle } from './calculator';
import fs from 'fs';
import path from 'path';

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

export async function getEodOptionsStraddleSum(): Promise<{ atmStrike: number, sum: number, call: number, put: number, isMock: boolean } | null> {
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
      const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=10000&pageNo=1&basDt=${basDt}`;

      console.log(`[PublicDataAPI] Fetching Options EOD data for basDt: ${basDt}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data?.response?.body?.items?.item && data.response.body.items.item.length > 0) {
        items = data.response.body.items.item;
        break; // 데이터 찾음!
      }
    }

    if (items.length === 0) {
       throw new Error("API returned no items after trying 5 past business days.");
    }

    // Filter KOSPI 200 Options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kospi200Weeklies = items.filter((i: any) => i.prdCtg.includes('위클리') && i.prdCtg.includes('코스피200'));
    
    // 만약 위클리 옵션이 없으면 일반 코스피200 옵션으로 폴백
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetOptions = kospi200Weeklies.length > 0 ? kospi200Weeklies : items.filter((i: any) => i.prdCtg === '파생 옵션 코스피200');

    if (targetOptions.length === 0) {
      throw new Error("No KOSPI 200 options found for date " + basDt);
    }

    // 그룹화: 동일 만기일(Expiration) 중 가장 가까운 만기일 찾기
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expirations = Array.from(new Set(targetOptions.map((opt: any) => opt.itmsNm.split(' ')[2]))).sort();
    const nearestExpiration = expirations[0]; // 가장 가까운 만기일

    // 해당 만기일의 옵션만 필터링
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const frontMonthOptions = targetOptions.filter((opt: any) => opt.itmsNm.split(' ')[2] === nearestExpiration);

    // Group by Strike Price
    const strikeMap = new Map<string, { call: number | null, put: number | null }>();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    frontMonthOptions.forEach((opt: any) => {
      const nameParts = opt.itmsNm.split(' ');
      const type = nameParts[1]; 
      const strikeStr = nameParts[nameParts.length - 1].replace(/,/g, ''); 
      const strike = parseFloat(strikeStr).toString();
      
      const price = parseFloat(opt.clpr);
      
      // 거래가 없어서 가격이 0인 행사가 제외
      if (price <= 0) return;
      
      if (!strikeMap.has(strike)) {
        strikeMap.set(strike, { call: null, put: null });
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
    
    if (result.sum <= 0) {
      throw new Error(`Calculated straddle sum is abnormal: ${result.sum}`);
    }

    // 로그 파일 저장 로직 (admin/data-logs 페이지용)
    try {
      const logFilePath = path.join(process.cwd(), 'data-logs.json');
      let logs = [];
      if (fs.existsSync(logFilePath)) {
        logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
      }
      
      const newLog = {
        date: basDt,
        strike: result.atmStrike,
        call: result.call,
        put: result.put,
        sum: result.sum,
        timestamp: new Date().toISOString()
      };
      
      // 중복 저장 방지 (같은 날짜면 덮어쓰기)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logs = logs.filter((log: any) => log.date !== basDt);
      logs.unshift(newLog); // 최신을 맨 앞에
      
      fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    } catch (logErr) {
      console.error("Failed to write data-logs.json:", logErr);
    }

    return result;

  } catch (e) {
    console.error("Public Data API Error:", e);
    // API 데이터 로드 실패 시 가상 데이터 대신 null 반환
    return null;
  }
}
