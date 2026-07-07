import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import { getMarketData, setMarketData } from '@/lib/data-store';

const ALLOWED_SYMBOLS = ['NQ=F', 'CL=F']; // 나스닥 100, 크루드 오일

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol || !ALLOWED_SYMBOLS.includes(symbol)) {
    return NextResponse.json({
      success: false,
      error: { code: 'INVALID_SYMBOL', message: '허용되지 않거나 누락된 심볼입니다.' }
    }, { status: 400 });
  }

  const cacheKey = `chart_global_${symbol}`;

  try {
    // 1. 캐시 확인
    const cachedData = await getMarketData(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 1000 * 60 * 60) {
      // 1시간 이내 캐시 사용
      return NextResponse.json({ success: true, data: cachedData.series, cached: true });
    }

    // 2. 야후 파이낸스 과거 데이터(최근 6개월) 조회
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 6);
    const queryOptions = { period1, interval: '1d' as const };
    const result = await yahooFinance.chart(symbol, queryOptions);

    // 3. Lightweight Charts 형식으로 포맷팅 및 Timezone 보정
    interface YahooQuote { open: number | null; close: number | null; high: number | null; low: number | null; date: Date; }
    const series = result.quotes
      .filter((item: YahooQuote) => item.open !== null && item.close !== null)
      .map((item: YahooQuote) => {
        // 시간 기준을 YYYY-MM-DD 포맷 스트링으로 변환하여 일관성 유지
        const dateStr = item.date.toISOString().split('T')[0];
        return {
          time: dateStr,
          open: item.open,
          high: item.high,
          low: item.low,

          close: item.close
        };
      });

    // 4. 데이터 저장 (캐싱)
    await setMarketData(cacheKey, { series, timestamp: Date.now() });

    return NextResponse.json({ success: true, data: series, cached: false });
  } catch (error) {
    console.error(`[Global Chart API] Failed to fetch data for ${symbol}:`, error);
    
    // 에러 발생 시 Fallback (캐시된 이전 데이터 제공)
    const fallbackData = await getMarketData(cacheKey);
    if (fallbackData) {
      return NextResponse.json({ 
        success: true, 
        data: fallbackData.series, 
        cached: true, 
        warning: 'Fallback to cached data due to API failure.' 
      });
    }

    // 완전히 데이터가 없는 경우 표준 에러 반환
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: '데이터 수집 중 서버 에러가 발생했습니다.' }
    }, { status: 500 });
  }
}
