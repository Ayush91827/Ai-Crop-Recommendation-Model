# 🌱 AI Crop Advisor & Smart Recommendation System

A modern, full-stack web application powered by **Machine Learning (Random Forest)**, **Flask**, and **PostgreSQL** that provides accurate crop recommendations based on soil NPK levels, climatic parameters (temperature, humidity, pH, rainfall), and real-time geolocated weather data. It features full bilingual support (**English & Hindi**), interactive map integration, and estimated market pricing/MSP data.

---

## ✨ Key Features

- **🤖 Machine Learning Inference**: Uses a pre-trained `scikit-learn` Random Forest model (`joblib`), StandardScaler, and LabelEncoder to predict the optimal crop with high confidence ($\sim 98.75\%$).
- **🌤️ Integrated Live Weather**: Fetches real-time temperature, humidity, and rainfall via the **OpenWeatherMap API** combined with **Nominatim OpenStreetMap** reverse geocoding.
- **🗺️ Interactive Map & GPS Support**: Users can either auto-locate via browser GPS or drop an interactive pin on Leaflet maps.
- **🌐 Full Bilingual Support**: Instant toggle between English and Hindi across the entire user interface.
- **💰 Market Estimates & MSP**: Displays estimated market prices, minimum support prices (MSP), profit margins, and seasonal crop details.
- **📊 Database Logging**: Logs every prediction query securely using SQLAlchemy and PostgreSQL.

---

## 📂 Project Architecture

```tree
Ai Crop Advisor/
│
├── app/
│   ├── ml_models/
│   │   ├── crop_model.pkl
│   │   ├── label_encoder.pkl
│   │   └── scaler.pkl
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── main.js
│   │       ├── map.js
│   │       └── translations.js
│   ├── templates/
│   │   └── index.html
│   ├── __init__.py
│   ├── models.py
│   ├── routes.py
│   └── services.py
│
├── .env
├── .gitignore
├── requirements.txt
├── run.py
└── vercel.json
```

---

## 🔬 Tech Stack

- **Backend**: Python 3.10+, Flask, Flask-SQLAlchemy, Gunicorn
- **Database**: PostgreSQL (Neon DB)
- **Machine Learning**: Scikit-learn, Pandas, Joblib
- **APIs**: OpenWeatherMap API, OpenStreetMap Nominatim API
- **Frontend**: HTML5, Modern CSS3, JavaScript (ES6+), Leaflet.js

---

## ⚙️ Prerequisites & Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
DATABASE_URL=postgresql://username:password@your-database-endpoint.tech/dbname?sslmode=require
OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

---

## 🚀 Installation & Local Setup

1. **Clone the Repository & Navigate into the folder**:
   ```bash
   git clone https://github.com/your-username/ai-crop-advisor.git
   cd ai-crop-advisor
   ```

2. **Create and Activate a Virtual Environment**:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Application**:
   ```bash
   python run.py
   ```

5. **Open in Browser**:
   Navigate to `http://127.0.0.1:5000`

---

## 🌐 Deployment (Vercel)

This project is configured for serverless deployment on Vercel using `vercel.json` and `wsgi/gunicorn` entrypoints. Ensure your environment variables (`DATABASE_URL` and `OPENWEATHER_API_KEY`) are properly configured in your Vercel Project Settings.

---

## 📋 License

This project is open-source and available under the [MIT License](LICENSE).