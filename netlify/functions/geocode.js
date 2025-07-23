export async function handler(event) {
  const address = event.queryStringParameters.address;

  if (!address) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing address parameter" }),
    };
  }

  const baseUrl = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';
  const url = `${baseUrl}?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Geocoding failed', details: error.message }),
    };
  }
}
