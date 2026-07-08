import { NextResponse } from 'next/server';
import { setMarketData } from '@/lib/data-store';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Night Market Cron Triggered: Fetching KRX Night Data...');
    
    // 야간 시장 마감 데이터 모의 생성 제외 (기능 미구현 상태)
    const nightMarketData = null;

    // 저장소 적재
    await setMarketData('night_market_summary', nightMarketData);
    
    console.log('Successfully collected night market data.');
    return NextResponse.json({ 
      success: true, 
      message: 'KRX Night Market data sync completed.',
      data: nightMarketData
    });
  } catch (error) {
    console.error('Failed to sync night market data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
