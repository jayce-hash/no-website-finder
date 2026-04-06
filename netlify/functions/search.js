exports.handler = async (event) => {
  const { query } = event.queryStringParameters || {};

  if (!query) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing query" }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchPage = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      const resp = await fetch(url);
      const data = await resp.json();
      // INVALID_REQUEST on a page token just means it's not ready yet — retry
      if (data.status === 'INVALID_REQUEST' && i < retries - 1) {
        await sleep(2500);
        continue;
      }
      return data;
    }
  };

  try {
    let allResults = [];
    let nextPageToken = null;
    let pageCount = 0;

    do {
      const url = nextPageToken
        ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${encodeURIComponent(nextPageToken)}&key=${apiKey}`
        : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

      if (nextPageToken) {
        await sleep(3000);
      }

      const data = await fetchPage(url);

      if (!data) break;

      if (data.status === 'REQUEST_DENIED') {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: 'REQUEST_DENIED', error_message: data.error_message, results: allResults }),
        };
      }

      // ZERO_RESULTS on first page is fine — just return empty
      if (data.status === 'ZERO_RESULTS' && pageCount === 0) {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: 'OK', results: [] }),
        };
      }

      if (data.results && data.results.length > 0) {
        allResults = allResults.concat(data.results);
      }

      nextPageToken = data.next_page_token || null;
      pageCount++;

    } while (nextPageToken && pageCount < 3);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: 'OK', results: allResults }),
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
