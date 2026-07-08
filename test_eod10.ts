import { loadEnvConfig } from '@next/env';
import path from 'path';
loadEnvConfig(path.join(process.cwd()));
import { getEodOptionsStraddleSum } from './src/lib/public-data-api';

async function run() {
  try {
    const result = await getEodOptionsStraddleSum();
    console.log("Result items length:", result?.items?.length);
    console.log("Sample items:", result?.items?.slice(0, 3));
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
