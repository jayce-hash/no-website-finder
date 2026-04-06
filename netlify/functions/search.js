exports.handler = async (event) => {
  const { query } = event.queryStringParameters || {};

  if (!query) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing query" }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  try {
    let allResults = [];
    let nextPageToken = null;
    let pageCount = 0;

    do {
      const url = nextPageToken
        ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${apiKey}`
        : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

      // Google requires a short delay before using a next_page_token
      if (nextPageToken) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const resp = await fetch(url);
      const data = await resp.json();

      if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: data.status, error_message: data.error_message, results: allResults }),
        };
      }

      if (data.results) {
        allResults = allResults.concat(data.results);
      }

      nextPageToken = data.next_page_token || null;
      pageCount++;

    } while (nextPageToken && pageCount < 3); // max 3 pages = up to 60 results

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "OK", results: allResults }),
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
