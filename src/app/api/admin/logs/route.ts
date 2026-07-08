import { NextResponse } from 'next/server';
import { getMarketData } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await getMarketData('straddle_logs') || [];
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to read logs:", error);
    return NextResponse.json({ error: "Failed to read logs" }, { status: 500 });
  }
}
