import * as fs from 'fs';
import { getEodOptionsStraddleSum } from './src/lib/public-data-api';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/DATA_GO_KR_DERIVATIVE_API_KEY=(.*)/);
if (match) {
    process.env.DATA_GO_KR_DERIVATIVE_API_KEY = match[1].trim();
}

async function test() {
    try {
        const res = await getEodOptionsStraddleSum();
        console.log("Result:", res);
    } catch (e) {
        console.error("Test script caught error:", e);
    }
}

test();
