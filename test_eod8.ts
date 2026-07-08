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
    
    // search for weekly options
    const weeklyOptions = items.filter((i: any) => i.itmsNm.includes('W') || i.prdCtg.includes('위클리'));
    console.log("Weekly options count:", weeklyOptions.length);
    if (weeklyOptions.length > 0) {
        console.log("Sample weekly options:", weeklyOptions.slice(0, 3).map((o:any) => o.itmsNm));
    }
}

test();
