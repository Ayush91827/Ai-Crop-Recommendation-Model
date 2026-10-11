import os
import requests
from flask import Blueprint, render_template, request, jsonify
from app.models import db, CropPredictionLog
from app.services import crop_service

main_bp = Blueprint('main', __name__)
@main_bp.route('/')
def index():
    """Renders the main crop recommendation web interface."""
    return render_template('index.html')

@main_bp.route('/get-weather', methods=['GET'])
def get_weather():
    """Secure backend proxy for OpenWeatherMap API to prevent key leakage."""
    try:
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        
        if not lat or not lon:
            return jsonify({'success': False, 'error': 'Latitude and longitude are required'}), 400

        api_key = os.getenv('OPENWEATHERMAP_API_KEY')
        if not api_key:
            return jsonify({'success': False, 'error': 'Weather API key not configured on server'}), 500
        
        owm_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={api_key}"
        response = requests.get(owm_url)
        data = response.json()

        if response.status_code == 200:
            return jsonify({
                'success': True,
                'temperature': data['main']['temp'],
                'humidity': data['main']['humidity']
            })
        else:
            return jsonify({'success': False, 'error': data.get('message', 'Failed to fetch weather')}), 400

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@main_bp.route('/predict', methods=['POST'])
def predict():
    """Handles prediction requests, executes ML inference, and logs to Neon DB."""
    try:
        data = request.form if request.form else request.json

        n = float(data.get('n'))
        p = float(data.get('p'))
        k = float(data.get('k'))
        temperature = float(data.get('temperature'))
        humidity = float(data.get('humidity'))
        ph = float(data.get('ph'))
        rainfall = float(data.get('rainfall'))

        predicted_crop = crop_service.predict(n, p, k, temperature, humidity, ph, rainfall)

        log_entry = CropPredictionLog(
            n=n, p=p, k=k,
            temperature=temperature,
            humidity=humidity,
            ph=ph,
            rainfall=rainfall,
            predicted_crop=predicted_crop
        )
        db.session.add(log_entry)
        db.session.commit()

        return jsonify({
            'success': True,
            'predicted_crop': predicted_crop
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
