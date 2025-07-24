document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("weather-form") || document.getElementById("mv-weather-search");
  if (form) {
    form.addEventListener("submit", handleWeatherSearch);
  }
});

async function handleWeatherSearch(e) {
  e.preventDefault();
  const locationInput = document.getElementById("location");
  let location = locationInput.value.trim();

  // Clean and simplify input
  location = location.replace(/,/g, "");
  location = location.replace(/\s+/g, " ");

  if (!location) {
    alert("Please enter a location.");
    return;
  }

  try {
    const coords = await geocodeUS(location);
    const weatherData = await fetchWeather(coords.lat, coords.lon);
    displayForecast(weatherData);
  } catch (err) {
    console.error(err);
    alert("Could not retrieve weather data. Please try again.");
  }
}

async function geocodeUS(location) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
  const resp = await fetch(url);
  const data = await resp.json();

  const match = data.results?.[0];
  if (!match) {
    throw new Error("Geocode failed: no match found");
  }

  return {
    lat: match.latitude,
    lon: match.longitude,
  };
}

async function fetchWeather(lat, lon) {
const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=fahrenheit&timezone=auto`;
  const resp = await fetch(url);
  const data = await resp.json();
  return data;
}

function displayForecast(data) {
  const container = document.getElementById("forecast-cards");
  container.innerHTML = ""; // Clear previous cards

  const dates = data.daily.time;
  const highs = data.daily.temperature_2m_max;
  const lows = data.daily.temperature_2m_min;
  const rain = data.daily.precipitation_sum;

  for (let i = 0; i < dates.length; i++) {
    const card = document.createElement("div");
    card.className = "weather-card";
    card.innerHTML = `
      <h3>${dates[i]}</h3>
      <p><strong>High:</strong> ${highs[i]}°F</p>
      <p><strong>Low:</strong> ${lows[i]}°F</p>
      <p><strong>Rain:</strong> ${rain[i]} mm</p>
    `;
    container.appendChild(card);
  }
}
