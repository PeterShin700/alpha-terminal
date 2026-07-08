const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/DATA_GO_KR_DERIVATIVE_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

async function testApi() {
    console.log("Key extracted:", apiKey ? apiKey.substring(0, 10) + "..." : "null");
    try {
        const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=10&pageNo=1`;
        console.log("Fetching URL...");
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.text();
        console.log("Response:", data.substring(0, 500));
    } catch (e) {
        console.error("API Error:", e.name, e.message);
    }
}

testApi();
