const cheerio = require('cheerio');
const iconv = require('iconv-lite');
async function run() {
  const url = 'https://finance.naver.com/item/frgn.naver?code=005930';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const buffer = await res.arrayBuffer();
  const html = iconv.decode(Buffer.from(buffer), 'EUC-KR');
  const $ = cheerio.load(html);
  
  const data = [];
  $('table.type2').each((i, table) => {
    $(table).find('tr').each((j, tr) => {
      const tds = $(tr).find('td');
      if (tds.length >= 7) {
        const date = $(tds[0]).text().trim();
        const inst = $(tds[5]).text().trim().replace(/,/g, '');
        const foreign = $(tds[6]).text().trim().replace(/,/g, '');
        if (date.includes('.')) {
          data.push({ date, inst, foreign });
        }
      }
    });
  });
  console.log(data.slice(0, 5));
}
run();
