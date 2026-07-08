import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.join(process.cwd()));
import { getEodOptionsStraddleSum } from './src/lib/public-data-api';

async function run() {
  try {
    const apiKey = process.env.DATA_GO_KR_DERIVATIVE_API_KEY;
    console.log("API Key present:", !!apiKey);
    const basDt = '20220919';
    const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=1000&pageNo=1&basDt=${basDt}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("Items found:", data?.response?.body?.items?.item?.length);
    const items = data?.response?.body?.items?.item || [];
    const kospi200 = items.filter((i: any) => i.prdCtg.includes('파생 옵션 코스피200'));
    console.log("KOSPI200 Items:", kospi200.length);
    if(kospi200.length > 0) {
      console.log("Sample KOSPI200:", kospi200[0]);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
