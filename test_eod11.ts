import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.join(process.cwd()));

async function run() {
  try {
    const apiKey = process.env.DATA_GO_KR_DERIVATIVE_API_KEY;
    const basDt = '20260707';
    const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=10000&pageNo=1&basDt=${basDt}&prdCtg=${encodeURIComponent('파생 옵션 코스피200')}`;
    const res = await fetch(url);
    const data = await res.json();
    const items = data.response.body.items.item;
    const weeklies = items.filter((i: any) => i.itmsNm.includes('W') && parseFloat(i.clpr) > 0);
    const targetOptions = weeklies.length > 0 ? weeklies : items.filter((i: any) => parseFloat(i.clpr) > 0);
    const expirations = Array.from(new Set(targetOptions.map((opt: any) => {
      const parts = opt.itmsNm.split(' ');
      return parts[parts.length - 2];
    })));
    expirations.sort();
    const nearestExpiration = expirations[0];
    const frontMonthOptions = targetOptions.filter((opt: any) => {
      const parts = opt.itmsNm.split(' ');
      return parts[parts.length - 2] === nearestExpiration;
    });
    
    console.log("Nearest Expiration:", nearestExpiration);
    console.log("Front Month Options Count:", frontMonthOptions.length);
    console.log("Sample:", frontMonthOptions.slice(0, 3).map((o: any) => ({ name: o.itmsNm, clpr: o.clpr })));
    
    // Test the parsing
    const strikeMap = new Map<string, any>();
    frontMonthOptions.forEach((opt: any) => {
      const nameParts = opt.itmsNm.split(' ');
      const type = nameParts.find((part: string) => part === 'C' || part === 'P') || 'C';
      const strikeStr = nameParts[nameParts.length - 1].replace(/,/g, ''); 
      const strike = parseFloat(strikeStr).toString();
      
      const price = parseFloat(opt.clpr);
      if (!strikeMap.has(strike)) strikeMap.set(strike, { call: null, put: null });
      const entry = strikeMap.get(strike)!;
      if (type === 'C') entry.call = price;
      if (type === 'P') entry.put = price;
    });
    console.log("StrikeMap size:", strikeMap.size);
    let validPairs = 0;
    strikeMap.forEach((val, key) => {
      if (val.call !== null && val.put !== null && val.call > 0 && val.put > 0) validPairs++;
    });
    console.log("Valid Pairs (call>0 && put>0):", validPairs);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
