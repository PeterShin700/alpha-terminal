const yahooFinance = require('yahoo-finance2').default;

async function test() {
  try {
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 6);
    const queryOptions = { period1, interval: '1d' };
    console.log("Fetching NQ=F...");
    const result = await yahooFinance.historical('NQ=F', queryOptions);
    console.log("Success! Data length:", result.length);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
