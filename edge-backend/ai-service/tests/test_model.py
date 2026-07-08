import os
import sys
import tempfile
import time
import unittest
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from model import feature_names, load_or_train_model, _should_retrain


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


if __name__ == '__main__':
    unittest.main()
