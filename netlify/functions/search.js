const https = require(‘https’);

exports.handler = async function(event) {
const query = event.queryStringParameters && event.queryStringParameters.query;

if (!query) {
return { statusCode: 400, body: JSON.stringify({ error: ‘Missing query parameter’ }) };
}

const key = process.env.GOOGLE_PLACES_API_KEY;
const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;

const data = await fetchJson(url);
return { statusCode: 200, body: JSON.stringify(data) };
};

function fetchJson(url) {
return new Promise((resolve, reject) => {
https.get(url, (res) => {
let raw = ‘’;
res.on(‘data’, chunk => raw += chunk);
res.on(‘end’, () => {
try { resolve(JSON.parse(raw)); }
catch (e) { reject(e); }
});
}).on(‘error’, reject);
});
}