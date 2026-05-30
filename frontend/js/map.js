/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   MAP MODULE — Leaflet.js + OpenStreetMap                        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * WHAT THIS FILE DOES:
 *   - Initializes an interactive Leaflet.js map centered on India
 *   - Handles "Use My Location" (Geolocation API)
 *   - Handles location search (Nominatim forward geocoding)
 *   - Allows users to click/drag a pin to select any location
 *   - Emits the selected lat/lon to the main form
 *
 * WHY LEAFLET.JS?
 *   → Free, open-source, no API key needed
 *   → Uses OpenStreetMap tiles (completely free)
 *   → Very lightweight (40KB min+gz)
 *   → Google Maps alternative (Google requires API key + billing)
 *
 * INTERVIEW: "What's the difference between Leaflet and Google Maps?"
 *   → Google Maps: Paid above 28,000 map loads/month, full-featured
 *   → Leaflet: Free forever, open-source, needs tile provider (OSM is free)
 *   → Mapbox: More beautiful, free tier 50,000 loads/month
 *   → For agricultural app targeting rural India: Leaflet + OSM is ideal
 *
 * GEOLOCATION API:
 *   → navigator.geolocation is a browser API (not Node.js)
 *   → Returns GPS coordinates from device GPS, WiFi triangulation, or IP
 *   → Accuracy: GPS ~5m, WiFi ~50m, IP ~city-level
 *   → Requires HTTPS in production (HTTP allowed on localhost)
 *
 * INCLUDES:
 *   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
 *   <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
 */

// ─────────────────────────────────────────────
// MAP STATE
// ─────────────────────────────────────────────
let map = null;
let marker = null;
let selectedLat = null;
let selectedLon = null;
let isMapInitialized = false;

// Custom pin icon (green leaf icon for agricultural feel)
const leafIcon = L.divIcon({
    html: `<div style="
        background: linear-gradient(135deg, #22c55e, #16a34a);
        width: 36px; height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
    "><span style="transform: rotate(45deg); font-size: 16px; display: block; margin-top: -2px;">📍</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
    className: ''  // Removes default white square background
});


/**
 * Initializes the Leaflet map.
 * Called when the map modal is opened (lazy initialization = faster page load).
 *
 * INTERVIEW: "What is lazy initialization?"
 *   → Creating objects only when first needed, not at page load
 *   → Map creation is expensive (~200ms); delaying saves initial load time
 *   → Pattern: if (!initialized) { initialize(); initialized = true; }
 */
function initMap(containerId = 'map-container') {
    if (isMapInitialized) return;

    // India center coordinates, zoom level 5 shows the whole country
    map = L.map(containerId, {
        center: [20.5937, 78.9629],  // Geographic center of India
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true
    });

    // OpenStreetMap tiles — Free, no API key needed
    // INTERVIEW: "What is a tile layer?"
    //   → Maps are split into 256×256 pixel "tiles"
    //   → {z}/{x}/{y} = zoom level / tile column / tile row
    //   → Browser downloads only visible tiles (efficient)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']  // Load-balanced across 3 OSM servers
    }).addTo(map);

    // Click handler: place marker at clicked location
    map.on('click', function(event) {
        const { lat, lng } = event.latlng;
        placeMarker(lat, lng);
    });

    isMapInitialized = true;
    console.log('🗺️  Map initialized');
}


/**
 * Places or moves the draggable marker on the map.
 * After placing: fetches location name via reverse geocoding.
 */
function placeMarker(lat, lng) {
    selectedLat = lat;
    selectedLon = lng;

    if (marker) {
        // Move existing marker
        marker.setLatLng([lat, lng]);
    } else {
        // Create new draggable marker
        marker = L.marker([lat, lng], {
            icon: leafIcon,
            draggable: true  // User can drag to fine-tune location
        }).addTo(map);

        // When user drags the pin to a new spot
        marker.on('dragend', function(e) {
            const pos = e.target.getLatLng();
            selectedLat = pos.lat;
            selectedLon = pos.lng;
            fetchLocationName(pos.lat, pos.lng);
        });
    }

    // Pan map to selected location
    map.setView([lat, lng], Math.max(map.getZoom(), 10));

    // Fetch human-readable name for the location
    fetchLocationName(lat, lng);

    // Update confirm button state
    const confirmBtn = document.getElementById('confirm-location-btn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
    }
}


/**
 * Reverse geocodes lat/lon → place name using Nominatim.
 * Updates the map popup and the location display text.
 */
async function fetchLocationName(lat, lon) {
    try {
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        const data = await res.json();

        let locationText = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        if (data.location) {
            const loc = data.location;
            locationText = [loc.city, loc.district, loc.state]
                .filter(Boolean).join(', ');
        }

        // Show popup on marker
        if (marker) {
            marker.bindPopup(`
                <div style="text-align:center; font-family:inherit; min-width:150px">
                    <strong>📍 ${locationText}</strong><br>
                    <small style="color:#666">${lat.toFixed(4)}, ${lon.toFixed(4)}</small>
                    ${data.weather ? `<br><span style="font-size:12px">🌡️ ${data.weather.temperature}°C | 💧 ${data.weather.humidity}%</span>` : ''}
                </div>
            `, { maxWidth: 250 }).openPopup();
        }

        // Update location label in UI
        const locLabel = document.getElementById('selected-location-label');
        if (locLabel) locLabel.textContent = locationText;

        // Auto-fill weather into form if weather data returned
        if (data.weather) {
            autoFillWeather(data.weather);
        }

    } catch (err) {
        console.warn('Could not fetch location name:', err.message);
    }
}


/**
 * Auto-fills temperature, humidity, and rainfall from weather data.
 * Shows a subtle "auto-filled" indicator on those fields.
 */
function autoFillWeather(weather) {
    const fields = {
        'input-temperature': weather.temperature,
        'input-humidity':    weather.humidity,
        'input-rainfall':    weather.rainfall
    };

    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el && value !== undefined) {
            el.value = value;
            el.style.borderColor = '#22c55e';  // Green highlight = auto-filled
            el.title = `Auto-filled from weather data for selected location`;

            // Fade back to normal after 3s
            setTimeout(() => { el.style.borderColor = ''; }, 3000);
        }
    });

    // Show weather card
    window.displayWeatherCard && window.displayWeatherCard(weather);
}


/**
 * "Use My Location" button handler.
 * Requests browser GPS, then places marker and fills form.
 *
 * INTERVIEW: "What permissions does Geolocation need?"
 *   → Browser shows permission dialog first time
 *   → If denied: we can't get location (no override possible — privacy design)
 *   → HTTPS required in production
 *   → watchPosition() tracks moving users (not needed here)
 */
function useMyLocation() {
    const btn = document.getElementById('my-location-btn');
    const statusEl = document.getElementById('location-status');

    if (!navigator.geolocation) {
        showLocationStatus('error', t('locationNotFound') + ' (Browser not supported)');
        return;
    }

    // Update button state
    if (btn) {
        btn.innerHTML = `<span class="spinner"></span> ${t('locationDetecting')}`;
        btn.disabled = true;
    }
    if (statusEl) statusEl.textContent = t('locationDetecting');

    navigator.geolocation.getCurrentPosition(
        // SUCCESS callback
        async function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = position.coords.accuracy;  // meters

            console.log(`📍 Location: ${lat}, ${lon} (±${accuracy}m)`);

            // Open and update map
            openMapModal();
            placeMarker(lat, lon);

            // Store globally for form submission
            window.userLat = lat;
            window.userLon = lon;

            showLocationStatus('success', `${t('locationFound')} (±${Math.round(accuracy)}m)`);

            if (btn) {
                btn.innerHTML = `✅ ${t('locationFound')}`;
                btn.disabled = false;
            }
        },
        // ERROR callback
        function(error) {
            let msg = t('locationNotFound');
            if (error.code === 1) msg = t('noLocationPerm');
            else if (error.code === 2) msg = 'Position unavailable. Check GPS.';
            else if (error.code === 3) msg = 'Location request timed out.';

            showLocationStatus('error', msg);
            if (btn) {
                btn.innerHTML = `📍 ${t('useMyLocation')}`;
                btn.disabled = false;
            }
        },
        // OPTIONS
        {
            enableHighAccuracy: true,   // Use GPS (drains more battery vs WiFi)
            timeout: 10000,             // Give up after 10 seconds
            maximumAge: 60000           // Accept cached position up to 1 min old
        }
    );
}


/**
 * Searches for a location by name using the Node.js geocode endpoint.
 * Displays results as clickable items in a dropdown.
 */
async function searchLocation(query) {
    if (!query || query.trim().length < 2) return;

    const resultsEl = document.getElementById('search-results');
    if (!resultsEl) return;

    resultsEl.innerHTML = `<div class="search-loading">🔍 Searching...</div>`;
    resultsEl.style.display = 'block';

    try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            resultsEl.innerHTML = `<div class="search-no-results">No results found for "${query}"</div>`;
            return;
        }

        // Render search results as clickable list
        resultsEl.innerHTML = data.results.map((r, i) => `
            <div class="search-result-item" 
                 onclick="selectSearchResult(${r.lat}, ${r.lon}, '${r.name.replace(/'/g, "\\'")}')">
                <span class="result-pin">📍</span>
                <span class="result-name">${r.name}</span>
            </div>
        `).join('');

    } catch (err) {
        resultsEl.innerHTML = `<div class="search-error">Search failed: ${err.message}</div>`;
    }
}


/**
 * Called when user clicks a search result.
 * Centers map on the selected location and places marker.
 */
function selectSearchResult(lat, lon, name) {
    // Hide dropdown
    const resultsEl = document.getElementById('search-results');
    if (resultsEl) resultsEl.style.display = 'none';

    // Update search box
    const searchInput = document.getElementById('location-search');
    if (searchInput) searchInput.value = name.split(',')[0];

    // Open map and place marker
    openMapModal();

    setTimeout(() => {
        placeMarker(lat, lon);
        map.setView([lat, lon], 12);
    }, 300);

    window.userLat = lat;
    window.userLon = lon;
}


/**
 * Opens the map modal and initializes the map if needed.
 */
function openMapModal() {
    const modal = document.getElementById('map-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('open');
    }

    // Initialize map on first open (lazy)
    if (!isMapInitialized) {
        setTimeout(() => {
            initMap('map-container');
            // Invalidate map size after modal animation completes
            setTimeout(() => map && map.invalidateSize(), 300);
        }, 100);
    } else {
        setTimeout(() => map && map.invalidateSize(), 300);
    }
}


/**
 * Closes the map modal.
 */
function closeMapModal() {
    const modal = document.getElementById('map-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('open');
    }
}


/**
 * Confirms the location selection from the map.
 * Closes modal and updates the main form.
 */
function confirmLocation() {
    if (!selectedLat || !selectedLon) return;

    window.userLat = selectedLat;
    window.userLon = selectedLon;

    // Trigger weather fetch for the selected coordinates
    fetchWeatherForCoords(selectedLat, selectedLon);

    closeMapModal();
}


/**
 * Fetches weather and auto-fills the form fields.
 */
async function fetchWeatherForCoords(lat, lon) {
    try {
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        if (data.weather) {
            autoFillWeather(data.weather);
            window.displayWeatherCard && window.displayWeatherCard(data.weather, data.location);
        }
    } catch (err) {
        console.warn('Weather fetch error:', err.message);
    }
}


/**
 * Shows a status message below the location button.
 */
function showLocationStatus(type, message) {
    const el = document.getElementById('location-status');
    if (!el) return;
    el.textContent = message;
    el.className = `location-status ${type}`;  // CSS classes: .success, .error, .info
    el.style.display = 'block';
}


// Search input debounce: don't search on every keystroke
// Wait 500ms after user stops typing before calling API
let searchDebounceTimer = null;
function handleSearchInput(value) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => searchLocation(value), 500);
}

// Close search results when clicking outside
document.addEventListener('click', function(e) {
    const searchBox = document.getElementById('search-container');
    if (searchBox && !searchBox.contains(e.target)) {
        const results = document.getElementById('search-results');
        if (results) results.style.display = 'none';
    }
});

// Close map modal when clicking the backdrop
document.addEventListener('click', function(e) {
    if (e.target.id === 'map-modal') closeMapModal();
});

// Keyboard: close modal on Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeMapModal();
});
