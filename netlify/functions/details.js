const https = require(‘https’);

exports.handler = async function(event) {
const place_id = event.queryStringParameters && event.queryStringParameters.place_id;

if (!place_id) {
return { statusCode: 400, body: JSON.stringify({ error: ‘Missing place_id parameter’ }) };
}

const key = process.env.GOOGLE_PLACES_API_KEY;
const fields = ‘name,website,rating,user_ratings_total,business_status,formatted_phone_number’;
const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=${fields}&key=${key}`;

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