# 🌾 AI-Based Crop Recommendation System
## Complete Developer Guide — Code Walkthrough + Interview Q&A

---

## 📁 PROJECT STRUCTURE

```
crop-recommendation/
│
├── ml/                          ← Python Machine Learning
│   ├── train_model.py           ← STEP 1: Train the AI model
│   ├── flask_api.py             ← STEP 2: Serve predictions via REST API
│   ├── requirements.txt         ← Python dependencies
│   └── models/                  ← Auto-created after training
│       ├── crop_model.pkl       ← Trained Random Forest
│       ├── scaler.pkl           ← Feature scaler
│       ├── label_encoder.pkl    ← Crop name ↔ number mapping
│       └── model_metadata.json  ← Accuracy, features info
│
├── backend/                     ← Node.js Express Server
│   ├── server.js                ← STEP 3: Main API server
│   ├── package.json             ← Node dependencies
│   └── .env.example             ← Environment variable template
│
└── frontend/                    ← HTML/CSS/JavaScript UI
    ├── index.html               ← STEP 4: Main page
    ├── css/
    │   └── style.css            ← All styling
    └── js/
        ├── translations.js      ← Hindi/English language support
        ├── map.js               ← Leaflet map, location, geocoding
        └── main.js              ← Form handling, API calls, results
```

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (User)                       │
│  HTML + CSS + JavaScript (index.html)                    │
│  • Form inputs (N, P, K, temp, humidity, pH, rainfall)   │
│  • Leaflet.js map for location selection                 │
│  • Hindi/English toggle                                  │
│  • Results display with prices                           │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP POST /api/predict
                      ▼
┌─────────────────────────────────────────────────────────┐
│              NODE.JS SERVER (server.js)                  │
│  Port: 3000                                              │
│  • Serves static files                                   │
│  • Aggregates: ML result + Weather + Prices              │
│  • Caches weather data (10 min)                          │
│  • Rate limiting (100 req/15min per IP)                  │
└────────┬────────────┬────────────────────────────────────┘
         │            │            │
         ▼            ▼            ▼
  ┌──────────┐  ┌──────────┐  ┌──────────────┐
  │ FLASK ML │  │ Weather  │  │ Nominatim    │
  │ Port:5000│  │ API (OWM)│  │ Geocoding    │
  │ /predict │  │          │  │ (Free, OSM)  │
  └──────────┘  └──────────┘  └──────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              RANDOM FOREST MODEL (.pkl)                   │
│  Input:  N, P, K, temperature, humidity, pH, rainfall    │
│  Output: crop name + confidence % for all 22 crops       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 HOW TO RUN — STEP BY STEP

### Step 1: Clone & Setup
```bash
cd crop-recommendation
```

### Step 2: Train the ML Model (Python)
```bash
cd ml
pip install -r requirements.txt
python train_model.py
# Expected output: "✅ TRAINING COMPLETE! Accuracy: 97.xx%"
# Creates: models/crop_model.pkl, models/scaler.pkl, models/label_encoder.pkl
```

### Step 3: Start Flask API
```bash
# Still in the ml/ folder
python flask_api.py
# Output: * Running on http://0.0.0.0:5000
```

### Step 4: Start Node.js Server
```bash
cd ../backend
npm install
cp .env.example .env
# Edit .env: add your OpenWeatherMap API key
node server.js
# Output: http://localhost:3000
```

### Step 5: Open the App
```
Open browser → http://localhost:3000
```

---

## 📖 EXPLANATION OF EACH FILE

---

### 📄 train_model.py — Machine Learning Training

**What it does:**
Trains a Random Forest Classifier on 22 crops using 7 soil/climate features.

**Key concepts:**

| Concept | Explanation |
|---------|-------------|
| `create_dataset()` | Creates 200 samples per crop using crop-specific parameter ranges |
| `perform_eda()` | Checks data quality, missing values, class distribution |
| `preprocess()` | LabelEncodes crop names, StandardScales features, splits 80/20 |
| `train_random_forest()` | Trains 200 decision trees with 5-fold cross-validation |
| `evaluate_model()` | Accuracy, F1-score, confusion matrix, feature importance |
| `save_artifacts()` | Saves model, scaler, encoder as .pkl files using joblib |

**Why Random Forest?**
- Each tree in the forest votes → reduces overfitting
- Feature importance tells us: "rainfall matters more than pH for rice"
- Achieves 97%+ accuracy on this dataset
- Handles non-linear relationships (e.g., rice needs BOTH high rainfall AND warm temp)

---

### 📄 flask_api.py — Python REST API

**Endpoints:**
```
GET  /health           → Is the API running? (for monitoring)
GET  /model-info       → Accuracy, feature names, crop list
GET  /crops            → All 22 supported crops
POST /predict          → Main endpoint: returns top-3 recommendations
POST /batch-predict    → Multiple soil samples at once
```

**How `/predict` works:**
```
1. Receive JSON: {N: 90, P: 42, K: 43, temp: 21, humidity: 82, ph: 6.5, rainfall: 203}
2. Validate: all 7 fields, within min/max range
3. Scale: scaler.transform(input)  ← same scaler used in training
4. Predict: model.predict_proba(scaled_input)  ← probabilities for all 22 crops
5. Sort by probability → Top 3
6. Return: [{rank:1, crop:"rice", confidence:94.5%, ...}, ...]
```

---

### 📄 server.js — Node.js Backend

**Why Node.js in the middle?**
1. **API Key Security**: OpenWeatherMap key stays on server, not in browser JS
2. **Data Aggregation**: Combines ML result + weather + prices in ONE response
3. **Caching**: `node-cache` stores weather for 10 min (saves API calls)
4. **Rate Limiting**: 100 requests per IP per 15 min (prevents abuse)

**Key routes:**
```javascript
POST /api/predict     → coordinates → auto-fill weather → call Flask → add prices
GET  /api/weather     → lat/lon → OpenWeatherMap → return temp, humidity, rainfall
GET  /api/prices      → return all 22 crop prices (MSP + market range)
GET  /api/geocode     → place name → lat/lon (via Nominatim/OSM)
```

---

### 📄 index.html — Frontend Structure

**Sections:**
1. `<header>` — Sticky navbar with language toggle and ML status
2. `#hero` — Landing section with floating crop price cards
3. `#form-section` — Location picker + soil parameter form
4. `#results-section` — Predictions + weather + chart + prices
5. `<footer>` — Resources and tech stack

---

### 📄 style.css — Styling

**Key patterns:**
- **CSS Variables** → `:root { --green-500: #22c55e; }` — change once, update everywhere
- **CSS Grid** → `grid-template-columns: 1.2fr 1fr 1fr` for prediction cards
- **Animations** → `@keyframes slideUp` for result cards appearing
- **Responsive** → `@media (max-width: 600px)` collapses to single column

---

### 📄 translations.js — Hindi/English

**How language switching works:**
```javascript
// Every HTML element has a data attribute:
<h1 data-key="appTitle">AI Crop Advisor</h1>

// setLanguage('hi') loops through all elements:
document.querySelectorAll('[data-key]').forEach(el => {
    el.textContent = TRANSLATIONS['hi'][el.dataset.key];
});
// Result: "AI Crop Advisor" → "AI फसल सलाहकार"
```

**Hindi font:**
When Hindi is selected, `font-family` switches to `'Noto Sans Devanagari'`
for proper rendering of Devanagari script.

---

### 📄 map.js — Location & Map

**Three ways to select location:**
1. **GPS** (`useMyLocation`) → `navigator.geolocation.getCurrentPosition()`
2. **Search** (`searchLocation`) → Nominatim forward geocoding → place results
3. **Map click** → `map.on('click', placeMarker)` → Nominatim reverse geocoding

**After location is selected:**
- Fetch weather from OpenWeatherMap (via Node.js proxy)
- Auto-fill temperature, humidity, rainfall in form
- Show green highlight on auto-filled fields

---

### 📄 main.js — Form Logic & Results

**Prediction flow:**
```
validateAllFields()
    ↓ (all valid)
fetch('/api/predict', { method: 'POST', body: JSON.stringify(formData) })
    ↓ (response)
renderPredictions(data)     ← Top-3 cards with confidence rings
renderWeatherCard(data)     ← Weather from selected location
renderSoilSummary(data)     ← What values were used
drawSuitabilityChart(data)  ← Canvas bar chart for top 10 crops
renderSoilTips(data)        ← Improvement suggestions
```

---

## 🎤 INTERVIEW QUESTIONS & ANSWERS

---

### Q1: "Why did you choose Random Forest over other ML algorithms?"

**A:** Random Forest is ideal for this problem because:
- It's an ensemble of 200 decision trees — each tree sees a random subset of data and features
- It handles non-linear relationships well (e.g., rice needs high rainfall AND warm temperature simultaneously — a linear model can't capture this "AND" relationship)
- It's resistant to overfitting because trees are built on different subsets
- It provides feature importance — we can tell farmers "rainfall matters most for your crop choice"
- It achieves 97%+ accuracy on this tabular data with minimal tuning
- Alternatives: SVM (slower on 2200+ samples), Neural Network (overkill, needs more data), Logistic Regression (can't capture non-linear patterns)

---

### Q2: "What is the role of StandardScaler? Does Random Forest even need it?"

**A:** 
- Technically, Random Forest doesn't need feature scaling because it makes splits based on feature values relative to other samples in the same tree, not on absolute magnitudes
- However, we still scale for two important reasons:
  1. We save the scaler to apply the SAME transformation to prediction inputs — consistency between training and inference is critical
  2. If we ever switch to a model that DOES need scaling (SVM, Logistic Regression), we don't need to change the pipeline
- The scaler transforms N=90 to z-score = (90 - mean_N) / std_N, ensuring all features are on similar scales

---

### Q3: "How does the system auto-fill weather data?"

**A:**
1. User clicks "Use My Location" or clicks on the map
2. Browser's `navigator.geolocation.getCurrentPosition()` returns lat/lon
3. Frontend sends coordinates to `GET /api/weather?lat=X&lon=Y` on Node.js
4. Node.js proxies to OpenWeatherMap API with the server-side API key
5. Returns temperature (°C), humidity (%), wind speed, description
6. We estimate monthly rainfall from the 1-hour rain data × 30
7. These values are auto-filled in the form with a green highlight
8. This saves farmers who don't have a thermometer or hygrometer

---

### Q4: "What is CORS and why is it needed?"

**A:**
- CORS = Cross-Origin Resource Sharing
- Browser security rule: A page on `http://localhost:3000` cannot call APIs on `http://localhost:5000` (different port = different "origin") without explicit permission
- Flask API needs `flask-cors` to add `Access-Control-Allow-Origin: *` header
- Node.js needs `cors` middleware for the same reason
- Without CORS: Browser blocks the request with "CORS policy" error in console
- In production: Restrict to your domain: `CORS(app, origins=["https://yourdomain.com"])`

---

### Q5: "How do you handle the case when the Flask API is down?"

**A:**
- In `server.js`, `axios.post()` is wrapped in `try-catch`
- If Flask is down, `axios` throws `ECONNREFUSED` error
- We catch this specific error and return HTTP 503 with message: "ML service unavailable. Run python flask_api.py"
- In production, we'd add a **circuit breaker** pattern (using `opossum` library) which automatically stops trying after X failures and returns a fallback response
- We could also cache the last successful prediction and return it as a fallback

---

### Q6: "Explain the predict_proba() output"

**A:**
- `model.predict_proba(input)` returns an array like: `[0.02, 0.945, 0.01, 0.005, ...]`
- Each value = fraction of 200 trees that voted for that crop
- 0.945 for rice means 189 out of 200 trees predicted rice
- We sort this array descending to get the top-3 recommendations
- The confidence percentages shown to users come directly from this array
- This is called "soft voting" in ensemble learning — better than "hard voting" (just majority winner)

---

### Q7: "How would you improve the system for production?"

**A:**
1. **Model**: Use GridSearchCV for hyperparameter tuning; retrain monthly with new data
2. **Real crop prices**: Connect to AGMARKNET API (data.gov.in) via daily cron job
3. **Database**: PostgreSQL to store user predictions and retrain with feedback
4. **Auth**: JWT authentication so farmers can save their field profiles
5. **Deployment**: Docker containers, Nginx reverse proxy, SSL certificate
6. **Monitoring**: Prometheus + Grafana for API latency, error rates
7. **Soil API**: Integrate with ICAR soil health card data for auto-fill NPK values
8. **Offline mode**: Service Worker to cache the app (important for rural India with poor connectivity)

---

### Q8: "What is the difference between MSP and market price shown?"

**A:**
- **MSP (Minimum Support Price)**: Guaranteed price set by Government of India. If market price falls below MSP, the government buys from farmers at MSP. Set annually in the Union Budget.
- **Market Price (Mandi Rate)**: Actual price at APMC (Agricultural Produce Market Committee) mandis. Fluctuates based on supply/demand, season, quality.
- **For farmers**: MSP is their safety net; market price is the actual realization.
- In our app, data comes from Ministry of Agriculture's Kharif/Rabi Season MSP announcements 2024-25 and AGMARKNET historical averages.

---

### Q9: "Why Node.js as an intermediary instead of calling Flask directly from frontend?"

**A:**
1. **Security**: API keys (OpenWeatherMap) must never be in frontend JS (anyone can view source)
2. **Aggregation**: The frontend needs ML result + weather + prices in one call — Node.js combines three API calls into one for the frontend
3. **Caching**: Node.js caches weather per location for 10 minutes — reduces costs and latency
4. **Rate Limiting**: Centralized rate limiting on the Node.js layer
5. **Business Logic**: Price enrichment, validation, error formatting happen in Node.js
6. **HTTPS Termination**: In production, Node.js handles SSL; Flask runs HTTP internally

---

### Q10: "How does the Hindi language toggle work technically?"

**A:**
1. Every UI element has a `data-key` HTML attribute: `<h1 data-key="appTitle">`
2. `translations.js` has an object with 'en' and 'hi' keys mapping to all text
3. `setLanguage('hi')` loops through `document.querySelectorAll('[data-key]')` and sets `textContent` to the Hindi string
4. Font is switched to `Noto Sans Devanagari` for proper Devanagari rendering
5. Preference saved to `localStorage` — persists across page reloads
6. A `languageChanged` custom event is dispatched so other modules (like map) can react

---

## 🔑 API KEYS NEEDED

| Service | Purpose | Cost |
|---------|---------|------|
| [OpenWeatherMap](https://openweathermap.org/api) | Live temperature, humidity | FREE (1M calls/mo) |
| Nominatim (OSM) | Geocoding & reverse geocoding | FREE (no key needed) |
| Leaflet + OpenStreetMap | Interactive map tiles | FREE (no key needed) |

---

## 📊 MODEL PERFORMANCE

| Metric | Value |
|--------|-------|
| Accuracy | ~97-99% |
| Algorithm | Random Forest (200 trees) |
| Training samples | 4,400 (200/crop × 22 crops) |
| Features | 7 (N, P, K, temp, humidity, pH, rainfall) |
| Classes | 22 crops |
| Cross-validation | 5-fold |

---

## 🌾 CROPS SUPPORTED (22)

**Cereals:** Rice, Maize
**Pulses:** Chickpea, Kidney Beans, Pigeon Peas, Moth Beans, Mung Bean, Black Gram, Lentil
**Fruits:** Pomegranate, Banana, Mango, Grapes, Watermelon, Muskmelon, Apple, Orange, Papaya
**Plantation:** Coconut, Coffee
**Cash/Fiber:** Cotton, Jute

---

*Built with Python (scikit-learn + Flask) + Node.js (Express) + Vanilla JS + Leaflet.js*
