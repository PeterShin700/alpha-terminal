const cheerio = require('cheerio');
const iconv = require('iconv-lite');

async function testScrape() {
  try {
    const url = `https://finance.naver.com/sise/investorDealTrendDay.naver`;
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const html = iconv.decode(Buffer.from(buffer), 'EUC-KR');
    const $ = cheerio.load(html);
    
    console.log("Dumping investorDealTrendDay.naver without bizdate:");
    $('table.type_1 tr').each((i, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (i < 5) console.log(text);
    });
  } catch(e) {
    console.error(e);
  }
}

testScrape();
