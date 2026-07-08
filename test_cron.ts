import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.join(process.cwd()));

async function run() {
  try {
    const { getEodOptionsStraddleSum } = await import('./src/lib/public-data-api');
    const eodData = await getEodOptionsStraddleSum();
    console.log("EOD Data:", !!eodData);
    if(eodData) {
        console.log("ATM:", eodData.atmStrike);
        console.log("Sum:", eodData.sum);
    }
  } catch (e) {
    console.error("EOD API Fetch error:", e);
  }
}
run();
