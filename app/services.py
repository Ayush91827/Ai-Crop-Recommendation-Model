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

crop_service = CropPredictionService()