"""
Dilithium Signing Service
Provides post-quantum cryptographic signing for EdgeMed records.
"""

import hashlib
import json
from datetime import datetime

from flask import Blueprint, jsonify, request

try:
    from dilithium_py.dilithium import Dilithium3

    DILITHIUM_AVAILABLE = True
except ImportError:  # pragma: no cover - depends on environment
    Dilithium3 = None
    DILITHIUM_AVAILABLE = False
    print("⚠️  Dilithium backend unavailable. Falling back to SHA-256 hashing.")

signing_bp = Blueprint('signing', __name__)

# In-memory keypair store (in production, store in Supabase)
KEYPAIRS = {}


def generate_keypair() -> tuple[bytes, bytes]:
    if not DILITHIUM_AVAILABLE:
        raise RuntimeError('Dilithium backend unavailable')

    backend = Dilithium3
    public_key, private_key = backend.keygen()
    return public_key, private_key


def sign_bytes(payload: bytes, private_key: bytes) -> bytes:
    if not DILITHIUM_AVAILABLE:
        return hashlib.sha256(payload).digest()

    return Dilithium3.sign(private_key, payload)


def verify_signature_bytes(payload: bytes, signature: bytes, public_key: bytes) -> bool:
    if not DILITHIUM_AVAILABLE:
        return hashlib.sha256(payload).digest() == signature

    return bool(Dilithium3.verify(public_key, payload, signature))


@signing_bp.route('/generate-keypair', methods=['POST'])
def generate_keypair_route():
    """
    POST /signing/generate-keypair
    Generate a new Dilithium keypair for a patient/staff member
    
    Request:
    {
      "subject_id": "patient-123",
      "subject_type": "patient"  # or "staff"
    }
    
    Response:
    {
      "subject_id": "patient-123",
      "public_key": "base64-encoded-public-key",
      "private_key": "base64-encoded-private-key",  # Only return for registration
      "algorithm": "Dilithium3",
      "created_at": "2024-01-15T10:30:00Z"
    }
    """
    try:
        data = request.get_json(silent=True) or {}
        subject_id = data.get('subject_id')
        subject_type = data.get('subject_type', 'patient')

        if not subject_id:
            return jsonify({'error': 'subject_id required'}), 400

        public_key, private_key = generate_keypair()

        KEYPAIRS[subject_id] = {
            'pk': public_key,
            'sk': private_key,
            'subject_type': subject_type,
            'created_at': datetime.utcnow().isoformat(),
        }

        return jsonify({
            'subject_id': subject_id,
            'subject_type': subject_type,
            'public_key': public_key.hex(),
            'private_key': private_key.hex(),
            'algorithm': 'Dilithium3' if DILITHIUM_AVAILABLE else 'SHA256-Fallback',
            'created_at': datetime.utcnow().isoformat() + 'Z',
            'message': 'Keypair generated successfully',
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@signing_bp.route('/sign', methods=['POST'])
def sign_payload():
    """
    POST /signing/sign
    Sign a payload using Dilithium
    
    Request:
    {
      "subject_id": "patient-123",
      "payload": { ... record data ... },
      "algorithm": "Dilithium3"
    }
    
    Response:
    {
      "signature": "base64-encoded-signature",
      "subject_id": "patient-123",
      "algorithm": "Dilithium3",
      "timestamp": "2024-01-15T10:30:00Z"
    }
    """
    try:
        data = request.get_json(silent=True) or {}
        subject_id = data.get('subject_id')
        payload = data.get('payload')

        if not subject_id or payload is None:
            return jsonify({'error': 'subject_id and payload required'}), 400

        payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')

        if subject_id not in KEYPAIRS:
            public_key, private_key = generate_keypair()
            KEYPAIRS[subject_id] = {'pk': public_key, 'sk': private_key}

        keypair = KEYPAIRS[subject_id]
        signature = sign_bytes(payload_bytes, keypair['sk'])

        return jsonify({
            'signature': signature.hex(),
            'subject_id': subject_id,
            'algorithm': 'Dilithium3' if DILITHIUM_AVAILABLE else 'SHA256-Fallback',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'message': 'Signature generated successfully',
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@signing_bp.route('/verify', methods=['POST'])
def verify_signature_route():
    """
    POST /signing/verify
    Verify a Dilithium signature
    
    Request:
    {
      "subject_id": "patient-123",
      "payload": { ... record data ... },
      "signature": "base64-encoded-signature",
      "public_key": "base64-encoded-public-key"
    }
    
    Response:
    {
      "valid": true,
      "subject_id": "patient-123",
      "algorithm": "Dilithium3",
      "message": "Signature verified successfully"
    }
    """
    try:
        data = request.get_json(silent=True) or {}
        subject_id = data.get('subject_id')
        payload = data.get('payload')
        signature = data.get('signature')
        public_key = data.get('public_key')

        if not all([subject_id, payload is not None, signature, public_key]):
            return jsonify({'error': 'subject_id, payload, signature, and public_key required'}), 400

        payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
        signature_bytes = bytes.fromhex(signature)
        public_key_bytes = bytes.fromhex(public_key)

        is_valid = verify_signature_bytes(payload_bytes, signature_bytes, public_key_bytes)

        return jsonify({
            'valid': is_valid,
            'subject_id': subject_id,
            'algorithm': 'Dilithium3' if DILITHIUM_AVAILABLE else 'SHA256-Fallback',
            'message': 'Signature verified' if is_valid else 'Signature verification failed',
        }), 200

    except Exception as e:
        return jsonify({
            'valid': False,
            'error': str(e),
            'subject_id': subject_id,
        }), 500


@signing_bp.route('/health', methods=['GET'])
def health():
    """Health check for signing service"""
    return jsonify({
        'status': 'ok',
        'service': 'signing',
        'dilithium_available': DILITHIUM_AVAILABLE,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }), 200
