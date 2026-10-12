/**
 * MAIN.JS — Form handling, predictions, weather integration
 */

const API_BASE = '';

let currentPrediction = null;
let isLoading         = false;

const CROP_EMOJIS = {
  rice:'🌾', maize:'🌽', chickpea:'🫘', kidneybeans:'🫘',
  pigeonpeas:'🌿', mothbeans:'🌱', mungbean:'🌿', blackgram:'🌱',
  lentil:'🌿', pomegranate:'🍎', banana:'🍌', mango:'🥭',
  grapes:'🍇', watermelon:'🍉', muskmelon:'🍈', apple:'🍎',
  orange:'🍊', papaya:'🍈', coconut:'🥥', cotton:'🌸',
  jute:'🌿', coffee:'☕'
};

document.addEventListener('DOMContentLoaded', function() {
  checkMLHealth();

  const form = document.getElementById('soil-form');
  if (form) form.addEventListener('submit', handleFormSubmit);

  document.querySelectorAll('.soil-input').forEach(inp => {
    inp.addEventListener('input', validateField);
    inp.addEventListener('blur',  validateField);
  });

  const phSlider = document.getElementById('ph-slider');
  const phInput  = document.getElementById('input-ph');
  if (phSlider && phInput) {
    phSlider.addEventListener('input', () => phInput.value  = phSlider.value);
    phInput.addEventListener('input',  () => phSlider.value = phInput.value);
  }
});

async function checkMLHealth() {
  try {
    const res  = await fetch(`${API_BASE}/api/ml-health`);
    const data = await res.json();
    const dot  = document.getElementById('ml-status-indicator');
    const txt  = document.getElementById('ml-status-text');
    const ok   = data.flask?.status === 'healthy';
    if (dot) dot.className = `status-dot ${ok ? 'green' : 'red'}`;
    if (txt) txt.textContent = ok
      ? `AI Ready (${data.flask.accuracy}% accuracy)`
      : 'AI service warming up...';
  } catch { /* silent */ }
}

function validateField(e) {
  const inp   = e.target;
  const min   = parseFloat(inp.min);
  const max   = parseFloat(inp.max);
  const val   = parseFloat(inp.value);
  const errEl = document.getElementById(`${inp.id}-error`);
  if (inp.value === '')      return setFieldState(inp, errEl, 'empty', '');
  if (isNaN(val))            return setFieldState(inp, errEl, 'error', 'Enter a valid number');
  if (!isNaN(min) && val < min) return setFieldState(inp, errEl, 'error', `Min is ${min}`);
  if (!isNaN(max) && val > max) return setFieldState(inp, errEl, 'error', `Max is ${max}`);
  setFieldState(inp, errEl, 'valid', '✓');
  return true;
}

function setFieldState(inp, errEl, state, msg) {
  inp.classList.remove('input-valid','input-error');
  if (state === 'valid') inp.classList.add('input-valid');
  if (state === 'error') inp.classList.add('input-error');
  if (errEl) { errEl.textContent = msg; errEl.className = `field-error ${state==='error'?'visible':''}`; }
}

function validateAllFields() {
  return ['input-n','input-p','input-k','input-temperature','input-humidity','input-ph','input-rainfall']
    .every(id => { const el = document.getElementById(id); return el && validateField({ target: el }); });
}

async function handleFormSubmit(e) {
  e.preventDefault();
  if (isLoading) return;
  if (!validateAllFields()) { showToast('error', '⚠️ Please check all fields'); return; }

  const formData = {
    N:           parseFloat(document.getElementById('input-n').value),
    P:           parseFloat(document.getElementById('input-p').value),
    K:           parseFloat(document.getElementById('input-k').value),
    temperature: parseFloat(document.getElementById('input-temperature').value),
    humidity:    parseFloat(document.getElementById('input-humidity').value),
    ph:          parseFloat(document.getElementById('input-ph').value),
    rainfall:    parseFloat(document.getElementById('input-rainfall').value),
  };
  if (window.userLat) formData.lat = window.userLat;
  if (window.userLon) formData.lon = window.userLon;

  await runQuickPredict(formData);
}

async function runQuickPredict(formData) {
  setLoadingState(true, 'Analysing soil data...');
  hideResults();

  try {
    const res = await fetch(`${API_BASE}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
    const data = await res.json();
    currentPrediction = data;

    renderPredictions(data);
    renderWeatherCard(data.weather, data.location);
    renderSoilSummary(data.input);
    drawSuitabilityChart(data.full_ranking || data.predictions);
    renderSoilTips(data.input);
    showResultsSection();
    showToast('success', '✅ Recommendation ready!');
  } catch (err) {
    console.error(err);
    showError(err.message.includes('ML service') ? 'ML service is starting up, please wait 30 seconds and try again.' : err.message);
  } finally {
    setLoadingState(false);
  }
}

function renderPredictions(data) {
  const container = document.getElementById('predictions-container');
  if (!container) return;

  const chartCard = document.querySelector('.chart-card');
  if (chartCard) chartCard.style.display = 'block';

  const preds = data.predictions || [];

  container.innerHTML = preds.map((pred, i) => {
    const emoji   = CROP_EMOJIS[pred.crop] || '🌱';
    const isTop   = i === 0;
    const prices  = pred.prices || {};
    const details = pred.details || {};

    const trendColor = prices.trend === 'rising' ? '#16a34a' : prices.trend === 'falling' ? '#dc2626' : '#2563eb';
    const trendIcon  = prices.trend === 'rising' ? '📈' : prices.trend === 'falling' ? '📉' : '➡️';

    return `
    <div class="prediction-card ${isTop ? 'top-prediction' : ''}" style="animation-delay:${i*.15}s">
      ${isTop ? '<div class="top-badge">⭐ Best Match</div>' : `<div class="rank-badge">#${i+1}</div>`}

      <div class="crop-header">
        <div class="crop-emoji">${emoji}</div>
        <div class="crop-name-block">
          <h3 class="crop-name">${capitalize(pred.crop)}</h3>
          <p class="crop-hindi">${pred.hindi_name || ''}</p>
          <span class="crop-category">${details.category || 'Crop'}</span>
        </div>
        <div class="confidence-ring">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="28" fill="none" stroke="#e5e7eb" stroke-width="6"/>
            <circle cx="36" cy="36" r="28" fill="none"
              stroke="${isTop ? '#22c55e' : '#3b82f6'}" stroke-width="6"
              stroke-dasharray="${2*Math.PI*28}"
              stroke-dashoffset="${2*Math.PI*28*(1-pred.confidence/100)}"
              stroke-linecap="round" transform="rotate(-90 36 36)"
              style="transition:stroke-dashoffset 1.5s ease"/>
            <text x="36" y="40" text-anchor="middle"
              fill="${isTop ? '#16a34a' : '#2563eb'}"
              font-size="13" font-weight="700">${pred.confidence}%</text>
          </svg>
        </div>
      </div>

      <div class="confidence-bar-container">
        <span class="confidence-label">Confidence</span>
        <div class="progress-bar">
          <div class="progress-fill"
            style="width:0%;background:${isTop ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#3b82f6,#2563eb)'}"
            data-target="${pred.confidence}"></div>
        </div>
        <span class="confidence-value">${pred.confidence}%</span>
      </div>

      <div class="crop-info-grid">
        <div class="info-item"><span class="info-icon">📅</span><span class="info-label">Season</span><span class="info-value">${details.season || '—'}</span></div>
        <div class="info-item"><span class="info-icon">💧</span><span class="info-label">Water</span><span class="info-value">${details.water_requirement || '—'}</span></div>
        <div class="info-item"><span class="info-icon">⏱️</span><span class="info-label">Duration</span><span class="info-value">${details.crop_duration || '—'}</span></div>
        <div class="info-item"><span class="info-icon">💰</span><span class="info-label">Profit/Ha</span><span class="info-value profit">${details.expected_profit || '—'}</span></div>
      </div>

      <div class="price-section">
        <div class="price-section-header">
          <h4 class="price-title">💰 Market Prices</h4>
          ${prices.is_live ? '<span class="live-badge">🔴 LIVE</span>' : '<span class="est-badge">📊 Estimate</span>'}
        </div>

        ${prices.live_price ? `
        <div class="live-price-row">
          <span class="live-price-label">Today's Price</span>
          <span class="live-price-value">${prices.live_price}/qtl</span>
        </div>` : ''}

        <div class="price-grid">
          <div class="price-item"><span class="price-key">MSP (Govt.)</span><span class="price-val msp-price">${prices.msp || 'No MSP'}</span></div>
          <div class="price-item"><span class="price-key">Market Range</span><span class="price-val">${prices.market_low || '—'} – ${prices.market_high || '—'}</span></div>
          ${prices.trend ? `<div class="price-item"><span class="price-key">Trend</span><span class="price-val" style="color:${trendColor}">${trendIcon} ${capitalize(prices.trend)}${prices.trend_pct ? `(${prices.trend_pct}%)` : ''}</span></div>` : ''}
        </div>

        ${prices.sample_markets?.length ? `
        <div class="mandi-markets">
          <p class="mandi-label">Recent mandi prices:</p>
          ${prices.sample_markets.map(m => `<span class="mandi-chip">📍 ${m.market} ₹${m.price}</span>`).join('')}
        </div>` : ''}

        <p class="price-source">
          ${prices.source || ''} · ${prices.source_date || ''}
        </p>
      </div>
    </div>`;
  }).join('');

  document.getElementById('results-section').style.display = 'block';

  requestAnimationFrame(() => setTimeout(() => {
    document.querySelectorAll('.progress-fill').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  }, 200));
}

function renderWeatherCard(weather, location) {
  const card = document.getElementById('weather-card');
  if (!card || !weather) return;
  const loc = location ? [location.city, location.state].filter(Boolean).join(', ') : 'Selected location';
  card.innerHTML = `
    <h3 class="card-title">🌤️ Current Weather</h3>
    <p class="weather-location">📍 ${loc}</p>
    <div class="weather-grid">
      <div class="weather-item"><span class="weather-icon">🌡️</span><span class="weather-val">${weather.temperature}°C</span><span class="weather-key">Temp</span></div>
      <div class="weather-item"><span class="weather-icon">💧</span><span class="weather-val">${weather.humidity}%</span><span class="weather-key">Humidity</span></div>
      <div class="weather-item"><span class="weather-icon">🌧️</span><span class="weather-val">${weather.rainfall}mm</span><span class="weather-key">Rainfall</span></div>
      <div class="weather-item"><span class="weather-icon">🌬️</span><span class="weather-val">${weather.wind_speed}m/s</span><span class="weather-key">Wind</span></div>
    </div>
    <p class="weather-desc">☁️ ${capitalize(weather.description || '')}</p>
    <p style="font-size:.7rem;color:#94a3b8;margin-top:6px">via OpenWeatherMap API</p>`;
  card.style.display = 'block';
}
window.renderWeatherCard = renderWeatherCard;

function renderSoilSummary(input) {
  const el = document.getElementById('soil-summary');
  if (!el || !input) return;
  const items = [
    { k:'N', label:'Nitrogen', unit:'kg/ha', icon:'🌿' },
    { k:'P', label:'Phosphorus', unit:'kg/ha', icon:'🟡' },
    { k:'K', label:'Potassium', unit:'kg/ha', icon:'🟠' },
    { k:'temperature', label:'Temperature', unit:'°C', icon:'🌡️' },
    { k:'humidity', label:'Humidity', unit:'%', icon:'💧' },
    { k:'ph', label:'Soil pH', unit:'', icon:'⚗️' },
    { k:'rainfall', label:'Rainfall', unit:'mm', icon:'🌧️' },
  ];
  el.innerHTML = `
    <h4 class="summary-title">📋 Soil Parameters Used</h4>
    <div class="summary-grid">
      ${items.map(it => `
        <div class="summary-item">
          <span class="s-icon">${it.icon}</span>
          <span class="s-label">${it.label}</span>
          <span class="s-value">${input[it.k] ?? '—'}${it.unit}</span>
        </div>`).join('')}
    </div>`;
  el.style.display = 'block';
}

function drawSuitabilityChart(crops) {
  const canvas = document.getElementById('suitability-chart');
  if (!canvas || !crops?.length) return;
  const ctx = canvas.getContext('2d');
  const W   = canvas.width  = canvas.offsetWidth || 580;
  const H   = canvas.height = Math.max(300, crops.length * 46 + 60);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);

  const top  = crops.slice(0, 8);
  const startX = 130;
  const bw     = W - startX - 60;

  ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px Poppins,sans-serif';
  ctx.fillText('Crop Suitability Analysis', 12, 22);

  top.forEach((c, i) => {
    const y    = 44 + i * 42;
    const conf = typeof c === 'object' ? (c.confidence || 0) : 0;
    const name = typeof c === 'object' ? (c.crop || '') : '';
    const bLen = (conf / 100) * bw;

    ctx.fillStyle = '#475569'; ctx.font = '12px Poppins,sans-serif';
    ctx.textAlign = 'right'; ctx.fillText(capitalize(name), startX - 8, y + 17);

    ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.roundRect(startX, y, bw, 30, 6); ctx.fill();

    if (bLen > 0) {
      const g = ctx.createLinearGradient(startX, y, startX + bLen, y);
      if (i === 0) { g.addColorStop(0,'#22c55e'); g.addColorStop(1,'#16a34a'); }
      else if (i === 1) { g.addColorStop(0,'#3b82f6'); g.addColorStop(1,'#2563eb'); }
      else { g.addColorStop(0,'#94a3b8'); g.addColorStop(1,'#64748b'); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(startX, y, bLen, 30, 6); ctx.fill();
    }

    ctx.fillStyle = bLen > 50 ? 'white' : '#334155';
    ctx.font = 'bold 11px Poppins,sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${conf.toFixed(1)}%`, bLen > 50 ? startX + bLen - 44 : startX + bLen + 6, y + 19);
  });
  ctx.textAlign = 'left';
}

function renderSoilTips(input) {
  const el = document.getElementById('soil-tips');
  if (!el || !input) return;
  const tips = [];
  if (input.N < 30) tips.push({ type:'warning', icon:'🌿', text:'Nitrogen is low — apply Urea (46-0-0) or organic compost' });
  if (input.P < 30) tips.push({ type:'warning', icon:'🟡', text:'Phosphorus is low — apply DAP (18-46-0) fertiliser' });
  if (input.K < 20) tips.push({ type:'warning', icon:'🟠', text:'Potassium is low — apply MOP (Muriate of Potash)' });
  if (input.ph > 8)  tips.push({ type:'info', icon:'⚗️', text:'Soil is alkaline — add sulphur or gypsum to reduce pH' });
  if (input.ph < 5.5) tips.push({ type:'info', icon:'⚗️', text:'Soil is acidic — add agricultural lime to raise pH' });
  if (!tips.length) tips.push({ type:'success', icon:'🌱', text:'Soil parameters look healthy — good for most crops!' });
  el.innerHTML = `
    <h4 class="tips-title">💡 Soil Improvement Tips</h4>
    <ul class="tips-list">
      ${tips.map(t=>`<li class="tip-item ${t.type}"><span>${t.icon}</span><span>${t.text}</span></li>`).join('')}
    </ul>`;
  el.style.display = 'block';
}

function showResultsSection() {
  const sec = document.getElementById('results-section');
  if (sec) sec.style.display = 'block';
  setTimeout(() => sec?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function hideResults() {
  ['results-section','weather-card','soil-summary','soil-tips'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const container = document.getElementById('predictions-container');
  if (container) container.innerHTML = '';
}

function setLoadingState(on, msg) {
  isLoading = on;
  const btn = document.getElementById('predict-btn');
  const ov  = document.getElementById('loading-overlay');
  const ltxt = document.getElementById('loading-text');
  if (btn) { btn.disabled = on; btn.innerHTML = on ? `<span class="btn-spinner"></span> ${msg || 'Loading...'}` : '🔍 Get Crop Recommendation'; }
  if (ov)  ov.style.display  = on ? 'flex' : 'none';
  if (ltxt && msg) ltxt.textContent = msg;
}

function showError(message) {
  const el = document.getElementById('error-message');
  if (el) { el.textContent = message; el.style.display = 'block'; setTimeout(() => el.style.display='none', 10000); }
  showResultsSection();
  showToast('error', message.slice(0, 80));
}

function showToast(type, message) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 4000);
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function resetForm() {
  document.getElementById('soil-form')?.reset();
  hideResults();
  window.userLat = null; window.userLon = null;
  document.querySelectorAll('.soil-input').forEach(el => { el.classList.remove('input-valid','input-error'); el.style.borderColor=''; el.style.background=''; });
  document.getElementById('location-status').style.display = 'none';
  showToast('info', 'Form reset ✓');
}

function fillDemoValues() {
  const d = { n:90, p:42, k:43, temperature:21, humidity:82, ph:6.5, rainfall:203 };
  Object.entries(d).forEach(([k,v]) => { const el = document.getElementById(`input-${k}`); if(el) el.value = v; });
  const s = document.getElementById('ph-slider'); if(s) s.value = 6.5;
  showToast('info', '📝 Demo values loaded');
}

function fillProfile(region) {
  const p = {
    punjab: { n:90, p:42, k:43, temperature:22, humidity:80, ph:7.0, rainfall:210 },
    deccan: { n:95, p:38, k:40, temperature:28, humidity:75, ph:7.8, rainfall:75  },
    kerala: { n:5,  p:5,  k:30, temperature:27, humidity:90, ph:6.0, rainfall:250 },
    mp:     { n:60, p:50, k:50, temperature:24, humidity:65, ph:6.5, rainfall:100 }
  }[region];
  if (!p) return;
  Object.entries(p).forEach(([k,v]) => { const el = document.getElementById(`input-${k}`); if(el) el.value = v; });
  const s = document.getElementById('ph-slider'); if(s) s.value = p.ph;
  showToast('info', `✅ ${region.toUpperCase()} profile loaded`);
}

function shareResults() {
  const top = currentPrediction?.predictions?.[0];
  if (!top) { showToast('error', 'Make a prediction first'); return; }
  const txt = `🌾 AI Crop Recommendation\nBest: ${top.crop.toUpperCase()} (${top.hindi_name}) — ${top.confidence}% confidence\nLive Price: ${top.prices?.live_price || top.prices?.market_low+' – '+top.prices?.market_high}/qtl\n\nPowered by AI Crop Advisor`;
  if (navigator.share) navigator.share({ title:'Crop Recommendation', text: txt });
  else navigator.clipboard.writeText(txt).then(() => showToast('success', '📋 Copied!'));
}