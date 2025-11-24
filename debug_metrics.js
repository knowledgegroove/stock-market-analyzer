const https = require('https');

const apiKey = process.env.STOCK_API_KEY || 'd4hn9m9r01quqml9ol90d4hn9m9r01quqml9ol9g';
const symbol = 'AAPL';

const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.error(e);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
