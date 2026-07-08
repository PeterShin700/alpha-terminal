import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.join(process.cwd()));

async function run() {
  const apiKey = process.env.DATA_GO_KR_DERIVATIVE_API_KEY;
  const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=10000&pageNo=1&basDt=20260707&prdCtg=${encodeURIComponent('파생 옵션 코스피200')}`;
  const res = await fetch(url);
  const data = await res.json();
  const items = data.response.body.items.item;
  const standardOptions = items.filter((i: any) => i.itmsNm.startsWith('코스피200') && parseFloat(i.clpr) > 0);
  
  const expirations = Array.from(new Set(standardOptions.map((opt: any) => {
    const parts = opt.itmsNm.split(/\s+/);
    return parts[parts.length - 2];
  })));
  expirations.sort();
  const nearestExpiration = expirations[0];
  const frontMonthOptions = standardOptions.filter((opt: any) => {
    const parts = opt.itmsNm.split(/\s+/);
    return parts[parts.length - 2] === nearestExpiration;
  });

  const strikeMap = new Map<string, any>();
  frontMonthOptions.forEach((opt: any) => {
    const nameParts = opt.itmsNm.split(/\s+/);
    const type = nameParts.find((part: string) => part === 'C' || part === 'P') || 'C';
    const strikeStr = nameParts[nameParts.length - 1].replace(/,/g, ''); 
    const strike = parseFloat(strikeStr).toString();
    const price = parseFloat(opt.clpr);
    if (!strikeMap.has(strike)) strikeMap.set(strike, { call: null, put: null, name: opt.itmsNm });
    const entry = strikeMap.get(strike)!;
    if (type === 'C') entry.call = price;
    if (type === 'P') entry.put = price;
  });

  let valid = 0;
  strikeMap.forEach((val, key) => {
    if (val.call !== null && val.put !== null) {
      valid++;
      console.log(`Strike: ${key}, Call: ${val.call}, Put: ${val.put}`);
    }
  });
  console.log("Valid Pairs:", valid);
  if (valid === 0) {
    console.log("No valid pairs. Let's see some entries in strikeMap:", Array.from(strikeMap.entries()).slice(0, 5));
  }
}
run();
