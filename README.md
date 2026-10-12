# 🌾 AI Crop Advisor | फसल मित्र

An intelligent, production-ready agricultural recommendation web application powered by a **Random Forest Machine Learning model** (trained via `scikit-learn`), real-time weather integration (**OpenWeatherMap API**), and robust bilingual support (**English & Hindi**).

---

## 🚀 Key Features

* **🧠 Machine Learning Prediction**: Utilizes an optimized Random Forest classifier and standard scaler to recommend the top 3 best-suited crops based on soil nutrients and environmental parameters.
* **🌤️ Live Weather Integration**: Automatically fetches real-time temperature, humidity, rainfall, and wind speed using latitude and longitude via the **OpenWeatherMap API**.
* **🗺️ Interactive Map & Geolocation**: Drop pins on an interactive **Leaflet.js** map or use device GPS to auto-fill location data effortlessly.
* **🌐 Full Bilingual Support (English & Hindi)**: Instant UI translation toggle managed via a comprehensive dictionary mapping system (`translations.js`) supporting Devanagari script.
* **📊 Market Estimates & MSP**: Displays government Minimum Support Prices (MSP), expected profit margins per hectare, and estimated market price ranges.
* **☁️ Serverless Flask Architecture**: Designed with the Flask Application Factory pattern, fully optimized for serverless deployment on **Vercel** backed by **Neon DB PostgreSQL** for telemetry logging.

---

## 🛠️ Tech Stack

* **Backend**: Python 3.10+, Flask, Flask-SQLAlchemy, Gunicorn
* **Machine Learning**: scikit-learn, Pandas, NumPy, Joblib
* **Database**: PostgreSQL (Neon DB)
* **Frontend**: HTML5, CSS3, JavaScript (ES6+), Leaflet.js
* **APIs**: OpenWeatherMap API, Nominatim OpenStreetMap (Reverse Geocoding)
* **Hosting**: Vercel (Serverless)

---

## 📁 Project Structure

```text
├── app/
│   ├── ml_models/
│   │   ├── crop_model.pkl       # Trained Random Forest classifier
│   │   ├── scaler.pkl           # Feature standard scaler
│   │   └── label_encoder.pkl    # Crop label encoder
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css        # Responsive styling and animations
│   │   └── js/
│   │       ├── main.js          # Form handling & prediction flow
│   │       ├── map.js           # Leaflet.js map, GPS & OpenWeather integration
│   │       └── translations.js  # English & Hindi translation dictionaries
│   ├── templates/
│   │   └── index.html           # Main frontend interface
│   ├── __init__.py              # Flask app factory initialization
│   ├── models.py                # SQLAlchemy prediction logs model
│   ├── routes.py                # REST API endpoints (/predict, /weather, /ml-health)
│   └── services.py              # ML inference & crop pricing logic
├── .env                         # Local environment variables
├── .gitignore
├── requirements.txt             # Python dependencies
├── run.py                       # Local development server runner
└── vercel.json                  # Vercel deployment configuration
```
## ⚙️ Local Installation & Setup
#1. Clone the Repository:
   ```
   git clone [https://github.com/your-username/ai-crop-advisor.git](https://github.com/your-username/ai-crop-advisor.git)
   cd ai-crop-advisor
   ```
#2. Create & Activate a Virtual Environment:
   ```
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```
#3. Install Dependencies:
   ```
   pip install -r requirements.txt
   ```
#4. Configure Environment Variables:
   ```
   DATABASE_URL=postgresql+psycopg2://username:password@your-neon-endpoint.neon.tech/dbname?sslmode=require
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   ```
#5. Run the Application Locally:
   ```
   python run.py
   ```
