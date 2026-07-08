import { NextResponse } from 'next/server';
import { getMarketData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const liquidityData = await getMarketData('liquidity_day');
    const weeklyOptionData = await getMarketData('weekly_option');

    return NextResponse.json({
      success: true,
      data: {
        liquidity: liquidityData || null,
        weeklyOption: weeklyOptionData || null
      }
    });
  } catch (error) {
    console.error('[API] Failed to fetch market data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
