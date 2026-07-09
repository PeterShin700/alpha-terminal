import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const KV_KEY = 'vkospi:history';

export async function GET() {
  try {
    // LRANGE 0 -1 fetches all items in the list (O(N) operation, but N is max 60, so very fast)
    const rawData = await kv.lrange(KV_KEY, 0, -1);
    
    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Let's handle both string and object cases safely.
    const chartData = rawData.map((item: unknown) => {
      const parsed = typeof item === 'string' ? JSON.parse(item) : (item as Record<string, unknown>);
      let displayDate = parsed.date;
      if (displayDate && displayDate.length === 8) {
        displayDate = `${displayDate.slice(4, 6)}/${displayDate.slice(6, 8)}`;
      }

      return {
        date: displayDate,
        value: parsed.value || 0, // Fallback to 0 if missing
      };
    });

    return NextResponse.json({ data: chartData });
  } catch (error: unknown) {
    console.error('VKOSPI Chart API Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
