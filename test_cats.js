const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/DATA_GO_KR_DERIVATIVE_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

async function run() {
    const basDt = '20240705';
    const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=10000&pageNo=1&basDt=${basDt}`;
    const response = await fetch(url);
    const data = await response.json();
    const items = data.response.body.items.item;
    const categories = new Set(items.map(i => i.prdCtg));
    console.log("Categories:", Array.from(categories));
    
    // Check an item for weekly option
    const weeklies = items.filter(i => i.prdCtg.includes('위클리'));
    console.log("Weeklies count:", weeklies.length);
    if(weeklies.length > 0) console.log("Sample Weekly:", weeklies[0]);
}

run();
