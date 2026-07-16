const cheerio = require('cheerio');
const iconv = require('iconv-lite');
async function run() {
  const url = 'https://finance.naver.com/item/frgn.naver?code=005930';
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const html = iconv.decode(Buffer.from(buffer), 'EUC-KR');
  const $ = cheerio.load(html);
  
  const data = [];
  $('table.type2 tr').each((i, el) => {
    const tds = $(el).find('td');
    if (tds.length >= 7) {
      const date = $(tds[0]).text().trim();
      const inst = $(tds[5]).text().trim().replace(/,/g, '');
      const foreign = $(tds[6]).text().trim().replace(/,/g, '');
      if (date && date.includes('.')) {
        data.push({ date, inst, foreign });
      }
    }
  });
  console.log(data.slice(0, 5));
}
run();
