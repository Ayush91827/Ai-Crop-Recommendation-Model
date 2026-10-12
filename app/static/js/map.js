/**
 * MAP MODULE v2 — Completely rewritten
 *
 * FIXES in v2:
 *   1. Location selection now works reliably — pin click → confirm → form fills
 *   2. Search dropdown works — calls Nominatim directly from frontend
 *   3. Weather autofill uses the correct Open-Meteo based endpoint
 *   4. API_BASE is respected everywhere (no hardcoded paths)
 *   5. Robust error handling with visible feedback to the user
 *
 * HOW LOCATION SELECTION WORKS (step by step):
 *   User clicks map → placeMarker(lat, lng) runs
 *     → selectedLat/selectedLon are saved
 *     → Confirm button is enabled
 *     → Popup shows coordinates + fetches location name
 *   User clicks "Use This Location"
 *     → confirmLocation() runs
 *     → window.userLat / window.userLon set globally
 *     → fetchWeatherForCoords() called → /api/weather → fills form fields
 *     → Modal closes
 *     → Green highlight on auto-filled fields
 */

// ── STATE ────────────────────────────────────────────────
let map              = null;
let marker           = null;
let selectedLat      = null;
let selectedLon      = null;
let isMapInitialized = false;
let searchDebounceTimer = null;

// ── ICON ─────────────────────────────────────────────────
function createLeafIcon() {
  return L.divIcon({
    html: `<div style="
      background:linear-gradient(135deg,#22c55e,#16a34a);
      width:38px;height:38px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 4px 15px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center">
      <span style="transform:rotate(45deg);font-size:16px;display:block">📍</span>
    </div>`,
    iconSize:    [38, 38],
    iconAnchor:  [19, 38],
    popupAnchor: [0, -40],
    className:   ''
  });
}


// ════════════════════════════════════════
// MAP INITIALISATION (lazy)
// ════════════════════════════════════════
function initMap(containerId) {
  if (isMapInitialized) { map && map.invalidateSize(); return; }

  map = L.map(containerId, {
    center: [22.5, 78.9],
    zoom:   5,
    zoomControl: true,
    scrollWheelZoom: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
    subdomains: ['a','b','c']
  }).addTo(map);

  // Click anywhere on map → place pin
  map.on('click', function(e) {
    placeMarker(e.latlng.lat, e.latlng.lng);
  });

  isMapInitialized = true;
  console.log('🗺️ Map ready');
}


// ════════════════════════════════════════
// PLACE / MOVE MARKER
// ════════════════════════════════════════
function placeMarker(lat, lng) {
  lat = parseFloat(lat);
  lng = parseFloat(lng);

  // Store as the selected location
  selectedLat = lat;
  selectedLon = lng;

  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng], {
      icon:      createLeafIcon(),
      draggable: true
    }).addTo(map);

    marker.on('dragend', function(e) {
      const pos  = e.target.getLatLng();
      selectedLat = pos.lat;
      selectedLon = pos.lng;
      fetchAndShowLocationName(pos.lat, pos.lng);
    });
  }

  map.setView([lat, lng], Math.max(map.getZoom(), 11));
  fetchAndShowLocationName(lat, lng);

  // Enable the confirm button
  const btn = document.getElementById('confirm-location-btn');
  if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
}


// ════════════════════════════════════════
// FETCH LOCATION NAME + SHOW POPUP
// ════════════════════════════════════════
async function fetchAndShowLocationName(lat, lon) {
  // Update label immediately with coordinates
  setSelectedLabel(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);

  try {
    // Use Nominatim directly — no backend call needed for the name
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`;
    const res  = await fetch(url, {
      headers: { 'Accept-Language': 'en' }
    });
    const data = await res.json();
    const addr = data?.address || {};
    const name = [
      addr.village || addr.town || addr.city || addr.county,
      addr.state_district || addr.county,
      addr.state
    ].filter(Boolean).slice(0, 2).join(', ') || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;

    setSelectedLabel(name);

    if (marker) {
      marker.bindPopup(`
        <div style="text-align:center;font-family:inherit;min-width:160px;padding:4px">
          <strong>📍 ${name}</strong><br>
          <small style="color:#64748b">${lat.toFixed(5)}, ${lon.toFixed(5)}</small><br>
          <small style="color:#22c55e">Click "Use This Location" to confirm</small>
        </div>
      `, { maxWidth: 260 }).openPopup();
    }
  } catch (err) {
    console.warn('Reverse geocode failed:', err.message);
  }
}

function setSelectedLabel(text) {
  const el = document.getElementById('selected-location-label');
  if (el) el.textContent = text;
}


// ════════════════════════════════════════
// CONFIRM LOCATION — the key function
// ════════════════════════════════════════
function confirmLocation() {
  if (selectedLat === null || selectedLon === null) {
    showToast('error', '⚠️ Please click on the map to select a location first');
    return;
  }

  // Set globally so main.js can include in prediction request
  window.userLat = selectedLat;
  window.userLon = selectedLon;

  closeMapModal();
  showToast('info', '📍 Location confirmed — fetching weather...');

  // Fetch weather and auto-fill form
  fetchWeatherForCoords(selectedLat, selectedLon);
}


// ════════════════════════════════════════
// FETCH WEATHER + AUTO-FILL FORM
// ════════════════════════════════════════
async function fetchWeatherForCoords(lat, lon) {
  try {
    const base = (typeof API_BASE !== 'undefined' ? API_BASE : '');
    const res  = await fetch(`${base}/api/weather?lat=${lat}&lon=${lon}`);

    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
    const data = await res.json();

    if (data.weather) {
      fillWeatherFields(data.weather);
      if (typeof renderWeatherCard === 'function') {
        renderWeatherCard(data.weather, data.location);
      }
      const locName = data.location
        ? [data.location.city, data.location.state].filter(Boolean).join(', ')
        : `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
      showToast('success', `✅ Weather filled for ${locName}`);
    }
  } catch (err) {
    console.error('Weather fill error:', err.message);
    showToast('error', '❌ Could not fetch weather. Please enter temperature, humidity, rainfall manually.');
  }
}

function fillWeatherFields(weather) {
  const pairs = {
    'input-temperature': weather.temperature,
    'input-humidity':    weather.humidity,
    'input-rainfall':    weather.rainfall
  };
  Object.entries(pairs).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) {
      el.value = Math.round(value * 10) / 10;
      el.style.borderColor = '#22c55e';
      el.style.background  = '#f0fdf4';
      el.title = 'Auto-filled from weather data';
      setTimeout(() => {
        el.style.borderColor = '';
        el.style.background  = '';
      }, 4000);
    }
  });
  // Sync pH slider if needed
  const phSlider = document.getElementById('ph-slider');
  const phInput  = document.getElementById('input-ph');
  if (phSlider && phInput && phInput.value) phSlider.value = phInput.value;
}


// ════════════════════════════════════════
// USE MY LOCATION (GPS)
// ════════════════════════════════════════
function useMyLocation() {
  const btn = document.getElementById('my-location-btn');
  if (!navigator.geolocation) {
    showLocationStatus('error', 'Geolocation is not supported by your browser');
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Detecting...'; }
  showLocationStatus('info', '📡 Requesting GPS location...');

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const acc = Math.round(pos.coords.accuracy);

      window.userLat = lat;
      window.userLon = lon;

      if (btn) { btn.disabled = false; btn.innerHTML = '✅ Location found'; }
      showLocationStatus('success', `📍 Found (±${acc}m) — click "Use This Location" to confirm`);

      openMapModal();
      setTimeout(() => placeMarker(lat, lon), 400);
    },
    function(err) {
      const msgs = {
        1: 'Location permission denied. Please allow location access and try again.',
        2: 'Position unavailable. Try searching for your location instead.',
        3: 'Location request timed out. Try searching manually.'
      };
      if (btn) { btn.disabled = false; btn.innerHTML = '🎯 Use My Location'; }
      showLocationStatus('error', msgs[err.code] || 'Could not get location');
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}


// ════════════════════════════════════════
// LOCATION SEARCH (Nominatim direct)
// ════════════════════════════════════════
async function searchLocation(query) {
  if (!query || query.trim().length < 2) {
    const el = document.getElementById('search-results');
    if (el) el.style.display = 'none';
    return;
  }

  const resultsEl = document.getElementById('search-results');
  if (!resultsEl) return;

  resultsEl.innerHTML = `<div class="search-loading">🔍 Searching for "${query}"...</div>`;
  resultsEl.style.display = 'block';

  try {
    // Call Nominatim directly — no backend dependency for search
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&countrycodes=in&addressdetails=1&accept-language=en`;
    const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();

    if (!data || data.length === 0) {
      resultsEl.innerHTML = `<div class="search-no-results">No results for "<strong>${query}</strong>"</div>`;
      return;
    }

    resultsEl.innerHTML = data.map(r => {
      const parts    = r.display_name.split(',');
      const mainName = parts.slice(0, 2).join(',').trim();
      const subName  = parts.slice(2, 4).join(',').trim();
      return `<div class="search-result-item"
                   onclick="selectSearchResult(${r.lat}, ${r.lon}, \`${mainName.replace(/`/g,"'")}\`)">
        <span class="result-pin">📍</span>
        <span>
          <strong class="result-main">${mainName}</strong>
          ${subName ? `<br><small class="result-sub">${subName}</small>` : ''}
        </span>
      </div>`;
    }).join('');

  } catch (err) {
    resultsEl.innerHTML = `<div class="search-error">❌ Search failed: ${err.message}</div>`;
  }
}

function selectSearchResult(lat, lon, name) {
  const resultsEl = document.getElementById('search-results');
  if (resultsEl) resultsEl.style.display = 'none';

  const searchInput = document.getElementById('location-search');
  if (searchInput) searchInput.value = name;

  window.userLat = parseFloat(lat);
  window.userLon = parseFloat(lon);

  openMapModal();
  setTimeout(() => {
    placeMarker(parseFloat(lat), parseFloat(lon));
    if (map) map.setView([parseFloat(lat), parseFloat(lon)], 13);
  }, 350);
}


// ════════════════════════════════════════
// MODAL OPEN / CLOSE
// ════════════════════════════════════════
function openMapModal() {
  const modal = document.getElementById('map-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  // Lazy init or resize
  if (!isMapInitialized) {
    setTimeout(() => {
      initMap('map-container');
      setTimeout(() => map && map.invalidateSize(), 400);
    }, 150);
  } else {
    setTimeout(() => map && map.invalidateSize(), 300);
  }
}

function closeMapModal() {
  const modal = document.getElementById('map-modal');
  if (modal) modal.style.display = 'none';
}


// ════════════════════════════════════════
// STATUS / HELPERS
// ════════════════════════════════════════
function showLocationStatus(type, message) {
  const el = document.getElementById('location-status');
  if (!el) return;
  el.textContent  = message;
  el.className    = `location-status ${type}`;
  el.style.display = 'block';
}

function handleSearchInput(value) {
  clearTimeout(searchDebounceTimer);
  if (value.trim().length < 2) {
    const el = document.getElementById('search-results');
    if (el) el.style.display = 'none';
    return;
  }
  searchDebounceTimer = setTimeout(() => searchLocation(value), 320);
}


// ════════════════════════════════════════
// GLOBAL EVENTS
// ════════════════════════════════════════
document.addEventListener('click', function(e) {
  // Close search dropdown when clicking outside
  const sc = document.getElementById('search-container');
  if (sc && !sc.contains(e.target)) {
    const el = document.getElementById('search-results');
    if (el) el.style.display = 'none';
  }
  // Close modal when clicking the dark backdrop
  if (e.target.id === 'map-modal') closeMapModal();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeMapModal();
});
