import * as fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/DATA_GO_KR_DERIVATIVE_API_KEY=(.*)/);
if (match) {
    process.env.DATA_GO_KR_DERIVATIVE_API_KEY = match[1].trim();
}

async function test() {
    const basDt = '20260706';
    const apiKey = process.env.DATA_GO_KR_DERIVATIVE_API_KEY;
    const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=10000&pageNo=1&basDt=${basDt}`;

    const response = await fetch(url);
    const data = await response.json();
    const items = data.response.body.items.item;
    
    const uniquePrdCtgs = new Set(items.map((i: any) => i.prdCtg));
    console.log("Unique prdCtg values:", Array.from(uniquePrdCtgs));
}

test();
