import { NextResponse } from 'next/server';
import { setMarketData } from '@/lib/data-store';
import { validateLiquiditySchema } from '@/lib/data-fetcher';
import { fetchNaverInvestorNet, fetchNaverProgramTrading } from '@/lib/naver-scraper';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Day Market Cron Triggered: Fetching KRX Day Data...');
    
    // 2. 네이버 투자자별 순매수 및 프로그램 매매 동향 크롤링
    const investorNet = await fetchNaverInvestorNet();
    const programTrend = await fetchNaverProgramTrading();

    const newLiquidityData = {
      investorNet: investorNet,
      programTrading: { trend: programTrend },
      timestamp: new Date().toISOString()
    };

    // 3. Schema 검증 및 이전 데이터 유지 (Fallback)
    if (validateLiquiditySchema(newLiquidityData)) {
      await setMarketData('liquidity_day', newLiquidityData);
      console.log('[Cron] Liquidity data saved to KV.');
    } else {
      console.error('[Cron] Liquidity data validation failed. Falling back to previous data.');
      // 별도 저장 없이 로깅만 수행 (이전 데이터 유지)
    }

    // 공공데이터 API EOD 응답 기반 폴백 처리
    let weeklyOptionData = null;
    try {
      const { getEodOptionsStraddleSum } = await import('@/lib/public-data-api');
      const eodData = await getEodOptionsStraddleSum();
      
      if (eodData) {
        weeklyOptionData = {
          atmPrice: eodData.atmStrike,
          callPremium: eodData.call,
          putPremium: eodData.put,
          sum: eodData.sum,
          items: eodData.items,
          timestamp: new Date().toISOString(),
          apiRawStatus: "Public Data API (EOD)"
        };
      } else {
        weeklyOptionData = null;
      }
    } catch (e) {
      console.error("EOD API Fetch error:", e);
      weeklyOptionData = null;
    }
    
    await setMarketData('weekly_option', weeklyOptionData);

    console.log('Successfully collected day market data.');
    return NextResponse.json({ 
      success: true, 
      message: 'KRX Day Market data sync completed.',
      data: { newLiquidityData, weeklyOptionData }
    });
  } catch (error) {
    console.error('[Cron] Day market sync failed:', error);
    // 예외 발생 시 이전 데이터 유지를 위해 에러 로그만 남김
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
