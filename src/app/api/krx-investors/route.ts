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
    const apiKey = process.env.KRX_API_KEY;
    if (!apiKey) {
      console.warn("KRX_API_KEY is not set. Returning mock data.");
      return NextResponse.json({
        success: true,
        data: [
          { date: '20260713', foreign: 15000, institution: -5000, individual: -10000 },
          { date: '20260712', foreign: -2000, institution: 8000, individual: -6000 },
          { date: '20260711', foreign: 12000, institution: 3000, individual: -15000 },
          { date: '20260710', foreign: 8000, institution: 1000, individual: -9000 },
          { date: '20260709', foreign: -5000, institution: -2000, individual: 7000 },
        ]
      });
    }

    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear().toString();
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      return yyyy + mm + dd;
    };

    const endDd = formatDate(today);
    const strtDd = formatDate(lastWeek);

    // KRX Open API: 투자자별 거래실적 (개별종목)
    const url = `http://data-dbg.krx.co.kr/svc/apis/sto/stk_bydd_trd?isuCd=${isuCd}&strtDd=${strtDd}&endDd=${endDd}`;

    const res = await fetch(url, {
      headers: {
        'AUTH_KEY': apiKey
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        return NextResponse.json({ success: false, error: 'Unauthorized Key or Not Subscribed to Data Product' });
      }
      throw new Error(`KRX API responded with status: ${res.status}`);
    }

    const json = await res.json();
    if (json.respCode === '401') {
      return NextResponse.json({ success: false, error: json.respMsg || 'Unauthorized API Call' });
    }
    
    const rawData = json.OutBlock_1 || json.output || json.body?.items?.item || [];
    
    // mapping known fields from KRX
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedData = rawData.slice(0, 5).map((item: any) => ({
      date: item.TRD_DD || item.trdDd || item.basDd || '',
      foreign: Number(item.FORN_NTVAL_TRDVOL || item.fornNtvalTrdvol || item.forn_ntval_trdvol || 0),
      institution: Number(item.INST_NTVAL_TRDVOL || item.instNtvalTrdvol || item.inst_ntval_trdvol || 0),
      individual: Number(item.INDV_NTVAL_TRDVOL || item.indvNtvalTrdvol || item.indv_ntval_trdvol || 0),
    }));

    return NextResponse.json({ success: true, data: formattedData });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching KRX data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
