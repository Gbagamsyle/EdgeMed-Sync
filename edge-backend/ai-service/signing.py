"""
Dilithium Signing Service
Provides post-quantum cryptographic signing for EdgeMed records

Requires: pip install dilithium-py
or: pip install pyoqs
"""

from flask import Blueprint, request, jsonify
import json
from datetime import datetime

# Try dilithium-py first, fall back to placeholder
try:
    from dilithium import Dilithium
    DILITHIUM_AVAILABLE = True
except ImportError:
    DILITHIUM_AVAILABLE = False
    print("⚠️  dilithium-py not installed. Using placeholder signatures.")

signing_bp = Blueprint('signing', __name__)

# In-memory keypair store (in production, store in Supabase)
KEYPAIRS = {}

@signing_bp.route('/generate-keypair', methods=['POST'])
def generate_keypair():
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
        data = request.json
        subject_id = data.get('subject_id')
        subject_type = data.get('subject_type', 'patient')

        if not subject_id:
            return jsonify({'error': 'subject_id required'}), 400

        if not DILITHIUM_AVAILABLE:
            # Placeholder: generate fake keys
            return jsonify({
                'subject_id': subject_id,
                'subject_type': subject_type,
                'public_key': f'placeholder_pk_{subject_id}',
                'private_key': f'placeholder_sk_{subject_id}',
                'algorithm': 'Dilithium3-Placeholder',
                'created_at': datetime.utcnow().isoformat() + 'Z',
                'warning': 'Using placeholder keys - Dilithium not installed'
            }), 200

        # Generate real Dilithium keypair
        d = Dilithium()
        pk, sk = d.generate_keys()

        # Store for later signing
        KEYPAIRS[subject_id] = {
            'pk': pk,
            'sk': sk,
            'subject_type': subject_type,
            'created_at': datetime.utcnow().isoformat()
        }

        return jsonify({
            'subject_id': subject_id,
            'subject_type': subject_type,
            'public_key': pk.hex(),
            'algorithm': 'Dilithium3',
            'created_at': datetime.utcnow().isoformat() + 'Z',
            'message': 'Keypair generated successfully'
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
        data = request.json
        subject_id = data.get('subject_id')
        payload = data.get('payload')
        
        if not subject_id or not payload:
            return jsonify({'error': 'subject_id and payload required'}), 400

        # Convert payload to bytes for signing
        payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')

        if not DILITHIUM_AVAILABLE:
            # Placeholder signature
            return jsonify({
                'signature': f'placeholder_sig_{subject_id}_{len(payload_bytes)}',
                'subject_id': subject_id,
                'algorithm': 'Dilithium3-Placeholder',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'warning': 'Using placeholder signature - Dilithium not installed'
            }), 200

        # Get keypair from storage or re-generate if not found
        if subject_id not in KEYPAIRS:
            d = Dilithium()
            pk, sk = d.generate_keys()
            KEYPAIRS[subject_id] = {'pk': pk, 'sk': sk}
        
        keypair = KEYPAIRS[subject_id]
        sk = keypair['sk']

        # Sign the payload
        d = Dilithium()
        signature = d.sign(payload_bytes, sk)

        return jsonify({
            'signature': signature.hex(),
            'subject_id': subject_id,
            'algorithm': 'Dilithium3',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'message': 'Signature generated successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@signing_bp.route('/verify', methods=['POST'])
def verify_signature():
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
        data = request.json
        subject_id = data.get('subject_id')
        payload = data.get('payload')
        signature = data.get('signature')
        public_key = data.get('public_key')

        if not all([subject_id, payload, signature, public_key]):
            return jsonify({'error': 'subject_id, payload, signature, and public_key required'}), 400

        if not DILITHIUM_AVAILABLE:
            # Placeholder verification (always succeeds)
            return jsonify({
                'valid': True,
                'subject_id': subject_id,
                'algorithm': 'Dilithium3-Placeholder',
                'message': 'Placeholder verification - Dilithium not installed',
                'warning': 'Using placeholder verification'
            }), 200

        # Convert back to bytes
        payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
        signature_bytes = bytes.fromhex(signature)
        pk_bytes = bytes.fromhex(public_key)

        # Verify signature
        d = Dilithium()
        is_valid = d.verify(payload_bytes, signature_bytes, pk_bytes)

        return jsonify({
            'valid': is_valid,
            'subject_id': subject_id,
            'algorithm': 'Dilithium3',
            'message': 'Signature verified' if is_valid else 'Signature verification failed'
        }), 200

    except Exception as e:
        return jsonify({
            'valid': False,
            'error': str(e),
            'subject_id': subject_id
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
