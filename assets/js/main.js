// main.js — Full Weather Search & NWS Forecast Integration with ZIP & City Search Support

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mv-weather-search") || document.getElementById("weather-form");
  if (form) {
    form.addEventListener("submit", handleWeatherSearch);
  }
});

async function handleWeatherSearch(e) {
  e.preventDefault();
  const input = document.getElementById("location");
  const location = input.value.trim().replace(/,/g, '').replace(/\s+/g, ' ');

  if (!location) {
    alert("Please enter a location.");
    return;
  }
async function getHistoricalWeather(zipCode) {
  try {
    // STEP 1: Convert ZIP to lat/lon using Open-Meteo Geocoding API
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?postal_code=${zipCode}&country=US`);
    const geoData = await geoRes.json();
    const location = geoData.results?.[0];
    if (!location) {
      alert("Could not find location for ZIP code.");
      return;
    }
    const { latitude, longitude, name, admin1 } = location;

    // STEP 2: Get date range for past 3 days
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today.setDate(today.getDate() - 3)).toISOString().split('T')[0];

    // STEP 3: Fetch historical data from Meteostat
    const apiKey = '4500430017msh37a9cc063754634p1bd356jsn1122cd12aa3e';

const url = 'https://meteostat.p.rapidapi.com/point/monthly?lat=52.5244&lon=13.4105&alt=43&start=2020-01-01&end=2020-12-31';

fetch(url, {
  method: 'GET',
  headers: {
    'x-rapidapi-host': 'meteostat.p.rapidapi.com',
    'x-rapidapi-key': apiKey
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('Meteostat data:', data);
    // You can now use this data in your UI
  })
  .catch(err => console.error('Error fetching Meteostat data:', err));


    // STEP 4: Render the results
    const container = document.getElementById("weather-history");
    container.innerHTML = `<h3>Past 3 Days: ${name}, ${admin1}</h3>`;
    historyData.data.forEach(day => {
      const card = document.createElement("div");
      card.className = "history-card";
      card.innerHTML = `
        <strong>${day.date}</strong><br>
        High: ${day.tmax} °F<br>
        Low: ${day.tmin} °F<br>
        Precip: ${day.prcp ?? 0} in
      `;
      container.appendChild(card);
    });

  } catch (error) {
    console.error("Error getting weather history:", error);
  }
}

  
  try {
    const { lat, lon, city, state } = await geocodeWithOpenMeteo(location);
    await loadNWSForecast(lat, lon);
  } catch (err) {
    console.error("Search error:", err);
    alert("Could not retrieve weather data. Please try again.");
  }
}

async function geocodeWithOpenMeteo(location) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
  const resp = await fetch(url);
  const data = await resp.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Geocode failed: no match found");
  }

  const match = data.results[0];
  return {
    lat: match.latitude,
    lon: match.longitude,
    city: match.name,
    state: match.admin1
  };
}

async function loadNWSForecast(lat, lon) {
  const pointUrl = `https://api.weather.gov/points/${lat.toFixed(6)},${lon.toFixed(6)}`;
  const pointResp = await fetch(pointUrl, {
    headers: {
      "User-Agent": "MeteoVeritas (https://meteoveritas.netlify.app, contact@example.com)"
    }
  });

  if (!pointResp.ok) {
    throw new Error(`NWS point lookup failed: ${pointResp.status}`);
  }

  const pointData = await pointResp.json();
  const forecastUrl = pointData.properties?.forecast;

  if (!forecastUrl) {
    console.error("NWS forecast URL not found in response:", pointData);
    throw new Error("NWS forecast URL not found");
  }

  const forecastResp = await fetch(forecastUrl, {
    headers: {
      "User-Agent": "MeteoVeritas (https://meteoveritas.netlify.app, contact@example.com)"
    }
  });

  const forecastData = await forecastResp.json();
  displayNWSForecast(forecastData.properties.periods);
}

function displayNWSForecast(periods) {
  const container = document.getElementById("seven-day-forecast");
  if (!container) return;
  container.innerHTML = "";

  const forecastRow = document.createElement("div");
  forecastRow.style.display = "flex";
  forecastRow.style.flexWrap = "wrap";
  forecastRow.style.justifyContent = "space-between";
  forecastRow.style.gap = "1rem";

  periods.slice(0, 7).forEach(period => {
    const card = document.createElement("div");
    card.className = "forecast-day";
    card.style.flex = "1 1 120px";
    card.style.border = "1px solid #ccc";
    card.style.borderRadius = "8px";
    card.style.padding = "10px";
    card.style.background = "#fff";
    card.style.textAlign = "center";

    card.innerHTML = `
      <img class="weather-icon" src="${period.icon}" alt="${period.shortForecast}" style="width:60px;height:60px">
      <div class="forecast-info">
        <h4>${period.name}</h4>
        <p><strong>${period.temperature}°${period.temperatureUnit}</strong></p>
        <p>${period.shortForecast}</p>
        <p style="font-size:0.85em;color:#555">${period.detailedForecast}</p>
      </div>
    `;

    forecastRow.appendChild(card);
  });

  container.appendChild(forecastRow);
}
