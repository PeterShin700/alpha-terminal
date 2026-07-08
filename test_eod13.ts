import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.join(process.cwd()));

async function run() {
  const apiKey = process.env.DATA_GO_KR_DERIVATIVE_API_KEY;
  const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=10000&pageNo=1&basDt=20260707&prdCtg=${encodeURIComponent('파생 옵션 코스피200')}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("Total Count:", data.response.body.totalCount);
  const items = data.response.body.items.item;
  const standardOptions = items.filter((i: any) => i.itmsNm.startsWith('코스피200'));
  console.log("Standard Options:", standardOptions.length);
  const validStandard = standardOptions.filter((i: any) => parseFloat(i.clpr) > 0);
  console.log("Valid Standard:", validStandard.length);
  if (validStandard.length > 0) {
    console.log(validStandard[0]);
  }
}
run();
