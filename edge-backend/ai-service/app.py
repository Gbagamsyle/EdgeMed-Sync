import json
import os
from functools import lru_cache

from flask import Flask, request, jsonify
from model import FEATURES, predict, get_model_status
from signing import signing_bp

app = Flask(__name__)

# Register signing blueprint
app.register_blueprint(signing_bp, url_prefix='/signing')


@lru_cache(maxsize=256)
def cached_predict(vitals_json: str):
    vitals = json.loads(vitals_json)
    return predict(vitals)


def _normalize_vitals(vitals):
    if isinstance(vitals, list):
        vitals = dict(zip(FEATURES, vitals))

    if not isinstance(vitals, dict):
        vitals = {}

    return vitals

@app.route('/health', methods=['GET'])
def health():
    status = get_model_status()
    return jsonify({'status': 'ok' if status.get('ready') else 'degraded', 'services': ['predict', 'signing'], **status})

@app.route('/predict', methods=['POST'])
def predict_route():
    try:
        body = request.get_json(silent=True) or {}
        vitals = _normalize_vitals(body.get('vitals', {}))
        vitals_key = json.dumps(vitals, sort_keys=True)
        result = cached_predict(vitals_key)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5001'))
    app.run(host='0.0.0.0', port=port, threaded=True, use_reloader=False)
