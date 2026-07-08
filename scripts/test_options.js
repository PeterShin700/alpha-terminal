const cheerio = require('cheerio');
const iconv = require('iconv-lite');

async function testOptionsScrape() {
  try {
    const url = `https://finance.naver.com/sise/sise_options.naver`;
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const html = iconv.decode(Buffer.from(buffer), 'EUC-KR');
    const $ = cheerio.load(html);
    
    console.log("Body preview:", $('body').text().substring(0, 500).replace(/\s+/g, ' '));
    
  } catch(e) {
    console.error(e);
  }
}

testOptionsScrape();
