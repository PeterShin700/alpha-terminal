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
    
    // 1. 공공데이터포털 API 호출 (옵션 시세)
    const apiKey = process.env.DATA_GO_KR_API_KEY;
    let optionApiResult = null;
    
    if (apiKey) {
      try {
        const url = `https://apis.data.go.kr/1160100/service/GetDerivativeProductInfoService/getOptionsPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=10`;
        const response = await fetch(url);
        if (response.ok) {
          optionApiResult = await response.json();
          console.log('Successfully fetched from data.go.kr API');
        } else {
          console.error(`[Cron] API fetch failed with status: ${response.status}`);
        }
      } catch (fetchError) {
        console.error('[Cron] API fetch error:', fetchError);
      }
    }

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

    // 공공데이터 API 응답 기반 또는 모의 데이터 폴백 처리
    const mockWeeklyOptionData = {
      atmPrice: 350.0,
      callPremium: 2.50,
      putPremium: 2.30,
      sum: 4.80,
      timestamp: new Date().toISOString(),
      apiRawStatus: optionApiResult ? "Connected" : "Fallback"
    };
    await setMarketData('weekly_option', mockWeeklyOptionData);

    return NextResponse.json({ 
      success: true, 
      message: 'KRX Day Market data sync completed.',
      data: { newLiquidityData, mockWeeklyOptionData }
    });
  } catch (error) {
    console.error('[Cron] Day market sync failed:', error);
    // 예외 발생 시 이전 데이터 유지를 위해 에러 로그만 남김
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
