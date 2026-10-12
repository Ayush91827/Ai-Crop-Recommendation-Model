import os
import joblib
import pandas as pd
from flask import current_app

class CropPredictionService:
    def __init__(self):
        self.model=None
        self.scaler=None
        self.label_encoder=None
        self._load_artifacts()

    def _load_artifacts(self):
        """Loads the serialized model, scaler, and label encoder into memory safely."""
        try:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            model_dir = os.path.join(base_dir, 'ml_models')

            self.model = joblib.load(os.path.join(model_dir, 'crop_model.pkl'))
            self.scaler = joblib.load(os.path.join(model_dir, 'scaler.pkl'))
            self.label_encoder = joblib.load(os.path.join(model_dir, 'label_encoder.pkl'))

            current_app.logger.info("Machine learning artifacts loaded successfully.")
        except Exception as e:
            current_app.logger.error(f"Error loading ML artifacts: {str(e)}")
            raise e

    def predict(self, n, p, k, temperature, humidity, ph, rainfall):
        """Processes input parameters, scales them, and returns the recommended crop name."""
        try:
            input_data = pd.DataFrame([[n, p, k, temperature, humidity, ph, rainfall]],
                                      columns=['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'])
            scaled_data = self.scaler.transform(input_data)
            prediction_encoded = self.model.predict(scaled_data)
            if self.label_encoder:
                prediction = self.label_encoder.inverse_transform(prediction_encoded)
                return str(prediction[0])
            return str(prediction_encoded[0])
        except Exception as e:
            raise ValueError(f"Inference error: {str(e)}")

    def get_crop_details(self, crop_name):
        crop_db = {
            'rice': {
                'category': 'Cereal', 'season': 'Kharif', 'water_requirement': 'High', 'crop_duration': '120-150 days', 'expected_profit': '₹45,000/ha',
                'msp': '₹2,183/qtl', 'market_low': '₹2,100', 'market_high': '₹2,400', 'trend': 'rising', 'trend_pct': '3.5'
            },
            'maize': {
                'category': 'Cereal', 'season': 'Kharif / Rabi', 'water_requirement': 'Medium', 'crop_duration': '90-100 days', 'expected_profit': '₹32,000/ha',
                'msp': '₹2,090/qtl', 'market_low': '₹2,000', 'market_high': '₹2,250', 'trend': 'stable', 'trend_pct': '1.2'
            },
            'chickpea': {
                'category': 'Pulse', 'season': 'Rabi', 'water_requirement': 'Low', 'crop_duration': '100-110 days', 'expected_profit': '₹50,000/ha',
                'msp': '₹5,440/qtl', 'market_low': '₹5,300', 'market_high': '₹5,800', 'trend': 'rising', 'trend_pct': '4.8'
            },
            'kidneybeans': {
                'category': 'Pulse', 'season': 'Kharif', 'water_requirement': 'Medium', 'crop_duration': '120 days', 'expected_profit': '₹48,000/ha',
                'msp': '₹6,000/qtl', 'market_low': '₹5,800', 'market_high': '₹6,400', 'trend': 'rising', 'trend_pct': '3.0'
            },
            'pigeonpeas': {
                'category': 'Pulse', 'season': 'Kharif', 'water_requirement': 'Low', 'crop_duration': '150-180 days', 'expected_profit': '₹55,000/ha',
                'msp': '₹7,000/qtl', 'market_low': '₹6,800', 'market_high': '₹7,500', 'trend': 'rising', 'trend_pct': '5.0'
            },
            'cotton': {
                'category': 'Cash Crop', 'season': 'Kharif', 'water_requirement': 'Medium', 'crop_duration': '150-180 days', 'expected_profit': '₹65,000/ha',
                'msp': '₹6,620/qtl', 'market_low': '₹6,400', 'market_high': '₹7,200', 'trend': 'rising', 'trend_pct': '5.2'
            },
            'banana': {
                'category': 'Fruit', 'season': 'Year-round', 'water_requirement': 'High', 'crop_duration': '12-14 months', 'expected_profit': '₹1,20,000/ha',
                'msp': 'Not Applicable', 'market_low': '₹1,500', 'market_high': '₹2,200', 'trend': 'stable', 'trend_pct': '2.0'
            },
            'mango': {
                'category': 'Fruit', 'season': 'Summer', 'water_requirement': 'Medium', 'crop_duration': 'Perennial', 'expected_profit': '₹1,50,000/ha',
                'msp': 'Not Applicable', 'market_low': '₹4,000', 'market_high': '₹7,000', 'trend': 'rising', 'trend_pct': '6.1'
            },
            'coffee': {
                'category': 'Plantation', 'season': 'Monsoon', 'water_requirement': 'High', 'crop_duration': 'Perennial', 'expected_profit': '₹1,80,000/ha',
                'msp': 'Not Applicable', 'market_low': '₹18,000', 'market_high': '₹25,000', 'trend': 'rising', 'trend_pct': '7.5'
            },
            'coconut': {
                'category': 'Plantation', 'season': 'Year-round', 'water_requirement': 'High', 'crop_duration': 'Perennial', 'expected_profit': '₹90,000/ha',
                'msp': 'Not Applicable', 'market_low': '₹2,500', 'market_high': '₹3,200', 'trend': 'stable', 'trend_pct': '1.0'
            }
        }
        
        default_details = {
            'category': 'Crop', 'season': 'Seasonal', 'water_requirement': 'Medium', 'crop_duration': '110 days', 'expected_profit': '₹40,000/ha',
            'msp': '₹3,000/qtl', 'market_low': '₹2,800', 'market_high': '₹3,300', 'trend': 'stable', 'trend_pct': '1.5'
        }
        
        details = crop_db.get(crop_name.lower(), default_details.copy())
        details['is_live'] = False
        details['source'] = 'Estimated Market Data'
        details['source_date'] = '2026 Season'
        
        return details

crop_service = CropPredictionService()