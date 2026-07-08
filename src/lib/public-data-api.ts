// src/lib/public-data-api.ts

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
    const kospi200Options = items.filter((i: any) => i.prdCtg === '파생 옵션 코스피200');
    
    if (kospi200Options.length === 0) {
      throw new Error("No KOSPI 200 options found for date " + basDt);
    }

    // Group by Strike Price
    const strikeMap = new Map<string, { call: number | null, put: number | null }>();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kospi200Options.forEach((opt: any) => {
      const nameParts = opt.itmsNm.split(' ');
      const type = nameParts[1]; 
      const strikeStr = nameParts[nameParts.length - 1].replace(/,/g, ''); 
      const strike = parseFloat(strikeStr).toString();
      
      const price = parseFloat(opt.clpr);
      
      if (!strikeMap.has(strike)) {
        strikeMap.set(strike, { call: null, put: null });
      }
      
      const entry = strikeMap.get(strike)!;
      if (type === 'C') entry.call = price;
      if (type === 'P') entry.put = price;
    });

    // Find empirical ATM (where |Call - Put| is minimal)
    let minDiff = Infinity;
    let atmStrikeStr = "0";
    let bestEntry = { call: 0, put: 0 };

    Array.from(strikeMap.entries()).forEach(([strike, prices]) => {
      if (prices.call !== null && prices.put !== null && prices.call > 0 && prices.put > 0) {
        const diff = Math.abs(prices.call - prices.put);
        if (diff < minDiff) {
          minDiff = diff;
          atmStrikeStr = strike;
          bestEntry = { call: prices.call, put: prices.put };
        }
      }
    });

    const sum = Number((bestEntry.call + bestEntry.put).toFixed(2));
    return {
      atmStrike: parseFloat(atmStrikeStr),
      call: bestEntry.call,
      put: bestEntry.put,
      sum: sum,
      isMock: false
    };

  } catch (e) {
    console.error("Public Data API Error:", e);
    // API 데이터 로드 실패 시 가상 데이터 대신 null 반환
    return null;
  }
}
