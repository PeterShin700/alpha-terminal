import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol'); // e.g., '005930' for Samsung

  if (!symbol) {
    return NextResponse.json({ success: false, error: 'Symbol is required' }, { status: 400 });
  }
  
  // Translate to KRX standard code (ISIN)
  let isuCd = symbol;
  if (symbol === '005930') isuCd = 'KR7005930003';
  if (symbol === '000660') isuCd = 'KR7000660001';

  try {
    const url = `https://finance.naver.com/item/frgn.naver?code=${symbol}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Naver responded with status: ${res.status}`);
    }
    
    const buffer = await res.arrayBuffer();
    const iconv = await import('iconv-lite');
    const cheerio = await import('cheerio');
    
    const html = iconv.decode(Buffer.from(buffer), 'EUC-KR');
    const $ = cheerio.load(html);
    
    const formattedData: any[] = [];
    $('table.type2 tr').each((i, el) => {
      if (formattedData.length >= 5) return;
      const tds = $(el).find('td');
      if (tds.length >= 7) {
        const date = $(tds[0]).text().trim();
        const instStr = $(tds[5]).text().trim().replace(/,/g, '');
        const foreignStr = $(tds[6]).text().trim().replace(/,/g, '');
        
        if (date && date.includes('.')) {
          const inst = parseInt(instStr, 10) || 0;
          const foreign = parseInt(foreignStr, 10) || 0;
          // 개인 순매수는 (기관 + 외국인)의 반대로 추정 (기타법인 제외)
          const individual = -(inst + foreign);
          
          formattedData.push({
            date: date.replace(/\./g, ''), // 2026.07.15 -> 20260715
            institution: inst,
            foreign: foreign,
            individual: individual
          });
        }
      }
    });

    return NextResponse.json({ success: true, data: formattedData });

  } catch (error: any) {
    console.error("Error fetching KRX data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
