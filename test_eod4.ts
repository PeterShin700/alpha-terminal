import * as fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/DATA_GO_KR_DERIVATIVE_API_KEY=(.*)/);
if (match) {
    process.env.DATA_GO_KR_DERIVATIVE_API_KEY = match[1].trim();
}

async function test() {
    const basDt = '20260706';
    const apiKey = process.env.DATA_GO_KR_DERIVATIVE_API_KEY;
    const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=1000&pageNo=1&basDt=${basDt}`;

    const response = await fetch(url);
    const data = await response.json();
    const items = data.response.body.items.item;
    const kospi200Options = items.filter((i: any) => i.prdCtg === '파생 옵션 코스피200');
    
    const valid = kospi200Options.filter((i: any) => parseFloat(i.clpr) > 0);
    console.log("Valid options with clpr > 0:", valid.length);
    if (valid.length > 0) {
        console.log("Sample valid option:", valid[0]);
    }
}

test();
