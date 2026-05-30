"""
╔══════════════════════════════════════════════════════════════════╗
║         AI-BASED CROP RECOMMENDATION SYSTEM                      ║
║         STEP 3: Flask REST API — Prediction Server               ║
╚══════════════════════════════════════════════════════════════════╝

WHAT THIS FILE DOES:
  - Loads the pre-trained ML model artifacts
  - Exposes REST API endpoints for predictions
  - Returns top-3 crop recommendations with confidence %
  - Validates all input parameters
  - Handles errors gracefully

ARCHITECTURE:
  Frontend (HTML/JS)
        ↕ HTTP Request
  Node.js Backend (server.js) → Port 3000
        ↕ HTTP Request (internal)
  Flask ML API (flask_api.py) → Port 5000    ← THIS FILE
        ↕ loads from disk
  Trained Model (.pkl files)

WHY FLASK OVER FASTAPI?
  → Flask: Simple, mature, huge community, easier to debug
  → FastAPI: Faster, async, auto-docs, better for high traffic
  → For this project: Flask is perfect for demonstration

ENDPOINTS:
  POST /predict          → Get crop recommendations
  GET  /health           → Check if API is running
  GET  /model-info       → Model accuracy and metadata
  GET  /crops            → List all supported crops
  POST /batch-predict    → Predict for multiple soil samples

INSTALLATION:
  pip install flask flask-cors joblib numpy scikit-learn pandas
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import json
import os
from datetime import datetime

# ──────────────────────────────────────────────────────────────────
# FLASK APP INITIALIZATION
# ──────────────────────────────────────────────────────────────────
# CORS (Cross-Origin Resource Sharing):
# Without CORS, your browser will BLOCK requests from frontend (port 3000)
# to this Flask API (port 5000) for security reasons.
# flask-cors adds the required "Access-Control-Allow-Origin" headers.

app = Flask(__name__)
CORS(app)  # Allows all origins — restrict in production: CORS(app, origins=["http://yourdomain.com"])

# ──────────────────────────────────────────────────────────────────
# LOAD MODEL ARTIFACTS AT STARTUP
# ──────────────────────────────────────────────────────────────────
# We load once when Flask starts, not on every request.
# WHY? Loading a .pkl file takes ~100ms. A production API handles
# thousands of requests/minute — loading per request would be catastrophic.
# This pattern is called "model caching" or "warm loading".

MODEL_DIR = 'models'

def load_artifacts():
    """
    Loads model, scaler, and label encoder from disk.
    Called once at app startup.
    
    INTERVIEW: "What if the model file is missing?"
      → We handle it gracefully: the API starts but returns a 503
        on prediction requests, with a clear error message.
    """
    artifacts = {}
    try:
        artifacts['model']   = joblib.load(os.path.join(MODEL_DIR, 'crop_model.pkl'))
        artifacts['scaler']  = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
        artifacts['encoder'] = joblib.load(os.path.join(MODEL_DIR, 'label_encoder.pkl'))
        with open(os.path.join(MODEL_DIR, 'model_metadata.json')) as f:
            artifacts['meta'] = json.load(f)
        artifacts['loaded'] = True
        print(f"✅ Model loaded | Crops: {len(artifacts['encoder'].classes_)} | "
              f"Accuracy: {artifacts['meta']['accuracy']}%")
    except FileNotFoundError as e:
        artifacts['loaded'] = False
        artifacts['error'] = str(e)
        print(f"⚠️  Model not found: {e}")
        print("   Run: python train_model.py  first!")
    return artifacts

# Load on startup
ARTIFACTS = load_artifacts()

# ──────────────────────────────────────────────────────────────────
# VALIDATION HELPERS
# ──────────────────────────────────────────────────────────────────
# Input validation is CRITICAL in ML APIs.
# A soil pH of 15 or rainfall of -100 would produce garbage predictions.
# Always validate before passing to the model.

FEATURE_RANGES = {
    'N':           (0,   140,  'Nitrogen (kg/ha)'),
    'P':           (0,   150,  'Phosphorus (kg/ha)'),
    'K':           (0,   210,  'Potassium (kg/ha)'),
    'temperature': (0,   50,   'Temperature (°C)'),
    'humidity':    (0,   100,  'Humidity (%)'),
    'ph':          (0,   14,   'Soil pH'),
    'rainfall':    (0,   500,  'Rainfall (mm)'),
}


def validate_input(data):
    """
    Validates all 7 input features.
    Returns (features_array, error_string or None)
    
    INTERVIEW: "Why validate on the API side if frontend already validates?"
      → Defense in depth: never trust client input
      → API can be called directly (curl, Postman, other services)
      → Frontend JS can be bypassed; server-side is the last line of defense
    """
    features = []
    errors = []

    for key, (min_val, max_val, label) in FEATURE_RANGES.items():
        val = data.get(key)
        if val is None:
            errors.append(f"Missing field: '{key}' ({label})")
            continue
        try:
            val = float(val)
        except (TypeError, ValueError):
            errors.append(f"Invalid value for '{key}': must be a number")
            continue
        if not (min_val <= val <= max_val):
            errors.append(f"'{key}' ({label}) must be between {min_val} and {max_val}, got {val}")
        else:
            features.append(val)

    if errors:
        return None, errors
    return np.array(features).reshape(1, -1), None


# ──────────────────────────────────────────────────────────────────
# API ENDPOINTS
# ──────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint.
    Used by: load balancers, monitoring tools (Prometheus, Grafana),
             Node.js backend to verify Python service is up before forwarding.
    
    Standard in all production microservices.
    Returns 200 if healthy, 503 if degraded.
    """
    if ARTIFACTS.get('loaded'):
        return jsonify({
            'status': 'healthy',
            'model': 'RandomForestClassifier',
            'accuracy': ARTIFACTS['meta']['accuracy'],
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    else:
        return jsonify({
            'status': 'unhealthy',
            'error': 'Model not loaded. Run train_model.py first.',
            'timestamp': datetime.utcnow().isoformat()
        }), 503


@app.route('/model-info', methods=['GET'])
def model_info():
    """Returns metadata about the trained model."""
    if not ARTIFACTS.get('loaded'):
        return jsonify({'error': 'Model not loaded'}), 503

    return jsonify({
        'model_type':    ARTIFACTS['meta']['model_type'],
        'accuracy':      ARTIFACTS['meta']['accuracy'],
        'n_estimators':  ARTIFACTS['meta']['n_estimators'],
        'feature_names': ARTIFACTS['meta']['feature_names'],
        'crop_classes':  ARTIFACTS['meta']['crop_classes'],
        'total_crops':   len(ARTIFACTS['meta']['crop_classes'])
    })


@app.route('/crops', methods=['GET'])
def list_crops():
    """Lists all crops the model can recommend."""
    if not ARTIFACTS.get('loaded'):
        return jsonify({'error': 'Model not loaded'}), 503

    return jsonify({
        'crops': list(ARTIFACTS['encoder'].classes_),
        'total': len(ARTIFACTS['encoder'].classes_)
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    ★ MAIN PREDICTION ENDPOINT ★

    INPUT (JSON body):
    {
        "N": 90,
        "P": 42,
        "K": 43,
        "temperature": 20.88,
        "humidity": 82.0,
        "ph": 6.5,
        "rainfall": 202.9
    }

    OUTPUT:
    {
        "predictions": [
            {"rank": 1, "crop": "rice",   "confidence": 94.5, "hindi_name": "चावल"},
            {"rank": 2, "crop": "maize",  "confidence": 3.2,  "hindi_name": "मक्का"},
            {"rank": 3, "crop": "jute",   "confidence": 1.8,  "hindi_name": "जूट"}
        ],
        "top_crop": "rice",
        "input_summary": {...}
    }

    INTERVIEW: "How does predict_proba() work?"
      → Each of 200 trees votes for a class
      → predict_proba = votes_for_class / total_trees
      → e.g., 189 trees say "rice" → confidence = 189/200 = 94.5%
    """
    if not ARTIFACTS.get('loaded'):
        return jsonify({'error': 'Model not loaded. Run train_model.py first.'}), 503

    # Parse JSON body
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON body provided'}), 400

    # Validate inputs
    features, errors = validate_input(data)
    if errors:
        return jsonify({'error': 'Validation failed', 'details': errors}), 422

    try:
        # Scale the input using the SAME scaler used during training
        # CRITICAL: Without this, the model receives raw values that it never saw during training
        features_scaled = ARTIFACTS['scaler'].transform(features)

        # Get probabilities for ALL 22 crops
        # Shape: (1, 22) → one prediction, 22 crop probability values
        proba = ARTIFACTS['model'].predict_proba(features_scaled)[0]

        # Get all crops sorted by confidence (highest first)
        all_crops = ARTIFACTS['encoder'].classes_
        ranked = sorted(
            zip(all_crops, proba),
            key=lambda x: x[1],
            reverse=True
        )

        # Build top-3 predictions
        top3 = []
        for rank, (crop, confidence) in enumerate(ranked[:3], start=1):
            top3.append({
                'rank':       rank,
                'crop':       crop,
                'confidence': round(float(confidence) * 100, 2),
                'hindi_name': CROP_HINDI_NAMES.get(crop, crop),
                'season':     CROP_SEASONS.get(crop, 'Year-round'),
                'category':   CROP_CATEGORIES.get(crop, 'Field Crop')
            })

        # Full ranking for the frontend chart
        full_ranking = [
            {'crop': c, 'confidence': round(float(p) * 100, 2)}
            for c, p in ranked
            if p > 0.005  # Only include crops with > 0.5% confidence
        ][:10]  # Top 10

        return jsonify({
            'status':      'success',
            'top_crop':    top3[0]['crop'],
            'predictions': top3,
            'full_ranking': full_ranking,
            'input_summary': {
                'N':           data.get('N'),
                'P':           data.get('P'),
                'K':           data.get('K'),
                'temperature': data.get('temperature'),
                'humidity':    data.get('humidity'),
                'ph':          data.get('ph'),
                'rainfall':    data.get('rainfall')
            },
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500


@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """
    Batch prediction for multiple soil samples (e.g., different fields on a farm).
    Input: {"samples": [{N:90, P:42, ...}, {N:60, P:55, ...}]}
    
    INTERVIEW: "Why have a batch endpoint?"
      → Sending 100 HTTP requests vs 1 batch request: 100x overhead saved
      → Farmers with large farms can test multiple field zones at once
      → More efficient: model processes multiple rows in one forward pass
    """
    if not ARTIFACTS.get('loaded'):
        return jsonify({'error': 'Model not loaded'}), 503

    data = request.get_json()
    samples = data.get('samples', [])

    if not samples:
        return jsonify({'error': 'No samples provided'}), 400
    if len(samples) > 50:
        return jsonify({'error': 'Max 50 samples per batch'}), 400

    results = []
    for i, sample in enumerate(samples):
        features, errors = validate_input(sample)
        if errors:
            results.append({'sample_index': i, 'error': errors})
            continue
        features_scaled = ARTIFACTS['scaler'].transform(features)
        proba = ARTIFACTS['model'].predict_proba(features_scaled)[0]
        top_idx = np.argmax(proba)
        top_crop = ARTIFACTS['encoder'].classes_[top_idx]
        results.append({
            'sample_index': i,
            'top_crop': top_crop,
            'confidence': round(float(proba[top_idx]) * 100, 2),
            'hindi_name': CROP_HINDI_NAMES.get(top_crop, top_crop)
        })

    return jsonify({'status': 'success', 'results': results, 'total': len(results)})


# ──────────────────────────────────────────────────────────────────
# CROP METADATA (Hindi names, seasons, categories)
# ──────────────────────────────────────────────────────────────────

CROP_HINDI_NAMES = {
    'rice': 'चावल', 'maize': 'मक्का', 'chickpea': 'चना',
    'kidneybeans': 'राजमा', 'pigeonpeas': 'अरहर दाल', 'mothbeans': 'मोठ',
    'mungbean': 'मूंग', 'blackgram': 'उड़द दाल', 'lentil': 'मसूर',
    'pomegranate': 'अनार', 'banana': 'केला', 'mango': 'आम',
    'grapes': 'अंगूर', 'watermelon': 'तरबूज', 'muskmelon': 'खरबूज',
    'apple': 'सेब', 'orange': 'संतरा', 'papaya': 'पपीता',
    'coconut': 'नारियल', 'cotton': 'कपास', 'jute': 'जूट', 'coffee': 'कॉफ़ी'
}

CROP_SEASONS = {
    'rice': 'Kharif (Jun-Nov)', 'maize': 'Kharif/Rabi', 'chickpea': 'Rabi (Nov-Apr)',
    'kidneybeans': 'Kharif (Jun-Sep)', 'pigeonpeas': 'Kharif (Jun-Nov)',
    'mothbeans': 'Kharif (Jun-Sep)', 'mungbean': 'Kharif (Jun-Sep)',
    'blackgram': 'Kharif (Jun-Sep)', 'lentil': 'Rabi (Oct-Apr)',
    'pomegranate': 'Year-round', 'banana': 'Year-round', 'mango': 'Summer',
    'grapes': 'Rabi (Jan-Mar)', 'watermelon': 'Zaid (Mar-Jun)',
    'muskmelon': 'Zaid (Mar-Jun)', 'apple': 'Year-round (Himachal)',
    'orange': 'Year-round', 'papaya': 'Year-round', 'coconut': 'Year-round',
    'cotton': 'Kharif (Apr-Oct)', 'jute': 'Kharif (Mar-Aug)', 'coffee': 'Year-round'
}

CROP_CATEGORIES = {
    'rice': 'Cereal', 'maize': 'Cereal', 'chickpea': 'Pulse',
    'kidneybeans': 'Pulse', 'pigeonpeas': 'Pulse', 'mothbeans': 'Pulse',
    'mungbean': 'Pulse', 'blackgram': 'Pulse', 'lentil': 'Pulse',
    'pomegranate': 'Fruit', 'banana': 'Fruit', 'mango': 'Fruit',
    'grapes': 'Fruit', 'watermelon': 'Fruit', 'muskmelon': 'Fruit',
    'apple': 'Fruit', 'orange': 'Fruit', 'papaya': 'Fruit',
    'coconut': 'Plantation', 'cotton': 'Cash Crop', 'jute': 'Fiber Crop',
    'coffee': 'Plantation'
}


# ──────────────────────────────────────────────────────────────────
# ERROR HANDLERS
# ──────────────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found', 'available': [
        'GET /health', 'GET /model-info', 'GET /crops',
        'POST /predict', 'POST /batch-predict'
    ]}), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': f'Method not allowed: {request.method}'}), 405


# ──────────────────────────────────────────────────────────────────
# STARTUP
# ──────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("\n╔══════════════════════════════════════════╗")
    print("║  🌾 CROP RECOMMENDATION FLASK API         ║")
    print("║  http://localhost:5000                    ║")
    print("╚══════════════════════════════════════════╝\n")
    # debug=True: Auto-reloads on code changes (dev only!)
    # host='0.0.0.0': Listens on all interfaces (not just localhost)
    app.run(debug=True, host='0.0.0.0', port=5000)
