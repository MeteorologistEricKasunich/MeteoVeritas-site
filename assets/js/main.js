/* MeteoVeritas main.js
 * Basic live NWS forecast integration
 * v0.1
 */

/* ====== CONFIG ====== */
const USER_AGENT = "MeteoVeritasSite/0.1 (+https://YOUR-SITE.netlify.app; contact=erickasunichweather@gmail.com)"; // NWS asks for identifying User-Agent. 
const CENSUS_GEOCODE_BASE = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"; // U.S. Census Geocoding API. 

/* ====== UTILITIES ====== */
function qs(id){return document.getElementById(id);}
function escapeQuery(q){return encodeURIComponent(q.trim());}

function showLoading(el){
  el.classList.add("loading");
  el.innerHTML = "";
}
function clearLoading(el){
  el.classList.remove("loading");
}
function showError(el,msg){
  clearLoading(el);
  el.innerHTML = `<div class="mv-weather-error">${msg}</div>`;
}

/* ====== YEAR FOOTER ====== */
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('mv-year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  const form = qs('mv-weather-search');
  if (form) {
    form.addEventListener('submit', handleWeatherSearch);
  }
});

/* ====== MAIN SEARCH HANDLER ====== */
async function handleWeatherSearch(e){
  e.preventDefault();
  const locStr = qs('mv-location-input').value;
  const out = qs('mv-weather-results');
  if(!locStr){
    showError(out,"Please enter a location (City, ST or ZIP).");
    return;
  }
  showLoading(out);

  try {
    const {lat, lon, matchedAddress} = await geocodeUS(locStr);
    if(lat == null || lon == null){
      showError(out, "Sorry, couldn't find that location. Try City, ST or ZIP.");
      return;
    }
    const pointData = await getNwsPoint(lat, lon);
    if(!pointData || !pointData.properties){
      showError(out,"NWS point lookup failed.");
      return;
    }
    const forecastUrl = pointData.properties.forecast;
    const hourlyUrl   = pointData.properties.forecastHourly;
    const office      = pointData.properties.cwa;
    const city        = pointData.properties.relativeLocation?.properties?.city || "";
    const state       = pointData.properties.relativeLocation?.properties?.state || "";

    const forecastData = await getJson(forecastUrl); // 12h/periods forecast. 
    clearLoading(out);
    renderForecast(out, {locStr, matchedAddress, city, state, office, forecastData, hourlyUrl});
  } catch(err){
    console.error(err);
    showError(out,"Error getting weather data. Please try again.");
  }
}

/* ====== GEOCODING (U.S. Census Geocoder) ======
 * We send the user string in the 'address' param (onelineaddress mode).
 * Sample: ?address=Dunedin%20FL&benchmark=Public_AR_Current&format=json
 * Service covers U.S., PR, and Island Areas. 
 */
async function geocodeUS(query){
  const url = `${CENSUS_GEOCODE_BASE}?address=${escapeQuery(query)}&benchmark=Public_AR_Current&format=json`;
  const resp = await fetch(url, {headers:{'User-Agent':USER_AGENT}});
  if(!resp.ok) throw new Error(`Geocoder HTTP ${resp.status}`);
  const data = await resp.json();
  // Parse first result if exists
  const result = data?.result?.addressMatches?.[0];
  if(!result) return {lat:null, lon:null};
  return {
    lat: result.coordinates.y,
    lon: result.coordinates.x,
    matchedAddress: result.matchedAddress
  };
}

/* ====== NWS POINT LOOKUP ======
 * /points/{lat},{lon} returns forecast & forecastHourly URLs + office info. 
 */
async function getNwsPoint(lat, lon){
  const url = `https://api.weather.gov/points/${lat},${lon}`;
  const resp = await fetch(url, {headers:{'User-Agent':USER_AGENT,'Accept':'application/geo+json'}});
  if(!resp.ok) throw new Error(`NWS points HTTP ${resp.status}`);
  return resp.json();
}

/* Generic JSON fetch helper */
async function getJson(url){
  const resp = await fetch(url, {headers:{'User-Agent':USER_AGENT,'Accept':'application/geo+json'}});
  if(!resp.ok) throw new Error(`Fetch JSON HTTP ${resp.status}`);
  return resp.json();
}

/* ====== RENDER FORECAST CARDS ======
 * NWS /forecast returns properties.periods[] with name, temperature, wind, shortForecast, detailedForecast. 
 */
function renderForecast(container, ctx){
  const {locStr, matchedAddress, city, state, office, forecastData, hourlyUrl} = ctx;
  const periods = forecastData?.properties?.periods || [];
  let html = "";
  html += `<h2>Forecast for ${city && state ? `${city}, ${state}` : (matchedAddress || locStr)}</h2>`;
  html += `<p>Source: National Weather Service (${office}). Not for life/critical decision use.</p>`;
  html += `<div class="mv-forecast-cards">`;
  for(const p of periods){
    html += `
      <div class="mv-forecast-card">
        <h3>${p.name}</h3>
        <img src="${p.icon}" alt="${p.shortForecast}">
        <p><strong>${p.temperature}°${p.temperatureUnit}</strong></p>
        <p>${p.shortForecast}</p>
        <p class="mv-forecast-wind">${p.windSpeed} ${p.windDirection}</p>
      </div>`;
  }
  html += `</div>`;
  if(hourlyUrl){
    html += `<p><a class="mv-card-btn" href="${hourlyUrl}" target="_blank" rel="noopener">View Hourly JSON</a></p>`;
  }
  container.innerHTML = html;
}

