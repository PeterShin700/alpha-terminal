import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.join(process.cwd()));

async function run() {
  const apiKey = process.env.DATA_GO_KR_DERIVATIVE_API_KEY;
  const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=10000&pageNo=1&basDt=20260707&itmsNm=${encodeURIComponent('코스피200')}`;
  const res = await fetch(url);
  const data = await res.json();
  const items = data.response.body.items.item;
  const prdCtgs = Array.from(new Set(items.map((i: any) => i.prdCtg)));
  console.log("Categories found:", prdCtgs);
  const kospi200Options = items.filter((i: any) => i.prdCtg === '파생 옵션 코스피200');
  console.log("KOSPI 200 Options Count:", kospi200Options.length);
  if(kospi200Options.length > 0) {
    console.log("Sample:", kospi200Options[0].itmsNm);
  }
}
run();
