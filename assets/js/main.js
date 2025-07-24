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
  const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;
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

  periods.slice(0, 7).forEach(period => {
    const card = document.createElement("div");
    card.className = "forecast-day";
    card.innerHTML = `
      <img class="weather-icon" src="${period.icon}" alt="${period.shortForecast}">
      <div class="forecast-info">
        <h4>${period.name}</h4>
        <p><strong>${period.temperature}°${period.temperatureUnit}</strong> — ${period.shortForecast}</p>
        <p>${period.detailedForecast}</p>
      </div>
    `;
    container.appendChild(card);
  });
}
