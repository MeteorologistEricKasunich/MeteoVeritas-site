// MeteoVeritas starter JS
// Sets copyright year
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('mv-year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  // Placeholder weather fetch (NWS API integration coming soon)
  const form = document.getElementById('mv-weather-search');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const loc = document.getElementById('mv-location-input').value.trim();
      const out = document.getElementById('mv-weather-results');
      if (!loc) {
        out.innerHTML = '<p>Please enter a location.</p>';
        return;
      }
      out.innerHTML = '<p>Searching for ' + loc + '... (NWS API coming soon)</p>';
    });
  }
});
