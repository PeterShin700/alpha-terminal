import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export async function fetchNaverInvestorNet(): Promise<{ foreign: number, institution: number }> {
    try {
        const url = `https://finance.naver.com/sise/sise_index.naver?code=KOSPI`;
        const res = await fetch(url, { cache: 'no-store' });
        const buffer = await res.arrayBuffer();
        const html = iconv.decode(Buffer.from(buffer), 'EUC-KR');
        const $ = cheerio.load(html);
        
        let foreign = 0;
        let institution = 0;

        // Use regex parsing to reliably grab the values from the raw body text
        const bodyText = $('body').text().replace(/\s+/g, ' ');

        const foreignMatch = bodyText.match(/외국인\s*([-+]?[\d,]+)/);
        const instMatch = bodyText.match(/기관\s*([-+]?[\d,]+)/);

        if (foreignMatch) foreign = parseInt(foreignMatch[1].replace(/,/g, ''), 10);
        if (instMatch) institution = parseInt(instMatch[1].replace(/,/g, ''), 10);

        return { foreign, institution };
    } catch (e) {
        console.error("fetchNaverInvestorNet error:", e);
        return { foreign: 0, institution: 0 };
    }
}

export async function fetchNaverProgramTrading(): Promise<number[]> {
    try {
        const url = `https://finance.naver.com/sise/sise_program.naver`;
        const res = await fetch(url, { cache: 'no-store' });
        const buffer = await res.arrayBuffer();
        const html = iconv.decode(Buffer.from(buffer), 'EUC-KR');
        const $ = cheerio.load(html);
        
        const trend: number[] = [];
        
        let iframeSrc = '';
        $('iframe').each((i, el) => {
            const src = $(el).attr('src');
            if (src && src.includes('programDealTrendDay')) {
                iframeSrc = src;
            }
        });

        if (iframeSrc) {
            const fullUrl = `https://finance.naver.com${iframeSrc}`;
            const iframeRes = await fetch(fullUrl, { cache: 'no-store' });
            const iframeBuffer = await iframeRes.arrayBuffer();
            const iframeHtml = iconv.decode(Buffer.from(iframeBuffer), 'EUC-KR');
            const $iframe = cheerio.load(iframeHtml);

            $iframe('table.type_1 tr').each((i, el) => {
                if (trend.length >= 5) return;
                const tds = $iframe(el).find('td');
                if (tds.length >= 8) {
                    const dateText = $iframe(tds[0]).text().trim();
                    const nonArbNetText = $iframe(tds[6]).text().replace(/,/g, '').trim();
                    if (dateText && dateText !== '날짜' && !isNaN(parseInt(nonArbNetText, 10))) {
                        trend.push(parseInt(nonArbNetText, 10));
                    }
                }
            });
        }

        return trend.reverse();
    } catch (e) {
        console.error("fetchNaverProgramTrading error:", e);
        return [];
    }
}
