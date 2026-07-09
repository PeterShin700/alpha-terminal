import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';
const KV_KEY = 'vkospi:history';

async function getLrange() {
  if (process.env.REDIS_URL || (process.env.KV_URL && !process.env.KV_REST_API_URL)) {
    const redis = new Redis(process.env.REDIS_URL || process.env.KV_URL!);
    const data = await redis.lrange(KV_KEY, 0, -1);
    redis.disconnect();
    return data;
  }
  return await kv.lrange(KV_KEY, 0, -1);
}

export async function GET() {
  try {
    const rawData = await getLrange();
    
    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const chartData = rawData.map((item: unknown) => {
      const parsed = typeof item === 'string' ? JSON.parse(item) : (item as Record<string, unknown>);
      let displayDate = parsed.date as string | undefined;
      // Convert 'YYYYMMDD' to 'YYYY-MM-DD' for Lightweight Charts
      if (displayDate && displayDate.length === 8) {
        displayDate = `${displayDate.slice(0, 4)}-${displayDate.slice(4, 6)}-${displayDate.slice(6, 8)}`;
      }

      return {
        time: displayDate, // Lightweight Charts requires 'time' field
        value: parsed.value || 0,
      };
    });

    return NextResponse.json({ success: true, data: chartData });
  } catch (error: unknown) {
    console.error('VKOSPI Chart API Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
