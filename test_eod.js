require('dotenv').config({ path: '.env.local' });
const { getEodOptionsStraddleSum } = require('./src/lib/public-data-api');

async function test() {
    const res = await getEodOptionsStraddleSum();
    console.log(res);
}

test();
