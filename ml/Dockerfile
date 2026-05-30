FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
RUN python train_model.py
EXPOSE 7860
CMD ["gunicorn", "flask_api:app", "--bind", "0.0.0.0:7860", "--workers", "2"]