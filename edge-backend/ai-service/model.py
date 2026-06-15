# Lightweight rule-based model to avoid heavy ML dependencies
import numpy as np
# Define expected vitals features
feature_names = ['heart_rate','systolic_bp','diastolic_bp','spo2','temperature','resp_rate']


class RuleModel:
    def __init__(self):
        # human-readable labels
        self.classes_ = np.array(['diseaseA', 'diseaseB', 'diseaseC'])

    def predict_proba(self, X):
        # X: array-like shape (n_samples, n_features)
        probs = []
        for row in X:
            hr, sbp, dbp, spo2, temp, rr = [float(v) for v in row]
            scores = np.array([0.0, 0.0, 0.0])
            # diseaseA: tachy + fever
            scores[0] += (hr > 100) * 1.5
            scores[0] += (temp > 38.0) * 1.5
            # diseaseB: hypertensive pattern
            scores[1] += (sbp > 140) * 1.2
            scores[1] += (dbp > 90) * 1.0
            # diseaseC: respiratory compromise
            scores[2] += (spo2 < 94) * 1.5
            scores[2] += (rr > 20) * 1.2

            if scores.sum() == 0:
                probs.append(np.array([0.33, 0.33, 0.34]))
            else:
                probs.append(scores / scores.sum())

        return np.vstack(probs)


def load_or_train_model():
    # return a simple rule-based model instance
    return RuleModel()
