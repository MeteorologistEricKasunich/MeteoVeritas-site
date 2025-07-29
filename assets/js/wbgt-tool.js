document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("wbgt-form");
  const locateBtn = document.getElementById("locate-me");
  const chartCanvas = document.getElementById("wbgt-chart");
  let chart;

  async function fetchWBGT(lat, lon, placeLabel) {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,dewpoint_2m,windspeed_10m,cloudcover&timezone=auto`);
    const data = await res.json();
    const times = data.hourly.time;
    const tempC = data.hourly.temperature_2m;
    const dewC = data.hourly.dewpoint_2m;

    const wbgtData = [];
    const csvLines = ["Date,Time,Temp (F),Dew Pt (F),WBGT (F),Risk"];

    for (let i = 0; i < times.length; i++) {
      const timeObj = new Date(times[i]);
      const tempF = tempC[i] * 9/5 + 32;
      const dewF = dewC[i] * 9/5 + 32;
      const wbgt = tempF + 0.4 * dewF;

      let risk = "Low";
      if (wbgt >= 82 && wbgt < 88) risk = "Moderate";
      else if (wbgt >= 88 && wbgt < 91) risk = "High";
      else if (wbgt >= 91) risk = "Extreme";

      const color = {
        "Low": "green",
        "Moderate": "orange",
        "High": "red",
        "Extreme": "purple"
      }[risk];

      wbgtData.push({
        x: timeObj,
        y: wbgt.toFixed(1),
        borderColor: color,
        backgroundColor: color,
        risk,
        timeStr: timeObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        dateStr: timeObj.toLocaleDateString()
      });

      csvLines.push(`${wbgtData[i].dateStr},${wbgtData[i].timeStr},${tempF.toFixed(1)},${dewF.toFixed(1)},${wbgt.toFixed(1)},${risk}`);
    }

    renderChart(wbgtData, placeLabel);
    setupCSVDownload(csvLines.join("\n"));
  }

  function renderChart(data, label) {
    if (chart) chart.destroy();

    chart = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels: data.map(d => `${d.dateStr} ${d.timeStr}`),
        datasets: [{
          label: `WBGT Forecast for ${label}`,
          data: data.map(d => d.y),
          borderColor: data.map(d => d.borderColor),
          backgroundColor: data.map(d => d.backgroundColor),
          pointRadius: 4,
          fill: false,
          tension: 0.4
        }]
      },
      options: {
        scales: {
          x: {
            ticks: {
              maxRotation: 90,
              minRotation: 45,
              autoSkip: true
            }
          },
          y: {
            title: {
              display: true,
              text: 'WBGT (°F)'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                const idx = context.dataIndex;
                return `WBGT: ${context.raw} °F (Risk: ${data[idx].risk})`;
              }
            }
          }
        }
      }
    });
  }

  function setupCSVDownload(csv) {
    document.getElementById("csv-export").onclick = () => {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wbgt_data.csv";
      a.click();
    };
  }

  async function geocodeLocation(query) {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`);
    const data = await res.json();
    return data.results?.[0];
  }

  async function getLocationAndFetchWBGT(query) {
    const loc = await geocodeLocation(query);
    if (!loc) return alert("Location not found.");
    fetchWBGT(loc.latitude, loc.longitude, `${loc.name}, ${loc.admin1}`);
    updateMap(loc.longitude, loc.latitude);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = document.getElementById("wbgt-location").value;
    getLocationAndFetchWBGT(query);
  });

  locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      fetchWBGT(latitude, longitude, "Your Location");
      updateMap(longitude, latitude);
    }, () => alert("Unable to retrieve location."));
  });

  // MAPLIBRE SETUP
  let map;
  function updateMap(lon, lat) {
    if (!map) {
      map = new maplibregl.Map({
        container: "map",
        style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
        center: [lon, lat],
        zoom: 7
      });
      map.addControl(new maplibregl.NavigationControl());

      map.on("load", () => {
        map.addSource("heat-warnings", {
          type: "raster",
          tiles: ["https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS_Watches_Warnings/NWS_Watches_Warnings/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256
        });
        map.addLayer({
          id: "heat-warnings-layer",
          type: "raster",
          source: "heat-warnings",
          paint: {}
        });

        map.addSource("solar-rad", {
          type: "raster",
          tiles: ["https://neo.gsfc.nasa.gov/wms/wms?layers=CERES_NETFLUX_M&format=image/png&transparent=true&service=WMS&request=GetMap&version=1.1.1&styles=&bbox=-180,-90,180,90&srs=EPSG:4326&width=256&height=256"],
          tileSize: 256
        });
        map.addLayer({
          id: "solar-layer",
          type: "raster",
          source: "solar-rad",
          paint: { "raster-opacity": 0.6 }
        });
      });
    } else {
      map.setCenter([lon, lat]);
    }
  }
});
