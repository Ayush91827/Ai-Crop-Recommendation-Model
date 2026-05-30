/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   MAIN.JS — Form Handling, API Calls, Result Display             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * WHAT THIS FILE DOES:
 *   - Handles form submission and input validation
 *   - Calls the Node.js API for crop predictions
 *   - Renders prediction results with confidence bars
 *   - Displays market prices and crop details
 *   - Draws the suitability chart using Canvas API
 *   - Shows soil improvement tips
 *   - Handles loading states and error messages
 *
 * INTERVIEW: "What is the Fetch API and how is it different from XMLHttpRequest?"
 *   → Fetch: Modern, Promise-based, cleaner syntax (ES6)
 *   → XHR: Old, callback-based, more verbose
 *   → Both send HTTP requests, but Fetch integrates with async/await
 *   → axios (used in server.js) adds timeouts, interceptors, auto JSON parsing
 */

// ─────────────────────────────────────────────
// CONSTANTS & STATE
// ─────────────────────────────────────────────
const API_BASE = 'https://crop-backend.onrender.com';  // Empty = same origin (Node.js server)

let currentPrediction = null;  // Store last prediction for re-render
let isLoading = false;

// Crop emoji mapping for visual appeal
const CROP_EMOJIS = {
    rice: '🌾', maize: '🌽', chickpea: '🫘', kidneybeans: '🫘',
    pigeonpeas: '🌿', mothbeans: '🌱', mungbean: '🌿', blackgram: '🌱',
    lentil: '🌿', pomegranate: '🍎', banana: '🍌', mango: '🥭',
    grapes: '🍇', watermelon: '🍉', muskmelon: '🍈', apple: '🍎',
    orange: '🍊', papaya: '🍈', coconut: '🥥', cotton: '🌸',
    jute: '🌿', coffee: '☕'
};

const TREND_COLORS = {
    rising:   '#16a34a',
    stable:   '#2563eb',
    falling:  '#dc2626',
    seasonal: '#d97706'
};


// ─────────────────────────────────────────────
// DOM READY
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌾 Crop Advisor Initialized');

    // Check ML health on startup
    checkMLHealth();

    // Attach form submit handler
    const form = document.getElementById('soil-form');
    if (form) form.addEventListener('submit', handleFormSubmit);

    // Attach real-time validation to inputs
    document.querySelectorAll('.soil-input').forEach(input => {
        input.addEventListener('input', validateField);
        input.addEventListener('blur', validateField);  // Validate on focus-out
    });

    // pH slider (range input) syncs with number input
    const phSlider = document.getElementById('ph-slider');
    const phInput  = document.getElementById('input-ph');
    if (phSlider && phInput) {
        phSlider.addEventListener('input', () => { phInput.value = phSlider.value; });
        phInput.addEventListener('input', () => { phSlider.value = phInput.value; });
    }
});


// ─────────────────────────────────────────────
// ML HEALTH CHECK
// ─────────────────────────────────────────────
async function checkMLHealth() {
    try {
        const res = await fetch(`${API_BASE}/api/ml-health`);
        const data = await res.json();
        const indicator = document.getElementById('ml-status-indicator');
        const statusText = document.getElementById('ml-status-text');

        if (data.flask?.status === 'healthy') {
            if (indicator) indicator.className = 'status-dot green';
            if (statusText) statusText.textContent = `AI Ready (${data.flask.accuracy}% accuracy)`;
        } else {
            if (indicator) indicator.className = 'status-dot red';
            if (statusText) statusText.textContent = 'AI service loading...';
        }
    } catch (err) {
        const indicator = document.getElementById('ml-status-indicator');
        if (indicator) indicator.className = 'status-dot yellow';
    }
}


// ─────────────────────────────────────────────
// FORM VALIDATION
// ─────────────────────────────────────────────
/**
 * Validates a single input field against min/max constraints.
 * Shows inline error messages for UX feedback.
 *
 * INTERVIEW: "What's the difference between client-side and server-side validation?"
 *   → Client-side: Instant feedback, better UX, but can be bypassed
 *   → Server-side: Required for security, always runs, user can't bypass
 *   → ALWAYS do both. Client for UX, server for security.
 */
function validateField(event) {
    const input = event.target;
    const min   = parseFloat(input.min);
    const max   = parseFloat(input.max);
    const value = parseFloat(input.value);
    const errorEl = document.getElementById(`${input.id}-error`);

    if (input.value === '') {
        setFieldState(input, errorEl, 'empty', '');
        return false;
    }
    if (isNaN(value)) {
        setFieldState(input, errorEl, 'error', 'Please enter a valid number');
        return false;
    }
    if (!isNaN(min) && value < min) {
        setFieldState(input, errorEl, 'error', `Minimum value is ${min}`);
        return false;
    }
    if (!isNaN(max) && value > max) {
        setFieldState(input, errorEl, 'error', `Maximum value is ${max}`);
        return false;
    }

    setFieldState(input, errorEl, 'valid', '✓');
    return true;
}

function setFieldState(input, errorEl, state, message) {
    input.classList.remove('input-valid', 'input-error');
    if (state === 'valid') input.classList.add('input-valid');
    if (state === 'error') input.classList.add('input-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.className = `field-error ${state === 'error' ? 'visible' : ''}`;
    }
}


// ─────────────────────────────────────────────
// FORM SUBMISSION
// ─────────────────────────────────────────────
/**
 * Main form submit handler.
 * Validates → Collects data → Calls API → Displays results
 *
 * async/await makes asynchronous code readable as synchronous.
 * Without async/await: deeply nested .then().then().catch() chains ("callback hell")
 */
async function handleFormSubmit(event) {
    event.preventDefault();  // Prevent default page reload

    if (isLoading) return;  // Prevent double-submit

    // Validate all fields
    const allValid = validateAllFields();
    if (!allValid) {
        showToast('error', '⚠️ Please check all fields');
        return;
    }

    // Collect form data
    const formData = {
        N:           parseFloat(document.getElementById('input-n').value),
        P:           parseFloat(document.getElementById('input-p').value),
        K:           parseFloat(document.getElementById('input-k').value),
        temperature: parseFloat(document.getElementById('input-temperature').value),
        humidity:    parseFloat(document.getElementById('input-humidity').value),
        ph:          parseFloat(document.getElementById('input-ph').value),
        rainfall:    parseFloat(document.getElementById('input-rainfall').value),
    };

    // Include coordinates if user selected a location
    if (window.userLat) formData.lat = window.userLat;
    if (window.userLon) formData.lon = window.userLon;

    await submitPrediction(formData);
}

function validateAllFields() {
    const fieldIds = ['input-n', 'input-p', 'input-k', 'input-temperature',
                      'input-humidity', 'input-ph', 'input-rainfall'];
    return fieldIds.every(id => {
        const el = document.getElementById(id);
        if (!el) return false;
        return validateField({ target: el });
    });
}


/**
 * Sends the prediction request to Node.js backend.
 * Handles loading states, errors, and displays results.
 *
 * INTERVIEW: "How do you handle API errors in the frontend?"
 *   → Check response.ok (status 200-299)
 *   → Parse error JSON from server
 *   → Show user-friendly message (not technical error)
 *   → Log full error for debugging
 *   → Use try-catch for network failures
 */
async function submitPrediction(formData) {
    setLoadingState(true);
    hideResults();
    scrollTo('#results-section', true);

    try {
        const response = await fetch(`${API_BASE}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        // Check HTTP status BEFORE parsing JSON
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || errData.hint || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Save globally
        currentPrediction = data;

        // Render everything
        renderPredictions(data);
        renderWeatherCard(data.weather, data.location);
        renderSoilSummary(data.input);
        drawSuitabilityChart(data.full_ranking || data.predictions);
        renderSoilTips(data.input);

        showToast('success', `✅ ${t('successPredicted')}`);
        scrollTo('#results-section');

    } catch (err) {
        console.error('Prediction failed:', err);

        let userMessage = t('errorGeneral');
        if (err.message.includes('ML service')) userMessage = t('errorMLDown');
        if (err.message.includes('fetch')) userMessage = t('errorNoInternet');
        if (err.message.includes('Validation')) userMessage = err.message;

        showError(userMessage);
        showToast('error', `❌ ${userMessage}`);

    } finally {
        setLoadingState(false);
    }
}


// ─────────────────────────────────────────────
// RESULT RENDERING
// ─────────────────────────────────────────────

/**
 * Renders the top-3 crop prediction cards.
 * Each card shows: crop name (English + Hindi), confidence %, prices, details.
 */
function renderPredictions(data) {
    const container = document.getElementById('predictions-container');
    if (!container) return;

    const preds = data.predictions;
    if (!preds || preds.length === 0) {
        container.innerHTML = '<p class="no-results">No predictions available</p>';
        return;
    }

    container.innerHTML = preds.map((pred, index) => {
        const emoji = CROP_EMOJIS[pred.crop] || '🌱';
        const isTop = index === 0;
        const trendColor = TREND_COLORS[pred.prices?.trend] || '#2563eb';
        const hindiName = pred.hindi_name || getCropHindiName(pred.crop);

        return `
        <div class="prediction-card ${isTop ? 'top-prediction' : 'alt-prediction'}" 
             style="animation-delay: ${index * 0.15}s">
            ${isTop ? '<div class="top-badge">⭐ Best Match</div>' : `<div class="rank-badge">#${index + 1}</div>`}

            <div class="crop-header">
                <div class="crop-emoji">${emoji}</div>
                <div class="crop-name-block">
                    <h3 class="crop-name">${capitalize(pred.crop)}</h3>
                    <p class="crop-hindi">${hindiName}</p>
                    <span class="crop-category ${pred.category?.toLowerCase().replace(' ', '-')}">${pred.category || 'Field Crop'}</span>
                </div>
                <div class="confidence-ring" title="${pred.confidence}% confidence">
                    <svg width="70" height="70" viewBox="0 0 70 70">
                        <circle cx="35" cy="35" r="28" fill="none" stroke="#e5e7eb" stroke-width="6"/>
                        <circle cx="35" cy="35" r="28" fill="none" 
                                stroke="${isTop ? '#22c55e' : '#3b82f6'}" stroke-width="6"
                                stroke-dasharray="${2 * Math.PI * 28}"
                                stroke-dashoffset="${2 * Math.PI * 28 * (1 - pred.confidence / 100)}"
                                stroke-linecap="round"
                                transform="rotate(-90 35 35)"
                                style="transition: stroke-dashoffset 1.5s ease"/>
                        <text x="35" y="39" text-anchor="middle" 
                              fill="${isTop ? '#16a34a' : '#2563eb'}" 
                              font-size="13" font-weight="700">${pred.confidence}%</text>
                    </svg>
                </div>
            </div>

            <!-- Confidence Progress Bar -->
            <div class="confidence-bar-container">
                <span class="confidence-label">${t('confidence')}</span>
                <div class="progress-bar">
                    <div class="progress-fill" 
                         style="width: 0%; background: ${isTop ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#3b82f6,#2563eb)'}"
                         data-target="${pred.confidence}">
                    </div>
                </div>
                <span class="confidence-value">${pred.confidence}%</span>
            </div>

            <!-- Crop Info Grid -->
            <div class="crop-info-grid">
                <div class="info-item">
                    <span class="info-icon">📅</span>
                    <span class="info-label" data-key="season">${t('season')}</span>
                    <span class="info-value">${pred.season || 'Year-round'}</span>
                </div>
                <div class="info-item">
                    <span class="info-icon">💧</span>
                    <span class="info-label" data-key="waterReq">${t('waterReq')}</span>
                    <span class="info-value">${pred.details?.water_requirement || 'Medium'}</span>
                </div>
                <div class="info-item">
                    <span class="info-icon">⏱️</span>
                    <span class="info-label" data-key="duration">${t('duration')}</span>
                    <span class="info-value">${pred.details?.crop_duration || '120 days'}</span>
                </div>
                <div class="info-item">
                    <span class="info-icon">💰</span>
                    <span class="info-label" data-key="expectedProfit">${t('expectedProfit')}</span>
                    <span class="info-value profit">${pred.details?.expected_profit || 'Varies'}</span>
                </div>
            </div>

            <!-- Market Price Section -->
            <div class="price-section">
                <h4 class="price-title">💰 ${t('priceTitle')}</h4>
                <div class="price-grid">
                    <div class="price-item">
                        <span class="price-key" data-key="mspLabel">${t('mspLabel')}</span>
                        <span class="price-val msp-price">${pred.prices?.msp || 'No MSP'}</span>
                    </div>
                    <div class="price-item">
                        <span class="price-key" data-key="marketRange">${t('marketRange')}</span>
                        <span class="price-val">${pred.prices?.market_low} – ${pred.prices?.market_high}</span>
                    </div>
                    <div class="price-item">
                        <span class="price-key" data-key="priceTrend">${t('priceTrend')}</span>
                        <span class="price-val trend" style="color:${trendColor}">
                            ${pred.prices?.trend_symbol} ${t('trend' + capitalize(pred.prices?.trend || 'stable'))}
                        </span>
                    </div>
                </div>
                <p class="price-unit">📦 ${t('priceUnit')}</p>
            </div>
        </div>`;
    }).join('');

    // Show results section
    document.getElementById('results-section').style.display = 'block';

    // Animate progress bars after render
    requestAnimationFrame(() => {
        setTimeout(() => {
            document.querySelectorAll('.progress-fill').forEach(bar => {
                bar.style.width = bar.dataset.target + '%';
            });
        }, 200);
    });
}


/**
 * Renders the current weather data card.
 */
function renderWeatherCard(weather, location) {
    const card = document.getElementById('weather-card');
    if (!card || !weather) return;

    const locationStr = location
        ? [location.city, location.state].filter(Boolean).join(', ')
        : 'Selected location';

    card.innerHTML = `
        <h3 class="card-title">${t('weatherTitle')}</h3>
        <p class="weather-location">📍 ${locationStr}</p>
        <div class="weather-grid">
            <div class="weather-item">
                <span class="weather-icon">🌡️</span>
                <span class="weather-val">${weather.temperature}°C</span>
                <span class="weather-key">${t('tempLabel')}</span>
            </div>
            <div class="weather-item">
                <span class="weather-icon">💧</span>
                <span class="weather-val">${weather.humidity}%</span>
                <span class="weather-key">${t('humidLabel')}</span>
            </div>
            <div class="weather-item">
                <span class="weather-icon">🌧️</span>
                <span class="weather-val">${Math.round(weather.rainfall)} mm</span>
                <span class="weather-key">${t('rainfallLabel')}</span>
            </div>
            <div class="weather-item">
                <span class="weather-icon">🌬️</span>
                <span class="weather-val">${weather.wind_speed} m/s</span>
                <span class="weather-key">Wind</span>
            </div>
        </div>
        <p class="weather-desc">☁️ ${capitalize(weather.description || '')}</p>
        ${weather.fromCache ? '<span class="cache-badge">📦 Cached</span>' : ''}
    `;
    card.style.display = 'block';
}

// Expose for map.js to call
window.displayWeatherCard = renderWeatherCard;


/**
 * Renders the input soil parameters summary table.
 * Lets farmer see exactly what they entered / what was auto-filled.
 */
function renderSoilSummary(input) {
    const el = document.getElementById('soil-summary');
    if (!el || !input) return;

    const items = [
        { key: 'N', label: 'Nitrogen',     unit: 'kg/ha', icon: '🌿' },
        { key: 'P', label: 'Phosphorus',   unit: 'kg/ha', icon: '🟡' },
        { key: 'K', label: 'Potassium',    unit: 'kg/ha', icon: '🟠' },
        { key: 'temperature', label: 'Temperature', unit: '°C', icon: '🌡️' },
        { key: 'humidity',    label: 'Humidity',    unit: '%',  icon: '💧' },
        { key: 'ph',          label: 'Soil pH',     unit: '',   icon: '⚗️' },
        { key: 'rainfall',    label: 'Rainfall',    unit: 'mm', icon: '🌧️' },
    ];

    el.innerHTML = `
        <h4 class="summary-title">📋 Soil Parameters Used</h4>
        <div class="summary-grid">
            ${items.map(item => `
                <div class="summary-item">
                    <span class="s-icon">${item.icon}</span>
                    <span class="s-label">${item.label}</span>
                    <span class="s-value">${input[item.key] ?? '—'} ${item.unit}</span>
                </div>
            `).join('')}
        </div>
    `;
    el.style.display = 'block';
}


/**
 * Draws the crop suitability horizontal bar chart using Canvas API.
 * Shows top 8 crops and their predicted confidence scores.
 *
 * INTERVIEW: "Why Canvas instead of a charting library?"
 *   → No extra library weight (~100KB saved)
 *   → Full control over every pixel
 *   → Canvas is hardware-accelerated
 *   → In production: Chart.js or Recharts are more maintainable
 */
function drawSuitabilityChart(crops) {
    const canvas = document.getElementById('suitability-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width  = canvas.offsetWidth || 600;
    const H = canvas.height = Math.max(320, crops.length * 45 + 60);

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, W, H);

    const topCrops = crops.slice(0, 8);
    const barHeight = 32;
    const startX = 140;
    const barMaxWidth = W - startX - 60;

    // Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px Poppins, sans-serif';
    ctx.fillText(t('chartTitle'), 12, 24);

    topCrops.forEach((crop, i) => {
        const y = 45 + i * 42;
        const conf = typeof crop === 'object' ? (crop.confidence || 0) : 0;
        const name = typeof crop === 'object' ? (crop.crop || '') : '';
        const barW = (conf / 100) * barMaxWidth;

        // Crop name (left side)
        ctx.fillStyle = '#475569';
        ctx.font = '12px Poppins, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(capitalize(name), startX - 8, y + barHeight / 2 + 4);

        // Bar background
        ctx.fillStyle = '#e2e8f0';
        roundRect(ctx, startX, y, barMaxWidth, barHeight, 6, '#e2e8f0');

        // Color gradient based on rank
        const gradient = ctx.createLinearGradient(startX, y, startX + barW, y);
        if (i === 0) {
            gradient.addColorStop(0, '#22c55e');
            gradient.addColorStop(1, '#16a34a');
        } else if (i === 1) {
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#2563eb');
        } else {
            gradient.addColorStop(0, '#94a3b8');
            gradient.addColorStop(1, '#64748b');
        }

        if (barW > 0) {
            roundRect(ctx, startX, y, barW, barHeight, 6, gradient);
        }

        // Confidence % label on bar
        ctx.fillStyle = barW > 50 ? 'white' : '#334155';
        ctx.font = 'bold 12px Poppins, sans-serif';
        ctx.textAlign = 'left';
        const labelX = barW > 50 ? startX + barW - 42 : startX + barW + 8;
        ctx.fillText(`${conf.toFixed(1)}%`, labelX, y + barHeight / 2 + 4);
    });

    ctx.textAlign = 'left';
}

// Helper: draw rounded rectangle on canvas
function roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
}


/**
 * Generates soil improvement tips based on the input values.
 * Helps farmers understand how to improve their soil for next season.
 */
function renderSoilTips(input) {
    const container = document.getElementById('soil-tips');
    if (!container || !input) return;

    const tips = [];

    // N, P, K analysis
    if (input.N < 30) tips.push({ type: 'warning', text: t('tipLowN'), icon: '🌿' });
    if (input.P < 30) tips.push({ type: 'warning', text: t('tipLowP'), icon: '🟡' });
    if (input.K < 20) tips.push({ type: 'warning', text: t('tipLowK'), icon: '🟠' });
    if (input.ph > 8.0) tips.push({ type: 'info',    text: t('tipHighPh'), icon: '⚗️' });
    if (input.ph < 5.5) tips.push({ type: 'info',    text: t('tipLowPh'),  icon: '⚗️' });
    if (tips.length === 0) {
        tips.push({ type: 'success', text: '✅ Soil parameters look good!', icon: '🌱' });
    }

    container.innerHTML = `
        <h4 class="tips-title">💡 ${t('tipsTitle')}</h4>
        <ul class="tips-list">
            ${tips.map(tip => `
                <li class="tip-item ${tip.type}">
                    <span class="tip-icon">${tip.icon}</span>
                    <span class="tip-text">${tip.text}</span>
                </li>
            `).join('')}
        </ul>
    `;
    container.style.display = 'block';
}


// ─────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────

function setLoadingState(loading) {
    isLoading = loading;
    const btn = document.getElementById('predict-btn');
    const spinner = document.getElementById('loading-overlay');

    if (btn) {
        btn.disabled = loading;
        btn.innerHTML = loading
            ? `<span class="btn-spinner"></span> ${t('loading')}`
            : `🔍 ${t('predictBtn')}`;
    }
    if (spinner) spinner.style.display = loading ? 'flex' : 'none';
}

function hideResults() {
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('weather-card').style.display = 'none';
    document.getElementById('soil-summary').style.display = 'none';
    document.getElementById('soil-tips').style.display = 'none';
}

function showError(message) {
    const errEl = document.getElementById('error-message');
    if (errEl) {
        errEl.textContent = message;
        errEl.style.display = 'block';
        setTimeout(() => { errEl.style.display = 'none'; }, 8000);
    }
    document.getElementById('results-section').style.display = 'block';
}

function showToast(type, message) {
    const toast = document.getElementById('toast-container');
    if (!toast) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    toast.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 400);
    }, 3000);
}

function scrollTo(selector, instant = false) {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'start' });
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function resetForm() {
    document.getElementById('soil-form')?.reset();
    hideResults();
    window.userLat = null;
    window.userLon = null;
    document.querySelectorAll('.soil-input').forEach(el => {
        el.classList.remove('input-valid', 'input-error');
        el.style.borderColor = '';
    });
    document.getElementById('location-status').style.display = 'none';
    showToast('info', 'Form reset ✓');
}

// Fill demo values for testing
function fillDemoValues() {
    const demo = { n: 90, p: 42, k: 43, temperature: 21, humidity: 82, ph: 6.5, rainfall: 203 };
    Object.entries(demo).forEach(([key, val]) => {
        const el = document.getElementById(`input-${key}`);
        if (el) el.value = val;
    });
    document.getElementById('ph-slider').value = demo.ph;
    showToast('info', '✍️ Demo values filled');
}
