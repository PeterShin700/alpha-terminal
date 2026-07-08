const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/DATA_GO_KR_DERIVATIVE_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

async function run() {
    const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=1&pageNo=1`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data.response.body.items.item[0], null, 2));
}

run();
