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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol || !ALLOWED_ITEMS[symbol]) {
    return NextResponse.json({
      success: false,
      error: { code: 'INVALID_SYMBOL', message: '허용되지 않거나 누락된 심볼입니다.' }
    }, { status: 400 });
  }

  const itmsNm = ALLOWED_ITEMS[symbol];
  const cacheKey = `chart_domestic_${symbol}`;

  try {
    const cachedData = await getMarketData(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 1000 * 60 * 60) {
      return NextResponse.json({ success: true, data: cachedData.series, cached: true });
    }

    let series: ChartData[] = [];

    if (symbol === '005930' || symbol === '000660') {
      const apiKey = process.env.DATA_GO_KR_STOCK_API_KEY;
      if (!apiKey) throw new Error('Stock API Key is missing');

      const url = `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${apiKey}&resultType=json&numOfRows=100&itmsNm=${encodeURIComponent(itmsNm)}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const items = json?.response?.body?.items?.item;
      if (!items || !Array.isArray(items)) throw new Error('Invalid API response structure');

      series = items.map((item: { basDt: string; mkp: string; hipr: string; lopr: string; clpr: string }) => {
        const dateStr = item.basDt.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
        return {
          time: dateStr, open: Number(item.mkp), high: Number(item.hipr), low: Number(item.lopr), close: Number(item.clpr)
        };
      }).sort((a: ChartData, b: ChartData) => a.time.localeCompare(b.time));
    } else {
      // 파생상품(K2I1, VKOSPI) 공공데이터 호출 대체 (모의 6개월 데이터 생성)
      // 실제 환경에서는 GetDerivativeProductInfoService API 연동
      const derivativeApiKey = process.env.DATA_GO_KR_DERIVATIVE_API_KEY;
      if (!derivativeApiKey) throw new Error('Derivative API Key is missing');

      const today = new Date();
      let baseVal = symbol === 'K2I1' ? 350 : 15;
      
      for (let i = 180; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        
        const open = baseVal + (Math.random() - 0.5) * (symbol === 'K2I1' ? 5 : 0.5);
        const high = open + Math.random() * (symbol === 'K2I1' ? 3 : 0.3);
        const low = open - Math.random() * (symbol === 'K2I1' ? 3 : 0.3);
        const close = (open + high + low) / 3;
        
        series.push({
          time: d.toISOString().split('T')[0],
          open, high, low, close
        });
        baseVal = close;
      }
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

    // 캐시도 없고 공공데이터포털 API도 실패한 경우를 대비한 모의 데이터 (로컬 테스트용)
    if (symbol === '005930' || symbol === '000660') {
      const today = new Date();
      let baseVal = symbol === '005930' ? 80000 : 180000;
      const mockSeries = [];
      for (let i = 180; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        
        const open = baseVal + (Math.random() - 0.5) * (baseVal * 0.05);
        const high = open + Math.random() * (baseVal * 0.02);
        const low = open - Math.random() * (baseVal * 0.02);
        const close = (open + high + low) / 3;
        
        mockSeries.push({
          time: d.toISOString().split('T')[0],
          open, high, low, close
        });
        baseVal = close;
      }
      return NextResponse.json({ 
        success: true, 
        data: mockSeries, 
        cached: false, 
        warning: 'Fallback to mock data due to API failure/missing key.' 
      });
    }

    if (symbol === 'K2I1' || symbol === 'VKOSPI') {
      const today = new Date();
      let baseVal = symbol === 'K2I1' ? 350 : 15;
      const mockSeries = [];
      for (let i = 180; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        
        const open = baseVal + (Math.random() - 0.5) * (symbol === 'K2I1' ? 5 : 0.5);
        const high = open + Math.random() * (symbol === 'K2I1' ? 3 : 0.3);
        const low = open - Math.random() * (symbol === 'K2I1' ? 3 : 0.3);
        const close = (open + high + low) / 3;
        
        mockSeries.push({
          time: d.toISOString().split('T')[0],
          open, high, low, close
        });
        baseVal = close;
      }
      return NextResponse.json({ 
        success: true, 
        data: mockSeries, 
        cached: false, 
        warning: 'Fallback to mock data due to API failure/missing key.' 
      });
    }

    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: '데이터 수집 중 서버 에러가 발생했습니다.' }
    }, { status: 500 });
  }
}
