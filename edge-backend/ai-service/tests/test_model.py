import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from model import feature_names, load_or_train_model


class RandomForestModelTests(unittest.TestCase):
    def test_model_trains_and_predicts(self):
        model = load_or_train_model()

        self.assertTrue(hasattr(model, 'feature_importances_'))
        self.assertEqual(len(feature_names), 6)

        probs = model.predict_proba([[95, 140, 90, 96, 37.5, 18]])[0]
        self.assertEqual(len(probs), len(model.classes_))
        self.assertAlmostEqual(probs.sum(), 1.0, places=6)


if __name__ == '__main__':
    unittest.main()
