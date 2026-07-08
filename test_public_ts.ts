import { getEodOptionsStraddleSum } from './src/lib/public-data-api';

async function run() {
  const result = await getEodOptionsStraddleSum();
  console.log("Result:", result);
}
run();
