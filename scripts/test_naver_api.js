const cheerio = require('cheerio');

async function checkNaverMobile() {
    // try to fetch kospi 200 index
    const res = await fetch('https://m.stock.naver.com/api/index/KOSPI200/basic');
    const data = await res.json();
    console.log("KOSPI 200:", data.closePrice);

    // Is there options?
    // Let's try searching for options API on github
}
checkNaverMobile();
