import os
import sys
import tempfile
import time
import unittest
from pathlib import Path

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from model import feature_names, load_or_train_model, _should_retrain, predict


class RandomForestModelTests(unittest.TestCase):
    def test_model_trains_and_predicts(self):
        model = load_or_train_model()

        self.assertTrue(hasattr(model, 'feature_importances_'))
        self.assertEqual(len(feature_names), 6)

        probs = model.predict_proba([[95, 140, 90, 96, 37.5, 18]])[0]
        self.assertEqual(len(probs), len(model.classes_))
        self.assertAlmostEqual(probs.sum(), 1.0, places=6)

    def test_should_retrain_when_dataset_is_newer(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            model_path = Path(temp_dir) / 'model.joblib'
            encoder_path = Path(temp_dir) / 'encoder.joblib'
            dataset_path = Path(temp_dir) / 'dataset.csv'

            model_path.touch()
            encoder_path.touch()
            dataset_path.write_text('heart_rate,systolic_bp,diagnosis\n90,120,Normal\n', encoding='utf-8')

            old_time = time.time() - 30
            os.utime(model_path, (old_time, old_time))
            os.utime(encoder_path, (old_time, old_time))

            self.assertTrue(_should_retrain(model_path, encoder_path, dataset_path))

    def test_predict_returns_fallback_for_invalid_input(self):
        result = predict({'heart_rate': 'not-a-number', 'systolic_bp': 120, 'diastolic_bp': 80, 'spo2': 97, 'temperature': 37.0, 'resp_rate': 16})

        self.assertIn('label', result)
        self.assertIn('confidence', result)
        self.assertIn('probabilities', result)
        self.assertIn('severity', result)
        self.assertIn('guidance', result)

    def test_train_from_excel_dataset(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            dataset_path = Path(temp_dir) / 'HYBRID DATASET.xlsx'
            rows = [
                {'heart_rate': 87.3, 'systolic_bp': 158.7, 'diastolic_bp': 109.8, 'spo2': 95.1, 'temperature': 36.5, 'resp_rate': 14.1, 'diagnosis': 'Hypertensive'},
                {'heart_rate': 82.0, 'systolic_bp': 170.5, 'diastolic_bp': 103.1, 'spo2': 94.8, 'temperature': 36.7, 'resp_rate': 13.4, 'diagnosis': 'Hypertensive'},
                {'heart_rate': 81.2, 'systolic_bp': 165.2, 'diastolic_bp': 102.3, 'spo2': 95.0, 'temperature': 36.6, 'resp_rate': 12.9, 'diagnosis': 'Hypertensive'},
                {'heart_rate': 83.5, 'systolic_bp': 168.0, 'diastolic_bp': 104.0, 'spo2': 94.9, 'temperature': 36.8, 'resp_rate': 14.0, 'diagnosis': 'Hypertensive'},
                {'heart_rate': 85.1, 'systolic_bp': 169.3, 'diastolic_bp': 105.2, 'spo2': 95.2, 'temperature': 36.9, 'resp_rate': 13.9, 'diagnosis': 'Hypertensive'},
                {'heart_rate': 117.1, 'systolic_bp': 129.6, 'diastolic_bp': 90.0, 'spo2': 96.2, 'temperature': 39.4, 'resp_rate': 18.2, 'diagnosis': 'Febrile_Tachycardic'},
                {'heart_rate': 124.4, 'systolic_bp': 134.0, 'diastolic_bp': 87.2, 'spo2': 95.6, 'temperature': 38.9, 'resp_rate': 19.9, 'diagnosis': 'Febrile_Tachycardic'},
                {'heart_rate': 119.6, 'systolic_bp': 132.5, 'diastolic_bp': 91.1, 'spo2': 96.0, 'temperature': 39.1, 'resp_rate': 18.6, 'diagnosis': 'Febrile_Tachycardic'},
                {'heart_rate': 123.3, 'systolic_bp': 130.8, 'diastolic_bp': 88.7, 'spo2': 95.8, 'temperature': 39.5, 'resp_rate': 19.4, 'diagnosis': 'Febrile_Tachycardic'},
                {'heart_rate': 126.0, 'systolic_bp': 136.4, 'diastolic_bp': 89.5, 'spo2': 95.7, 'temperature': 38.8, 'resp_rate': 20.7, 'diagnosis': 'Febrile_Tachycardic'},
                {'heart_rate': 92.0, 'systolic_bp': 118.0, 'diastolic_bp': 74.0, 'spo2': 88.0, 'temperature': 37.2, 'resp_rate': 23.4, 'diagnosis': 'Respiratory_Compromise'},
                {'heart_rate': 95.5, 'systolic_bp': 120.3, 'diastolic_bp': 73.1, 'spo2': 86.8, 'temperature': 37.7, 'resp_rate': 24.5, 'diagnosis': 'Respiratory_Compromise'},
                {'heart_rate': 90.4, 'systolic_bp': 116.9, 'diastolic_bp': 75.6, 'spo2': 87.7, 'temperature': 37.1, 'resp_rate': 22.8, 'diagnosis': 'Respiratory_Compromise'},
                {'heart_rate': 94.1, 'systolic_bp': 119.5, 'diastolic_bp': 72.8, 'spo2': 87.2, 'temperature': 37.8, 'resp_rate': 25.1, 'diagnosis': 'Respiratory_Compromise'},
                {'heart_rate': 96.3, 'systolic_bp': 121.8, 'diastolic_bp': 74.4, 'spo2': 88.5, 'temperature': 38.0, 'resp_rate': 24.9, 'diagnosis': 'Respiratory_Compromise'},
                {'heart_rate': 72.0, 'systolic_bp': 115.0, 'diastolic_bp': 76.0, 'spo2': 98.0, 'temperature': 36.8, 'resp_rate': 16.0, 'diagnosis': 'Normal'},
                {'heart_rate': 74.6, 'systolic_bp': 118.8, 'diastolic_bp': 79.1, 'spo2': 97.7, 'temperature': 36.9, 'resp_rate': 15.8, 'diagnosis': 'Normal'},
                {'heart_rate': 71.2, 'systolic_bp': 114.0, 'diastolic_bp': 77.3, 'spo2': 98.1, 'temperature': 36.7, 'resp_rate': 15.1, 'diagnosis': 'Normal'},
                {'heart_rate': 73.8, 'systolic_bp': 116.5, 'diastolic_bp': 78.0, 'spo2': 97.9, 'temperature': 36.8, 'resp_rate': 15.3, 'diagnosis': 'Normal'},
                {'heart_rate': 75.9, 'systolic_bp': 119.1, 'diastolic_bp': 79.7, 'spo2': 97.8, 'temperature': 36.9, 'resp_rate': 16.2, 'diagnosis': 'Normal'},
            ]
            df = pd.DataFrame(rows)
            df.to_excel(dataset_path, index=False)

            model = load_or_train_model()
            self.assertIsNotNone(model)

            from model import _train_from_csv
            clf, le = _train_from_csv(str(dataset_path))
            self.assertIsNotNone(clf)
            self.assertIsNotNone(le)
            self.assertEqual(len(le.classes_), 4)


if __name__ == '__main__':
    unittest.main()
