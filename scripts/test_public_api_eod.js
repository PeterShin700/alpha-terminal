const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/DATA_GO_KR_DERIVATIVE_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

async function testApi() {
    try {
        const basDt = '20240705'; // Use a confirmed past date from 2024
        const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=5&pageNo=1&basDt=${basDt}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); 

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        if(data.response && data.response.body && data.response.body.items) {
            const items = data.response.body.items.item;
            console.log(`Found ${items.length} items`);
            if(items.length > 0) {
                 console.log("Sample Item:", items[0]);
            }
        } else {
             console.log("Error or no items:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("API Error:", e.name, e.message);
    }
}

testApi();
