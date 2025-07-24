document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mv-weather-search");
  if (form) {
    form.addEventListener("submit", handleWeatherSearch);
  }
});

async function handleWeatherSearch(e) {
  e.preventDefault();
  const input = document.getElementById("location");
  let location = input.value.trim().replace(/,/g, "").replace(/\s+/g, " ");
  if (!location) {
    alert("Please enter a location.");
    return;
  }

  try {
    const coords = await geocodeWithOpenMeteo(location);
    const forecastData = await fetchNWSForecast(coords.lat, coords.lon);
    displayNWSForecast(forecastData);
  } catch (err) {
    console.error(err);
    alert("Could not retrieve weather data. Please try again.");
  }
}

async function geocodeWithOpenMeteo(location) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const resp = await fetch(url);
  const data = await resp.json();
  const match = data.results?.[0];
  if (!match) throw new Error("No location match found");
  return { lat: match.latitude, lon: match.longitude };
}

async function fetchNWSForecast(lat, lon) {
  const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;
  const pointResp = await fetch(pointUrl);
  const pointData = await pointResp.json();
  const forecastUrl = pointData.properties.forecast;
  const forecastResp = await fetch(forecastUrl);
  return await forecastResp.json();
}

function displayNWSForecast(forecastData) {
  const container = document.getElementById("mv-weather-results");
  container.innerHTML = "";
  const periods = forecastData.properties.periods;

  periods.slice(0, 6).forEach(period => {
    const card = document.createElement("div");
    card.className = "mv-forecast-card";
    card.innerHTML = `
      <h3>${period.name}</h3>
      <img src="${period.icon}" alt="${period.shortForecast}" />
      <p><strong>${period.temperature}°F</strong> – ${period.shortForecast}</p>
      <p><em>${period.windDirection} ${period.windSpeed}</em></p>
      <p>${period.detailedForecast}</p>
    `;
    container.appendChild(card);
  });
}
