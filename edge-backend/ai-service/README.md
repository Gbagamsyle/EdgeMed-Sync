AI Flask microservice

Endpoints:
- GET /health -> returns {status: 'ok'}
- POST /predict -> accepts JSON { vitals: {heart_rate, systolic_bp, diastolic_bp, spo2, temperature, resp_rate} } or { vitals: [..] }
  returns { label: <int>, confidence: <0..1> }

To run locally:

1. Create a virtualenv and install dependencies

```bash
python -m venv .venv
.\.venv\Scripts\activate   # Windows
pip install -r requirements.txt
python app.py
```

The service will listen on port 5001 by default.
