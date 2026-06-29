from flask import Flask, request, jsonify
from model import load_or_train_model, feature_names
from signing import signing_bp
import numpy as np

app = Flask(__name__)
model = load_or_train_model()

# Register signing blueprint
app.register_blueprint(signing_bp, url_prefix='/signing')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'services': ['predict', 'signing']})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        body = request.get_json(force=True)
        vitals = body.get('vitals') if isinstance(body, dict) else None

        # Expect vitals as dict with feature keys or as array matching feature_names
        if vitals is None:
            return jsonify({'error': 'vitals required'}), 400

        if isinstance(vitals, dict):
            x = [float(vitals.get(f, 0)) for f in feature_names]
        elif isinstance(vitals, list):
            x = [float(v) for v in vitals]
        else:
            return jsonify({'error': 'vitals must be dict or list'}), 400

        X = np.array(x).reshape(1, -1)
        probs = model.predict_proba(X)[0]
        idx = int(np.argmax(probs))
        label = model.classes_[idx]
        confidence = float(probs[idx])

        return jsonify({'label': str(label), 'confidence': confidence})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
