import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const KV_KEY = 'vkospi:history';
const MAX_DAYS = 60;

// Helper to format date as YYYYMMDD
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

// Fetch data from Public Data Portal
async function fetchVkospiData(targetDate: string) {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    throw new Error('DATA_GO_KR_API_KEY is missing');
  }

  // NOTE: This URL might need to be adjusted based on the exact API specification.
  // We assume the standard Financial Services Commission derivatives market API format.
  const baseUrl = 'https://apis.data.go.kr/1160100/api/rest/finaStatInfo/getDerivMarketPriceInfo';
  const url = `${baseUrl}?serviceKey=${apiKey}&resultType=json&basDt=${targetDate}&idxNm=VKOSPI`;

  // Timeout logic to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(url, { 
      next: { revalidate: 0 }, 
      signal: controller.signal 
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch data for ${targetDate}: ${res.statusText}`);
    }

    const data = await res.json();
    
    // Extract items from response
    // Typical structure: data.response.body.items.item
    const items = data?.response?.body?.items?.item || [];
    
    if (items.length === 0) {
      return null; // No data for this date
    }

    // Assuming we take the first matched item
    const item = items[0];
    const clpr = parseFloat(item.clpr);
    const iptVlty = parseFloat(item.iptVlty);

    // Validate data: if clpr or iptVlty is 0, treat as no trading day
    if (isNaN(clpr) || clpr === 0 || isNaN(iptVlty) || iptVlty === 0) {
      return null;
    }

    return {
      date: targetDate, // YYYYMMDD
      value: iptVlty, // Use implied volatility for VKOSPI chart
      clpr: clpr
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isInit = searchParams.get('init') === 'true';

  try {
    if (isInit) {
      // Initialization: Fetch last 60 days
      const results = [];
      const today = new Date();
      
      // We will loop back in time until we successfully get 60 valid trading days
      // To prevent infinite loops, we cap the search at 120 days backwards
      let daysBack = 0;
      
      // Clear existing list first
      await kv.del(KV_KEY);

      while (results.length < MAX_DAYS && daysBack < 120) {
        const d = new Date(today);
        d.setDate(d.getDate() - daysBack);
        const targetDate = formatDate(d);
        
        try {
          const item = await fetchVkospiData(targetDate);
          if (item) {
            // Push to front of our local array so the final list is chronological
            results.unshift(item);
          }
        } catch (err) {
          console.error(`Error fetching for ${targetDate}:`, err);
        }
        
        daysBack++;
        // Small delay to avoid API rate limit
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Bulk insert into KV (Redis)
      if (results.length > 0) {
        // RPUSH takes multiple arguments
        await kv.rpush(KV_KEY, ...results.map(r => JSON.stringify(r)));
      }

      return NextResponse.json({ message: 'Initialized successfully', count: results.length, data: results });
    } else {
      // Normal Cron Job: Fetch today's data
      const today = new Date();
      const targetDate = formatDate(today);
      
      const item = await fetchVkospiData(targetDate);
      if (!item) {
        return NextResponse.json({ message: 'No valid data for today (might be weekend or holiday). Skipping.' });
      }

      // Add to Redis list at the end
      await kv.rpush(KV_KEY, JSON.stringify(item));
      
      // Maintain 60-day window size
      const currentLength = await kv.llen(KV_KEY);
      if (currentLength > MAX_DAYS) {
        // Pop the oldest items from the left
        const exceedCount = currentLength - MAX_DAYS;
        for (let i = 0; i < exceedCount; i++) {
          await kv.lpop(KV_KEY);
        }
      }

      return NextResponse.json({ message: 'Updated successfully', data: item });
    }
  } catch (error: unknown) {
    console.error('VKOSPI Cron Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
