"""
╔══════════════════════════════════════════════════════════════════╗
║         AI-BASED CROP RECOMMENDATION SYSTEM                      ║
║         STEP 2: Machine Learning Model Training                   ║
╚══════════════════════════════════════════════════════════════════╝

WHAT THIS FILE DOES:
  - Loads the crop recommendation dataset (7 soil/climate features)
  - Preprocesses data (encoding, scaling)
  - Trains a Random Forest Classifier (best for tabular agricultural data)
  - Evaluates the model (accuracy, precision, recall)
  - Saves the trained model, scaler, and label encoder to disk

INTERVIEW TIP: When asked "Why Random Forest?"
  → It's an ensemble of 200 decision trees that vote on the answer
  → Very resistant to overfitting compared to a single decision tree
  → Handles non-linear relationships (rainfall vs crop) naturally
  → Gives feature importance (which soil factor matters most)
  → Achieves ~97-99% accuracy on this crop dataset

DATASET FEATURES (Input X):
  N           → Nitrogen content in soil (kg/ha) - Essential for leaf growth
  P           → Phosphorus content (kg/ha) - Root development & flowering
  K           → Potassium content (kg/ha) - Disease resistance & fruit quality
  temperature → Celsius - Different crops need different temperature ranges
  humidity    → Relative humidity (%) - Affects transpiration and disease
  ph          → Soil acidity/alkalinity (0-14, 7 is neutral)
  rainfall    → Annual rainfall (mm) - Most critical water requirement factor

TARGET (Output y):
  22 crops: rice, maize, chickpea, kidneybeans, pigeonpeas, mothbeans,
            mungbean, blackgram, lentil, pomegranate, banana, mango,
            grapes, watermelon, muskmelon, apple, orange, papaya,
            coconut, cotton, jute, coffee

INSTALLATION:
  pip install pandas numpy scikit-learn joblib matplotlib seaborn
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend (no GUI needed for training server)
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os
import warnings
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (accuracy_score, classification_report,
                              confusion_matrix, precision_score, recall_score)

warnings.filterwarnings('ignore')

# ──────────────────────────────────────────────────────────────────
# SECTION 1: DATASET CREATION / LOADING
# ──────────────────────────────────────────────────────────────────
# In production: df = pd.read_csv('Crop_recommendation.csv')
# Download from: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
#
# Here we create a representative dataset that mirrors the real distribution.
# Each crop has optimal N, P, K, temperature, humidity, pH, rainfall ranges
# based on Indian Council of Agricultural Research (ICAR) guidelines.

# Crop parameter ranges: [min, max] for each of 7 features
# Order: [N, P, K, temperature, humidity, ph, rainfall]
CROP_PARAMS = {
    # Kharif (Monsoon) Crops
    'rice':        [[60,100], [40,60],   [30,60],   [20,27], [80,90], [5.5,7.0], [200,300]],
    'maize':       [[60,100], [50,70],   [40,60],   [18,27], [65,75], [5.5,7.5], [60,110]],
    'mungbean':    [[20,45],  [40,60],   [15,30],   [25,35], [85,95], [6.0,7.5], [30,80]],
    'blackgram':   [[30,60],  [60,80],   [15,30],   [25,35], [65,75], [5.0,7.0], [50,100]],
    'pigeonpeas':  [[15,35],  [50,80],   [15,30],   [18,27], [40,50], [5.0,7.0], [100,200]],
    'jute':        [[60,80],  [36,50],   [38,50],   [24,30], [80,90], [6.0,7.0], [150,250]],
    'cotton':      [[95,120], [36,50],   [38,50],   [20,30], [75,85], [5.8,8.0], [60,100]],

    # Rabi (Winter) Crops
    'chickpea':    [[20,50],  [60,90],   [60,90],   [18,25], [14,30], [5.5,7.5], [60,100]],
    'kidneybeans': [[15,35],  [60,100],  [15,30],   [18,24], [18,26], [5.5,7.5], [100,150]],
    'mothbeans':   [[20,45],  [40,60],   [15,30],   [24,32], [47,58], [3.5,6.5], [30,60]],
    'lentil':      [[15,35],  [60,90],   [25,50],   [18,24], [64,74], [6.0,7.5], [35,60]],

    # Fruits
    'pomegranate': [[15,25],  [10,18],   [36,50],   [18,24], [88,96], [5.5,7.5], [100,200]],
    'banana':      [[95,110], [68,90],   [44,60],   [25,30], [75,90], [5.5,7.0], [100,200]],
    'mango':       [[0,20],   [15,20],   [30,40],   [24,30], [48,55], [4.5,7.0], [90,200]],
    'grapes':      [[15,25],  [10,18],   [36,50],   [8,20],  [81,90], [5.5,7.5], [60,100]],
    'watermelon':  [[95,110], [8,15],    [44,55],   [24,30], [85,95], [5.5,7.5], [40,100]],
    'muskmelon':   [[95,110], [8,15],    [44,55],   [25,35], [92,98], [6.0,7.5], [20,80]],
    'apple':       [[0,20],   [120,145], [195,210], [20,24], [90,95], [5.5,7.5], [100,200]],
    'orange':      [[15,25],  [10,18],   [6,12],    [10,16], [88,96], [6.0,7.5], [100,200]],
    'papaya':      [[45,65],  [36,50],   [44,55],   [33,38], [90,95], [6.0,7.5], [100,200]],
    'coconut':     [[0,20],   [0,10],    [26,35],   [25,30], [85,95], [5.0,8.0], [100,300]],
    'coffee':      [[95,110], [28,40],   [28,40],   [22,28], [58,70], [5.5,7.0], [150,250]],
}


def create_or_load_dataset(csv_path='Crop_recommendation.csv', samples_per_crop=200):
    """
    Loads real dataset if available, otherwise creates a synthetic one.
    
    INTERVIEW: "What if the dataset has class imbalance?"
      → We use stratify=y in train_test_split to maintain class proportions
      → Or use SMOTE (Synthetic Minority Oversampling Technique)
      → Random Forest handles mild imbalance well with class_weight='balanced'
    """
    if os.path.exists(csv_path):
        print(f"  📂 Loading real dataset from {csv_path}")
        df = pd.read_csv(csv_path)
        return df

    print(f"  🔧 Creating synthetic dataset ({samples_per_crop} samples/crop)...")
    rows = []
    for crop, params in CROP_PARAMS.items():
        for _ in range(samples_per_crop):
            # Add small Gaussian noise (±5% of range) to simulate real variability
            def rnd(lo, hi):
                base = np.random.uniform(lo, hi)
                noise = np.random.normal(0, (hi - lo) * 0.03)
                return np.clip(base + noise, lo * 0.9, hi * 1.1)

            rows.append({
                'N':           round(rnd(*params[0]), 2),
                'P':           round(rnd(*params[1]), 2),
                'K':           round(rnd(*params[2]), 2),
                'temperature': round(rnd(*params[3]), 2),
                'humidity':    round(rnd(*params[4]), 2),
                'ph':          round(rnd(*params[5]), 2),
                'rainfall':    round(rnd(*params[6]), 2),
                'label':       crop
            })

    df = pd.DataFrame(rows)
    df.to_csv('synthetic_crop_data.csv', index=False)
    print(f"  ✅ Dataset saved: synthetic_crop_data.csv ({len(df)} rows)")
    return df


# ──────────────────────────────────────────────────────────────────
# SECTION 2: EXPLORATORY DATA ANALYSIS (EDA)
# ──────────────────────────────────────────────────────────────────

def perform_eda(df):
    """
    Explores the dataset before training.
    
    WHY EDA MATTERS:
    - Detects missing values (would break model training)
    - Checks class balance (imbalanced classes → biased model)
    - Finds outliers (extreme values that distort learning)
    - Understands feature distributions (for choosing scaling method)
    
    INTERVIEW: "What's the difference between StandardScaler and MinMaxScaler?"
      → StandardScaler: z = (x - mean) / std  → Mean 0, std 1 (use when Gaussian)
      → MinMaxScaler:   x = (x - min)/(max - min) → Range [0,1] (use for bounded data)
      → For Random Forest, scaling doesn't affect predictions but helps convergence
    """
    print("\n📊 EXPLORATORY DATA ANALYSIS")
    print("─" * 40)
    print(f"  Shape: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"  Missing values: {df.isnull().sum().sum()}")
    print(f"\n  Crops ({df['label'].nunique()} classes):")
    print(df['label'].value_counts().to_string())
    print(f"\n  Feature Statistics:")
    print(df.drop('label', axis=1).describe().round(2).to_string())

    # Save correlation heatmap
    os.makedirs('plots', exist_ok=True)
    plt.figure(figsize=(10, 8))
    numeric_df = df.drop('label', axis=1)
    corr_matrix = numeric_df.corr()
    sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='YlGn',
                square=True, linewidths=0.5)
    plt.title('Feature Correlation Matrix\n(Higher = More Related)', pad=15)
    plt.tight_layout()
    plt.savefig('plots/feature_correlation.png', dpi=120, bbox_inches='tight')
    plt.close()
    print("\n  📈 Correlation heatmap saved to plots/feature_correlation.png")


# ──────────────────────────────────────────────────────────────────
# SECTION 3: DATA PREPROCESSING
# ──────────────────────────────────────────────────────────────────

def preprocess(df):
    """
    Transforms raw data into model-ready format.
    
    Steps:
    1. Separate X (features) from y (target)
    2. Encode y: string labels → integers (rice→0, maize→1 ...)
    3. Scale X: StandardScaler makes all features comparable
    4. Split: 80% train, 20% test (stratified by crop class)
    
    INTERVIEW: "What is label encoding vs one-hot encoding?"
      → Label encoding: cat=0, dog=1, bird=2 — works for ordinal or tree models
      → One-hot: cat=[1,0,0], dog=[0,1,0] — needed for linear models (no false ordering)
      → Random Forest works fine with label encoding for target variable
    """
    FEATURE_COLS = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

    X = df[FEATURE_COLS].values
    y_raw = df['label'].values

    # Encode crop names → integers
    le = LabelEncoder()
    y = le.fit_transform(y_raw)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train-test split with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y,
        test_size=0.20,    # 20% held out for evaluation
        random_state=42,   # Same random state = reproducible results
        stratify=y         # Each class is proportionally represented in both sets
    )

    print(f"\n🔧 PREPROCESSING COMPLETE")
    print(f"   Train: {X_train.shape[0]} samples")
    print(f"   Test:  {X_test.shape[0]} samples")
    print(f"   Features: {len(FEATURE_COLS)}")
    print(f"   Classes: {len(le.classes_)}")

    return X_train, X_test, y_train, y_test, le, scaler, FEATURE_COLS


# ──────────────────────────────────────────────────────────────────
# SECTION 4: MODEL TRAINING
# ──────────────────────────────────────────────────────────────────

def train_random_forest(X_train, y_train, X_test, y_test, le):
    """
    Trains Random Forest with optimized hyperparameters.
    
    RANDOM FOREST ALGORITHM:
    1. Bootstrap sampling: create N random subsets of training data
    2. Build a Decision Tree on each subset using random feature subsets
    3. For prediction: all trees vote, majority wins (classification)
    
    HYPERPARAMETER TUNING:
    In production, use GridSearchCV or RandomizedSearchCV:
      param_grid = {
          'n_estimators': [100, 200, 300],
          'max_depth': [None, 10, 20],
          'min_samples_split': [2, 5, 10]
      }
      cv = GridSearchCV(RandomForestClassifier(), param_grid, cv=5)
    
    INTERVIEW: "How do you prevent overfitting in Random Forest?"
      → max_depth: limits tree depth (prevents memorizing training data)
      → min_samples_split: needs enough data to create a split
      → max_features: each tree uses only sqrt(n_features) features
      → Cross-validation: tests on unseen data during tuning
    """
    print("\n🤖 TRAINING RANDOM FOREST CLASSIFIER")
    print("   (200 trees × 7 features × 22 crops)")

    rf = RandomForestClassifier(
        n_estimators=200,      # More trees = more stable, but slower
        max_depth=15,          # Prevents deep overfitting
        min_samples_split=5,   # Need ≥5 samples to create a branch
        min_samples_leaf=2,    # Each leaf must have ≥2 training samples
        max_features='sqrt',   # Each tree uses sqrt(7) ≈ 3 features (reduces correlation between trees)
        bootstrap=True,        # Each tree trained on a bootstrap sample
        class_weight='balanced',  # Auto-adjusts for class imbalance
        random_state=42,
        n_jobs=-1              # Parallel training using all CPU cores
    )

    rf.fit(X_train, y_train)

    # ── 5-Fold Cross Validation ──────────────────────────────────
    # Trains on 4 folds, tests on 1, repeats 5 times
    # Gives a more reliable accuracy estimate than a single split
    cv_scores = cross_val_score(rf, X_train, y_train, cv=5, scoring='accuracy')
    print(f"\n   Cross-validation (5-fold): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    return rf


# ──────────────────────────────────────────────────────────────────
# SECTION 5: MODEL EVALUATION
# ──────────────────────────────────────────────────────────────────

def evaluate_model(model, X_test, y_test, le, feature_names):
    """
    Comprehensive evaluation with multiple metrics.
    
    METRICS EXPLAINED:
    ┌─────────────────────────────────────────────────────────────┐
    │ Accuracy:   Overall % of correct predictions                │
    │ Precision:  Of all "rice" predictions, how many were rice?  │
    │ Recall:     Of all actual rice, how many did we find?       │
    │ F1-Score:   Harmonic mean of precision & recall             │
    │ Confusion Matrix: Grid showing actual vs predicted          │
    └─────────────────────────────────────────────────────────────┘
    
    INTERVIEW: "Which metric matters most for crop recommendation?"
      → F1-score, because both false positives (wrong crop suggested)
        AND false negatives (missing the right crop) harm farmers.
      → If soil is perfect for rice but model says cotton → revenue loss
    """
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    print(f"\n{'═' * 50}")
    print(f"  📊 MODEL EVALUATION RESULTS")
    print(f"{'═' * 50}")
    print(f"  ✅ Test Accuracy:  {acc * 100:.2f}%")
    print(f"  ✅ Avg Precision:  {precision_score(y_test, y_pred, average='weighted') * 100:.2f}%")
    print(f"  ✅ Avg Recall:     {recall_score(y_test, y_pred, average='weighted') * 100:.2f}%")
    print(f"\n  Detailed Report per Crop:")
    print(classification_report(y_test, y_pred, target_names=le.classes_, digits=3))

    # Feature importance bar chart
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    print("  📌 Feature Importances (most → least impactful):")
    for i in indices:
        bar = '▓' * int(importances[i] * 40)
        print(f"     {feature_names[i]:<12} {importances[i]:.4f}  {bar}")

    # Save confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(18, 14))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Greens',
                xticklabels=le.classes_, yticklabels=le.classes_,
                linewidths=0.5, linecolor='white')
    plt.title('Confusion Matrix — Random Forest Crop Prediction', fontsize=14, pad=15)
    plt.xlabel('Predicted Crop', fontsize=12)
    plt.ylabel('Actual Crop', fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig('plots/confusion_matrix.png', dpi=120, bbox_inches='tight')
    plt.close()
    print("\n  📈 Confusion matrix saved to plots/confusion_matrix.png")

    return acc


# ──────────────────────────────────────────────────────────────────
# SECTION 6: SAVE MODEL ARTIFACTS
# ──────────────────────────────────────────────────────────────────

def save_artifacts(model, scaler, le, feature_names, accuracy):
    """
    Saves all model artifacts needed for serving predictions.
    
    WHY THREE FILES?
    1. crop_model.pkl  → The trained RandomForest (the "brain")
    2. scaler.pkl      → Must apply SAME scaling to new inputs as training data
                         (If training used mean=50, std=20, predictions must too)
    3. label_encoder.pkl → Converts prediction integer (0) → crop name ("rice")
    
    INTERVIEW: "Why not just use pickle instead of joblib?"
      → joblib is 10-100x faster for large numpy arrays (which sklearn models use)
      → joblib has built-in compression (smaller files)
      → Both are fine for smaller models; joblib is industry standard for sklearn
    """
    os.makedirs('models', exist_ok=True)

    joblib.dump(model, 'models/crop_model.pkl', compress=3)
    joblib.dump(scaler, 'models/scaler.pkl')
    joblib.dump(le, 'models/label_encoder.pkl')

    # Save metadata JSON for the Flask API to read
    import json
    meta = {
        'accuracy': round(accuracy * 100, 2),
        'feature_names': feature_names,
        'crop_classes': list(le.classes_),
        'n_estimators': model.n_estimators,
        'model_type': 'RandomForestClassifier'
    }
    with open('models/model_metadata.json', 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"\n💾 ARTIFACTS SAVED")
    print(f"   models/crop_model.pkl      ({os.path.getsize('models/crop_model.pkl') // 1024} KB)")
    print(f"   models/scaler.pkl")
    print(f"   models/label_encoder.pkl")
    print(f"   models/model_metadata.json")


# ──────────────────────────────────────────────────────────────────
# MAIN ENTRY POINT
# ──────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("╔══════════════════════════════════════════╗")
    print("║  🌾 CROP RECOMMENDATION — MODEL TRAINING  ║")
    print("╚══════════════════════════════════════════╝\n")

    # 1. Load / create data
    print("STEP 1: Loading Dataset")
    df = create_or_load_dataset('Crop_recommendation.csv')

    # 2. EDA
    print("\nSTEP 2: Exploratory Data Analysis")
    perform_eda(df)

    # 3. Preprocess
    print("\nSTEP 3: Preprocessing")
    X_train, X_test, y_train, y_test, le, scaler, feature_names = preprocess(df)

    # 4. Train
    print("\nSTEP 4: Training")
    model = train_random_forest(X_train, y_train, X_test, y_test, le)

    # 5. Evaluate
    print("\nSTEP 5: Evaluation")
    accuracy = evaluate_model(model, X_test, y_test, le, feature_names)

    # 6. Save
    print("\nSTEP 6: Saving Artifacts")
    save_artifacts(model, scaler, le, feature_names, accuracy)

    print(f"\n{'═' * 50}")
    print(f"  ✅ TRAINING COMPLETE! Accuracy: {accuracy * 100:.2f}%")
    print(f"  ▶  Next: Run  python flask_api.py  to start the API")
    print(f"{'═' * 50}\n")
