from flask import Flask, request, jsonify
from model import FEATURES, predict
from signing import signing_bp

app = Flask(__name__)

# Register signing blueprint
app.register_blueprint(signing_bp, url_prefix='/signing')

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'services': ['predict', 'signing']})

@app.route('/predict', methods=['POST'])
def predict_route():
    try:
        body = request.get_json(silent=True) or {}
        vitals = body.get('vitals', {})

        if isinstance(vitals, list):
            vitals = dict(zip(FEATURES, vitals))

        if not isinstance(vitals, dict):
            return jsonify({'error': 'vitals must be a JSON object or list'}), 400

        result = predict(vitals)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
