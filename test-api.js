const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/DATA_GO_KR_STOCK_API_KEY=(.+)/);
if (!urlMatch) { console.error('No API Key'); process.exit(1); }
let apiKey = urlMatch[1].trim();
if (apiKey.startsWith('"')) apiKey = apiKey.slice(1, -1);

async function fetchAll() {
  const url = `https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService/getStockMarketIndex?serviceKey=${apiKey}&resultType=json&numOfRows=1000`;
  const res = await fetch(url);
  const json = await res.json();
  const items = json.response?.body?.items?.item || [];
  const names = Array.from(new Set(items.map(i => i.idxNm)));
  console.log("Found", names.length, "unique index names");
  console.log(names.filter(n => n.includes('코스피') || n.includes('KOSPI') || n.includes('변동성') || n.includes('200')));
}
fetchAll();
