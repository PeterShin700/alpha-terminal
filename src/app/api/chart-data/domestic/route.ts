import { NextResponse } from 'next/server';
import { getMarketData, setMarketData } from '@/lib/data-store';

const ALLOWED_ITEMS: Record<string, string> = {
  '005930': '삼성전자',
  '000660': 'SK하이닉스',
  'K2I1': '코스피200선물',
  'VKOSPI': 'VKOSPI'
};

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol || !ALLOWED_ITEMS[symbol]) {
    return NextResponse.json({
      success: false,
      error: { code: 'INVALID_SYMBOL', message: '허용되지 않거나 누락된 심볼입니다.' }
    }, { status: 400 });
  }

  const cacheKey = `chart_domestic_v5_${symbol}`;

  try {
    const cachedData = await getMarketData(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 1000 * 60 * 60) {
      return NextResponse.json({ success: true, data: cachedData.series, cached: true });
    }

    let series: ChartData[] = [];

    if (symbol === '005930' || symbol === '000660' || symbol === 'K2I1') {
      let yahooSymbol = '';
      if (symbol === '005930') yahooSymbol = '005930.KS';
      else if (symbol === '000660') yahooSymbol = '000660.KS';
      else if (symbol === 'K2I1') yahooSymbol = '^KS200';

      const period1 = new Date();
      period1.setMonth(period1.getMonth() - 6);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = await yahooFinance.chart(yahooSymbol, { period1, interval: '1d' });
      
      if (!result || !result.quotes || result.quotes.length === 0) {
        throw new Error('Yahoo Finance returned no data');
      }

      series = result.quotes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((q: any) => q.open !== null && q.high !== null && q.low !== null && q.close !== null)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((q: any) => ({
          time: q.date.toISOString().split('T')[0],
          open: q.open as number,
          high: q.high as number,
          low: q.low as number,
          close: q.close as number
        }));
    } else if (symbol === 'VKOSPI') {
      throw new Error('VKOSPI 데이터는 현재 지원되지 않는 지표입니다. (증권사 API 연동 대기중)');
    }

    await setMarketData(cacheKey, { series, timestamp: Date.now() });

    return NextResponse.json({ success: true, data: series, cached: false });
  } catch (error) {
    console.error(`[Domestic Chart API] Failed to fetch data for ${symbol}:`, error);
    
    const fallbackData = await getMarketData(cacheKey);
    if (fallbackData) {
      return NextResponse.json({ 
        success: true, 
        data: fallbackData.series, 
        cached: true, 
        warning: 'Fallback to cached data due to API failure.' 
      });
    }

    // API 실패 시 모의 데이터 제공을 중단하고 실패 반환
    if (symbol === '005930' || symbol === '000660') {
      return NextResponse.json({ 
        success: false, 
        error: '데이터를 불러오지 못했습니다.' 
      }, { status: 500 });
    }

    if (symbol === 'K2I1' || symbol === 'VKOSPI') {
      return NextResponse.json({ 
        success: false, 
        error: '데이터를 불러오지 못했습니다.' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: '데이터 수집 중 서버 에러가 발생했습니다.' }
    }, { status: 500 });
  }
}
