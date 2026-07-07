/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import { NextResponse } from 'next/server';
import https from 'https';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';

// Let's use robust import based on what worked in global/route.ts

// Fallback data in case CFTC or Yahoo fails
const FALLBACK_DATA = [
  {
    asset: '나스닥 100',
    position: 'Long 65% / Short 35%',
    support: '19,500',
    resistance: '20,200'
  },
  {
    asset: 'WTI 오일',
    position: 'Long 40% / Short 60%',
    support: '$75.00',
    resistance: '$82.50'
  }
];

// Simple in-memory cache
let cachedData: any = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

// Helper to download and parse CFTC zip
async function fetchAndParseCot(url: string, searchStr: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      const data: Buffer[] = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        try {
          const buffer = Buffer.concat(data);
          const zip = new AdmZip(buffer);
          const entries = zip.getEntries();
          if (entries.length > 0) {
            const txt = entries[0].getData().toString('utf8');
            const records = parse(txt, { columns: true, skip_empty_lines: true });
            const match = records.find((r: any) => 
              r['Market_and_Exchange_Names'] && 
              r['Market_and_Exchange_Names'].includes(searchStr)
            );
            resolve(match || null);
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error("ZIP Parse Error:", e);
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.error("Fetch Error:", e);
      resolve(null);
    });
  });
}

function calculateRatio(longStr: string, shortStr: string) {
  const long = parseInt(longStr || '0', 10);
  const short = parseInt(shortStr || '0', 10);
  const total = long + short;
  if (total === 0) return 'Long 50% / Short 50%';
  const longPct = Math.round((long / total) * 100);
  const shortPct = 100 - longPct;
  return `Long ${longPct}% / Short ${shortPct}%`;
}

function formatNumber(num: number | undefined | null, prefix = '') {
  if (!num) return '-';
  return prefix + num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export async function GET() {
  try {
    if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
      return NextResponse.json({ success: true, data: cachedData, cached: true });
    }

    // Initialize YahooFinance
    let yahooFinance;
    try {
        const yfModule = require('yahoo-finance2');
        yahooFinance = yfModule.YahooFinance ? new yfModule.YahooFinance() : yfModule.default || yfModule;
    } catch(e) {
        console.error("Yahoo finance init error", e);
    }

    const currentYear = new Date().getFullYear();
    const urlFin = `https://www.cftc.gov/files/dea/history/fut_fin_txt_${currentYear}.zip`;
    const urlDisagg = `https://www.cftc.gov/files/dea/history/fut_disagg_txt_${currentYear}.zip`;

    // Fetch COT Data
    const [nqCot, wtiCot] = await Promise.all([
      fetchAndParseCot(urlFin, 'NASDAQ-100 Consolidated'),
      fetchAndParseCot(urlDisagg, 'CRUDE OIL')
    ]);

    // Fetch Yahoo Quotes
    let nqQuote, wtiQuote;
    if (yahooFinance && typeof yahooFinance.quote === 'function') {
        try {
            [nqQuote, wtiQuote] = await Promise.all([
                yahooFinance.quote('NQ=F'),
                yahooFinance.quote('CL=F')
            ]);
        } catch(e) {
            console.error("Yahoo quote error", e);
        }
    }

    const resultData = [];

    // Nasdaq
    const nqPosition = nqCot 
      ? calculateRatio(nqCot['Lev_Money_Positions_Long_All'], nqCot['Lev_Money_Positions_Short_All'])
      : FALLBACK_DATA[0].position;
    
    resultData.push({
      asset: '나스닥 100',
      position: nqPosition,
      support: nqQuote?.fiftyDayAverage ? formatNumber(nqQuote.fiftyDayAverage) : FALLBACK_DATA[0].support,
      resistance: nqQuote?.twoHundredDayAverage ? formatNumber(nqQuote.twoHundredDayAverage) : FALLBACK_DATA[0].resistance
    });

    // WTI
    const wtiPosition = wtiCot
      ? calculateRatio(wtiCot['M_Money_Positions_Long_All'], wtiCot['M_Money_Positions_Short_All'])
      : FALLBACK_DATA[1].position;
      
    resultData.push({
      asset: 'WTI 오일',
      position: wtiPosition,
      support: wtiQuote?.fiftyDayAverage ? formatNumber(wtiQuote.fiftyDayAverage, '$') : FALLBACK_DATA[1].support,
      resistance: wtiQuote?.twoHundredDayAverage ? formatNumber(wtiQuote.twoHundredDayAverage, '$') : FALLBACK_DATA[1].resistance
    });

    cachedData = resultData;
    cacheTime = Date.now();

    return NextResponse.json({ success: true, data: resultData });
  } catch (error) {
    console.error('Macro API Error:', error);
    return NextResponse.json({ success: true, data: FALLBACK_DATA, isFallback: true });
  }
}
