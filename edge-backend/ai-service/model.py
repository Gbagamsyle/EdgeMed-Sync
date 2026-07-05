import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier

# Define expected vitals features
feature_names = ['heart_rate', 'systolic_bp', 'diastolic_bp', 'spo2', 'temperature', 'resp_rate']
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'disease_model.joblib')


def _generate_synthetic_training_data():
    rng = np.random.default_rng(42)
    features = []
    labels = []

    for _ in range(220):
        heart_rate = float(rng.uniform(60, 130))
        systolic_bp = float(rng.uniform(90, 180))
        diastolic_bp = float(rng.uniform(60, 110))
        spo2 = float(rng.uniform(88, 99))
        temperature = float(rng.uniform(35.5, 40.5))
        resp_rate = float(rng.uniform(12, 30))

        score_a = int(heart_rate > 100) + int(temperature > 38.0)
        score_b = int(systolic_bp > 140) + int(diastolic_bp > 90)
        score_c = int(spo2 < 94) + int(resp_rate > 20)

        if score_a >= max(score_b, score_c) and score_a > 0:
            label = 'diseaseA'
        elif score_b >= max(score_a, score_c) and score_b > 0:
            label = 'diseaseB'
        else:
            label = 'diseaseC'

        features.append([heart_rate, systolic_bp, diastolic_bp, spo2, temperature, resp_rate])
        labels.append(label)

    return np.array(features, dtype=float), np.array(labels)


def train_model():
    X, y = _generate_synthetic_training_data()
    model = RandomForestClassifier(
        n_estimators=120,
        max_depth=4,
        random_state=42,
        class_weight='balanced',
    )
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    return model


def load_or_train_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)

    return train_model()
