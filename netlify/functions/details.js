exports.handler = async (event) => {
  const { place_id } = event.queryStringParameters || {};

  if (!place_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing place_id" }) };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  const fields = "name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,url";
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=${fields}&key=${apiKey}`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
