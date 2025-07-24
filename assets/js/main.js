document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mv-weather-search");
  if (form) {
    form.addEventListener("submit", handleWeatherSearch);
  }
});

async function handleWeatherSearch(e) {
  e.preventDefault();
  const locationInput = document.getElementById("location");
  const errorDiv = document.getElementById("error-message");
  const forecastContainer = document.getElementById("seven-day-forecast");
  forecastContainer.innerHTML = "";

  let location = locationInput.value.trim().replace(/,/g, "").replace(/\s+/g, " ");
  if (!location) {
    errorDiv.innerText = "Please enter a location.";
    errorDiv.style.display = "block";
    return;
  }

  try {
    const coords = await getLatLonFromNWS(location);
    await loadNWSForecast(coords.lat, coords.lon);
    errorDiv.style.display = "none";
  } catch (err) {
    console.error(err);
    errorDiv.innerText = "Could not load weather data for that location. Try a different city or ZIP.";
    errorDiv.style.display = "block";
  }
}

async function getLatLonFromNWS(location) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const resp = await fetch(url);
  const data = await resp.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Geocode failed");
  }

  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude
  };
}

async function loadNWSForecast(lat, lon) {
  const pointResp = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
  const pointData = await pointResp.json();
  const forecastURL = pointData.properties.forecast;

  const forecastResp = await fetch(forecastURL);
  const forecastData = await forecastResp.json();

  displayNWSForecast(forecastData.properties.periods);
}

function displayNWSForecast(periods) {
  const container = document.getElementById("seven-day-forecast");
  container.innerHTML = "";

  periods.slice(0, 7).forEach(period => {
    const card = document.createElement("div");
    card.className = "forecast-day";
    card.innerHTML = `
      <img src="${period.icon}" alt="${period.shortForecast}" class="weather-icon">
      <div class="forecast-info">
        <h4>${period.name}</h4>
        <p><strong>${period.temperature}°F</strong> – ${period.shortForecast}</p>
        <p>${period.windSpeed} ${period.windDirection}</p>
        <p><em>${period.detailedForecast}</em></p>
      </div>
    `;
    container.appendChild(card);
  });
}
