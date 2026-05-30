/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         AI-BASED CROP RECOMMENDATION SYSTEM                      ║
 * ║         STEP 4: Node.js Express Backend Server                   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * WHAT THIS FILE DOES:
 *   - Serves as the main backend between frontend and Python ML API
 *   - Forwards prediction requests to Flask (port 5000)
 *   - Fetches real-time weather data from OpenWeatherMap
 *   - Returns crop market prices (MSP + market rates)
 *   - Geocodes coordinates to city/district names
 *   - Serves static frontend files
 *
 * WHY NODE.JS BETWEEN FRONTEND AND PYTHON?
 *   1. Security: Keeps API keys server-side (never exposed to browser)
 *   2. Caching: Cache weather data for 10 min (avoid API rate limits)
 *   3. Data aggregation: Combine prediction + weather + prices in one call
 *   4. Authentication middleware (JWT, rate limiting) easier in Node
 *   5. Serves static files (HTML, CSS, JS)
 *
 * ARCHITECTURE:
 *   Browser → Node.js (3000) → Flask API (5000)
 *                            → OpenWeatherMap API
 *                            → Nominatim Geocoding API
 *                            → Crop Prices Database (in-memory / Agmarknet)
 *
 * SETUP:
 *   npm install express cors axios node-cache dotenv express-rate-limit morgan
 *   node server.js
 *
 * ENV VARIABLES (.env file):
 *   OPENWEATHER_API_KEY=your_key_here    # Get free at openweathermap.org
 *   FLASK_URL=http://localhost:5000
 *   PORT=3000
 */

const express    = require('express');
const cors       = require('cors');
const axios      = require('axios');
const NodeCache  = require('node-cache');
const rateLimit  = require('express-rate-limit');
const morgan     = require('morgan');
const path       = require('path');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;
const FLASK_URL = process.env.FLASK_URL || 'http://localhost:5000';
const WEATHER_KEY = process.env.OPENWEATHER_API_KEY || 'YOUR_KEY_HERE';

// ────────────────────────────────────────────────────────────────
// CACHING SETUP
// ────────────────────────────────────────────────────────────────
// NodeCache stores key-value pairs in memory with a TTL (time-to-live).
// WHY CACHE?
//   OpenWeatherMap free tier: 60 calls/min, 1 million/month
//   Without cache: Every user refresh = one API call
//   With cache: 100 users in same city over 10 min = 1 API call
//
// INTERVIEW: "What caching strategies do you know?"
//   → In-memory (NodeCache/Redis): Fastest, lost on restart
//   → Redis: Persistent, shared across multiple Node instances
//   → HTTP caching (Cache-Control headers): Browser caches responses
//   → CDN caching: For static assets (HTML, CSS, JS, images)

const weatherCache = new NodeCache({ stdTTL: 600 });  // 10 minutes
const priceCache   = new NodeCache({ stdTTL: 3600 }); // 1 hour


// ────────────────────────────────────────────────────────────────
// MIDDLEWARE STACK
// ────────────────────────────────────────────────────────────────
// Middleware runs BEFORE route handlers, in order of registration.
// Think of it as a pipeline: Request → M1 → M2 → M3 → RouteHandler → Response

const allowedOrigins = [
  'http://localhost:3000',
  'https://ai-crop-recommendation-model.vercel.app'
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS'));
    }
  }
}));                         // 1. Allow cross-origin requests
app.use(express.json());                  // 2. Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // 3. Parse form data
app.use(morgan('dev'));                    // 4. Log: "GET /api/predict 200 45ms"
app.use(express.static(path.join(__dirname, '../frontend'))); // 5. Serve static files

// Rate Limiting: Prevent API abuse
// Without this: one user could send 10,000 requests/minute and crash the server
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15-minute window
    max: 100,                    // Max 100 requests per IP per window
    message: { error: 'Too many requests. Please try again after 15 minutes.' },
    standardHeaders: true,       // Returns rate-limit info in headers
    legacyHeaders: false
});
app.use('/api/', apiLimiter);   // Apply only to /api/* routes


// ────────────────────────────────────────────────────────────────
// CROP MARKET PRICES DATABASE
// ────────────────────────────────────────────────────────────────
// Based on: Ministry of Agriculture MSP 2024-25 + AGMARKNET data
// Unit: INR per Quintal (100 kg)
//
// INTERVIEW: "How would you keep prices up-to-date in production?"
//   → Option 1: Cron job to scrape agmarknet.nic.in daily
//   → Option 2: Subscribe to commodity market API (NCDEX, MCX)
//   → Option 3: Manual updates by admin panel
//   → Option 4: Agmarknet Open Data API (data.gov.in)

const CROP_PRICES = {
    rice:        { msp: 2183,  market_low: 2000,  market_high: 2600,  unit: '₹/Quintal', trend: 'stable',  symbol: '📈' },
    maize:       { msp: 2090,  market_low: 1800,  market_high: 2400,  unit: '₹/Quintal', trend: 'rising',  symbol: '📈' },
    chickpea:    { msp: 5440,  market_low: 4800,  market_high: 6200,  unit: '₹/Quintal', trend: 'stable',  symbol: '➡️' },
    kidneybeans: { msp: 6000,  market_low: 5500,  market_high: 7500,  unit: '₹/Quintal', trend: 'rising',  symbol: '📈' },
    pigeonpeas:  { msp: 7000,  market_low: 6000,  market_high: 8000,  unit: '₹/Quintal', trend: 'stable',  symbol: '➡️' },
    mothbeans:   { msp: 5800,  market_low: 5000,  market_high: 6800,  unit: '₹/Quintal', trend: 'stable',  symbol: '➡️' },
    mungbean:    { msp: 8682,  market_low: 7500,  market_high: 9500,  unit: '₹/Quintal', trend: 'rising',  symbol: '📈' },
    blackgram:   { msp: 7400,  market_low: 6500,  market_high: 8200,  unit: '₹/Quintal', trend: 'stable',  symbol: '➡️' },
    lentil:      { msp: 6425,  market_low: 5800,  market_high: 7200,  unit: '₹/Quintal', trend: 'rising',  symbol: '📈' },
    pomegranate: { msp: null,  market_low: 4000,  market_high: 8000,  unit: '₹/Quintal', trend: 'seasonal', symbol: '📉' },
    banana:      { msp: null,  market_low: 1200,  market_high: 2500,  unit: '₹/Quintal', trend: 'stable',  symbol: '➡️' },
    mango:       { msp: null,  market_low: 3000,  market_high: 6000,  unit: '₹/Quintal', trend: 'seasonal', symbol: '📈' },
    grapes:      { msp: null,  market_low: 5000,  market_high: 12000, unit: '₹/Quintal', trend: 'rising',  symbol: '📈' },
    watermelon:  { msp: null,  market_low: 600,   market_high: 1500,  unit: '₹/Quintal', trend: 'seasonal', symbol: '📉' },
    muskmelon:   { msp: null,  market_low: 800,   market_high: 2000,  unit: '₹/Quintal', trend: 'seasonal', symbol: '📉' },
    apple:       { msp: null,  market_low: 5000,  market_high: 15000, unit: '₹/Quintal', trend: 'rising',  symbol: '📈' },
    orange:      { msp: null,  market_low: 2000,  market_high: 5000,  unit: '₹/Quintal', trend: 'stable',  symbol: '➡️' },
    papaya:      { msp: null,  market_low: 1000,  market_high: 2500,  unit: '₹/Quintal', trend: 'stable',  symbol: '➡️' },
    coconut:     { msp: null,  market_low: 15000, market_high: 30000, unit: '₹/Quintal', trend: 'rising',  symbol: '📈' },
    cotton:      { msp: 7121,  market_low: 6500,  market_high: 8500,  unit: '₹/Quintal', trend: 'stable',  symbol: '➡️' },
    jute:        { msp: 5335,  market_low: 4800,  market_high: 6000,  unit: '₹/Quintal', trend: 'stable',  symbol: '➡️' },
    coffee:      { msp: null,  market_low: 20000, market_high: 50000, unit: '₹/Quintal', trend: 'rising',  symbol: '📈' },
};

// Additional crop info (irrigation, income potential, etc.)
const CROP_DETAILS = {
    rice:        { water: 'High', duration_days: 120, profit_ha: '₹35,000–50,000', difficulty: 'Medium' },
    maize:       { water: 'Medium', duration_days: 90, profit_ha: '₹25,000–40,000', difficulty: 'Easy' },
    chickpea:    { water: 'Low', duration_days: 110, profit_ha: '₹30,000–45,000', difficulty: 'Easy' },
    kidneybeans: { water: 'Medium', duration_days: 120, profit_ha: '₹40,000–60,000', difficulty: 'Medium' },
    pigeonpeas:  { water: 'Low', duration_days: 180, profit_ha: '₹35,000–55,000', difficulty: 'Easy' },
    mothbeans:   { water: 'Very Low', duration_days: 60, profit_ha: '₹20,000–35,000', difficulty: 'Easy' },
    mungbean:    { water: 'Low', duration_days: 70, profit_ha: '₹30,000–45,000', difficulty: 'Easy' },
    blackgram:   { water: 'Low', duration_days: 75, profit_ha: '₹28,000–42,000', difficulty: 'Easy' },
    lentil:      { water: 'Low', duration_days: 110, profit_ha: '₹32,000–48,000', difficulty: 'Easy' },
    pomegranate: { water: 'Low', duration_days: 730, profit_ha: '₹1,00,000–3,00,000', difficulty: 'Hard' },
    banana:      { water: 'High', duration_days: 365, profit_ha: '₹80,000–2,00,000', difficulty: 'Medium' },
    mango:       { water: 'Low', duration_days: 1825, profit_ha: '₹1,50,000–5,00,000', difficulty: 'Medium' },
    grapes:      { water: 'Medium', duration_days: 730, profit_ha: '₹2,00,000–6,00,000', difficulty: 'Hard' },
    watermelon:  { water: 'Medium', duration_days: 75, profit_ha: '₹50,000–1,00,000', difficulty: 'Medium' },
    muskmelon:   { water: 'Medium', duration_days: 80, profit_ha: '₹45,000–90,000', difficulty: 'Medium' },
    apple:       { water: 'Medium', duration_days: 2190, profit_ha: '₹3,00,000–10,00,000', difficulty: 'Hard' },
    orange:      { water: 'Medium', duration_days: 1095, profit_ha: '₹1,00,000–3,00,000', difficulty: 'Medium' },
    papaya:      { water: 'Medium', duration_days: 365, profit_ha: '₹60,000–1,50,000', difficulty: 'Easy' },
    coconut:     { water: 'High', duration_days: 2555, profit_ha: '₹1,00,000–4,00,000', difficulty: 'Medium' },
    cotton:      { water: 'Medium', duration_days: 180, profit_ha: '₹40,000–70,000', difficulty: 'Medium' },
    jute:        { water: 'High', duration_days: 120, profit_ha: '₹25,000–40,000', difficulty: 'Easy' },
    coffee:      { water: 'Medium', duration_days: 1825, profit_ha: '₹2,00,000–8,00,000', difficulty: 'Hard' },
};


// ────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ────────────────────────────────────────────────────────────────

/**
 * Fetches weather data from OpenWeatherMap API.
 * Caches result for 10 minutes per location.
 *
 * WHY CACHE BY COORDINATES?
 *   Two users 1km apart get same weather. We round to 2 decimal places
 *   (≈1km grid) to maximize cache hits.
 *
 * FREE API: https://openweathermap.org/api (1M calls/month)
 * Response includes: temp, humidity, weather description, rain
 */
async function fetchWeather(lat, lon) {
    const cacheKey = `weather_${Math.round(lat * 100) / 100}_${Math.round(lon * 100) / 100}`;
    const cached = weatherCache.get(cacheKey);
    if (cached) {
        return { ...cached, fromCache: true };
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=metric`;
    const response = await axios.get(url, { timeout: 5000 });
    const d = response.data;

    const result = {
        temperature:  Math.round(d.main.temp * 10) / 10,
        humidity:     d.main.humidity,
        description:  d.weather[0].description,
        city:         d.name,
        country:      d.sys.country,
        rainfall:     d.rain ? (d.rain['1h'] || d.rain['3h'] || 0) * 30 : 50, // Estimate monthly
        feels_like:   Math.round(d.main.feels_like),
        wind_speed:   d.wind.speed,
        fromCache:    false
    };

    weatherCache.set(cacheKey, result);
    return result;
}


/**
 * Reverse geocoding: coordinates → place name
 * Uses Nominatim (OpenStreetMap) — FREE, no API key needed.
 * Provides district and state information for Indian farmers.
 */
async function reverseGeocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
    const resp = await axios.get(url, {
        timeout: 5000,
        headers: { 'User-Agent': 'CropRecommendationApp/1.0' }  // Nominatim requires User-Agent
    });
    const addr = resp.data.address || {};
    return {
        city:    addr.city || addr.town || addr.village || addr.county || 'Unknown',
        state:   addr.state || '',
        country: addr.country || '',
        district: addr.county || addr.state_district || ''
    };
}


// ────────────────────────────────────────────────────────────────
// API ROUTES
// ────────────────────────────────────────────────────────────────

/**
 * POST /api/predict
 *
 * Main endpoint: accepts soil params, optionally auto-fills weather
 * from coordinates, calls Flask ML API, enriches with prices.
 *
 * REQUEST BODY:
 * {
 *   "N": 90, "P": 42, "K": 43,
 *   "temperature": 20.8,   // Optional if lat/lon provided
 *   "humidity": 82,        // Optional if lat/lon provided
 *   "ph": 6.5,
 *   "rainfall": 202,       // Optional if lat/lon provided
 *   "lat": 22.7196,        // Auto-fill weather
 *   "lon": 75.8577
 * }
 *
 * RESPONSE: Prediction + prices + weather data
 *
 * INTERVIEW: "What if Flask API is down?"
 *   → axios.get/post throws an error → we catch it → return 503
 *   → In production: circuit breaker pattern (opossum library)
 *   → Fallback: return cached last prediction if available
 */
app.post('/api/predict', async (req, res) => {
    try {
        let soilData = { ...req.body };
        let weatherData = null;
        let locationData = null;

        // Auto-fill weather from coordinates if provided
        if (soilData.lat && soilData.lon) {
            try {
                [weatherData, locationData] = await Promise.all([
                    fetchWeather(soilData.lat, soilData.lon),
                    reverseGeocode(soilData.lat, soilData.lon)
                ]);
                // Use weather API values if not manually specified
                if (!soilData.temperature) soilData.temperature = weatherData.temperature;
                if (!soilData.humidity)    soilData.humidity    = weatherData.humidity;
                if (!soilData.rainfall)    soilData.rainfall    = weatherData.rainfall;
            } catch (weatherErr) {
                console.warn('⚠️  Weather fetch failed:', weatherErr.message);
                // Non-fatal: continue with manually provided values
            }
        }

        // Validate we have all required soil params
        const required = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];
        const missing = required.filter(f => soilData[f] === undefined || soilData[f] === null || soilData[f] === '');
        if (missing.length > 0) {
            return res.status(422).json({
                error: 'Missing required fields',
                missing,
                hint: 'Provide lat/lon to auto-fill temperature, humidity, rainfall from weather data'
            });
        }

        // Call Flask ML API
        const mlResponse = await axios.post(`${FLASK_URL}/predict`, {
            N:           parseFloat(soilData.N),
            P:           parseFloat(soilData.P),
            K:           parseFloat(soilData.K),
            temperature: parseFloat(soilData.temperature),
            humidity:    parseFloat(soilData.humidity),
            ph:          parseFloat(soilData.ph),
            rainfall:    parseFloat(soilData.rainfall)
        }, { timeout: 10000 });

        const mlData = mlResponse.data;

        // Enrich predictions with prices and crop details
        const enrichedPredictions = mlData.predictions.map(pred => {
            const crop = pred.crop;
            const prices = CROP_PRICES[crop] || {};
            const details = CROP_DETAILS[crop] || {};
            return {
                ...pred,
                prices: {
                    msp:          prices.msp ? `₹${prices.msp.toLocaleString('en-IN')}/qtl` : 'No MSP',
                    market_low:   `₹${(prices.market_low || 0).toLocaleString('en-IN')}`,
                    market_high:  `₹${(prices.market_high || 0).toLocaleString('en-IN')}`,
                    unit:         prices.unit || '₹/Quintal',
                    trend:        prices.trend || 'stable',
                    trend_symbol: prices.symbol || '➡️',
                    avg_price:    prices.market_low && prices.market_high
                                    ? Math.round((prices.market_low + prices.market_high) / 2)
                                    : null
                },
                details: {
                    water_requirement: details.water || 'Medium',
                    crop_duration:     `${details.duration_days || 120} days`,
                    expected_profit:   details.profit_ha || 'Varies',
                    difficulty:        details.difficulty || 'Medium'
                }
            };
        });

        // Build final response
        const finalResponse = {
            status:      'success',
            top_crop:    mlData.top_crop,
            predictions: enrichedPredictions,
            full_ranking: mlData.full_ranking,
            weather:     weatherData,
            location:    locationData,
            input:       {
                N: soilData.N, P: soilData.P, K: soilData.K,
                temperature: soilData.temperature,
                humidity: soilData.humidity,
                ph: soilData.ph,
                rainfall: soilData.rainfall
            },
            timestamp:   new Date().toISOString()
        };

        res.json(finalResponse);

    } catch (err) {
        console.error('❌ Prediction error:', err.message);
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({
                error: 'ML service unavailable',
                hint: 'Make sure Flask API is running: python flask_api.py'
            });
        }
        res.status(500).json({ error: err.message });
    }
});


/**
 * GET /api/weather?lat=22.7&lon=75.8
 * Returns weather data for given coordinates.
 */
app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'lat and lon are required query params' });
    }
    try {
        const [weather, location] = await Promise.all([
            fetchWeather(parseFloat(lat), parseFloat(lon)),
            reverseGeocode(parseFloat(lat), parseFloat(lon))
        ]);
        res.json({ weather, location });
    } catch (err) {
        res.status(500).json({ error: err.message, hint: 'Check your OpenWeatherMap API key' });
    }
});


/**
 * GET /api/prices
 * Returns all crop market prices.
 * Optional: ?crop=rice  for single crop
 */
app.get('/api/prices', (req, res) => {
    const { crop } = req.query;
    if (crop) {
        const cropLower = crop.toLowerCase();
        const prices = CROP_PRICES[cropLower];
        const details = CROP_DETAILS[cropLower];
        if (!prices) {
            return res.status(404).json({ error: `Price data not found for crop: ${crop}` });
        }
        return res.json({ crop: cropLower, prices, details });
    }
    res.json({
        prices: CROP_PRICES,
        details: CROP_DETAILS,
        note: 'MSP = Minimum Support Price (Govt guaranteed), Market = AGMARKNET rates',
        source: 'Ministry of Agriculture, Government of India — 2024-25',
        unit: '₹ per Quintal (100 kg)'
    });
});


/**
 * GET /api/geocode?q=Indore
 * Forward geocoding: place name → coordinates
 * Uses Nominatim (free, no key needed)
 */
app.get('/api/geocode', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q (query) param required' });

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=in`;
        const resp = await axios.get(url, {
            timeout: 5000,
            headers: { 'User-Agent': 'CropRecommendationApp/1.0' }
        });
        const results = resp.data.map(r => ({
            name:        r.display_name,
            lat:         parseFloat(r.lat),
            lon:         parseFloat(r.lon),
            type:        r.type,
            importance:  r.importance
        }));
        res.json({ results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/**
 * GET /api/ml-health
 * Checks if the Flask ML API is up and returns its status.
 */
app.get('/api/ml-health', async (req, res) => {
    try {
        const response = await axios.get(`${FLASK_URL}/health`, { timeout: 3000 });
        res.json({ node: 'healthy', flask: response.data });
    } catch (err) {
        res.json({
            node: 'healthy',
            flask: { status: 'unreachable', error: err.message }
        });
    }
});


/**
 * GET /api/crops
 * Lists all supported crops with metadata.
 */
app.get('/api/crops', (req, res) => {
    const crops = Object.keys(CROP_PRICES).map(crop => ({
        name:    crop,
        prices:  CROP_PRICES[crop],
        details: CROP_DETAILS[crop]
    }));
    res.json({ crops, total: crops.length });
});


// ────────────────────────────────────────────────────────────────
// CATCH-ALL: Serve frontend for any non-API route (SPA support)
// ────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});


// ────────────────────────────────────────────────────────────────
// START SERVER
// ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  🌾 CROP RECOMMENDATION — NODE.JS SERVER  ║');
    console.log(`║  http://localhost:${PORT}                    ║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log(`\n  Backend:  http://localhost:${PORT}`);
    console.log(`  ML API:   ${FLASK_URL}`);
    console.log('\n  Endpoints:');
    console.log('   POST /api/predict    — Get crop recommendation');
    console.log('   GET  /api/weather    — Fetch weather by coordinates');
    console.log('   GET  /api/prices     — Crop market prices');
    console.log('   GET  /api/geocode    — Forward geocoding');
    console.log('   GET  /api/ml-health  — Check Flask API status\n');
});

module.exports = app; // Export for testing (Jest/Mocha)
