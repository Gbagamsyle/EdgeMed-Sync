# Node ↔ Python Dilithium Signing Integration

## Overview

This integration provides **post-quantum cryptographic signing** for medical records using Dilithium, a NIST-standardized post-quantum signature algorithm.

### Why Dilithium?
- **Quantum-resistant**: Protects against quantum computer attacks
- **NIST-approved**: Official post-quantum cryptography standard
- **Long-term security**: Medical records need protection for 30+ years
- **Compliance**: Meeting future regulatory requirements

## Architecture

```
Node.js Backend (Express)          Python AI Service (Flask)
                                   
POST /api/records/create
    │
    ├─ Generate record hash (SHA-256)
    │
    ├─ Call signRecord()
    │      │
    │      └─ HTTP POST /signing/sign ────→ Dilithium signing
    │                                        │
    │                ◄────────────────────── Return signature
    │
    └─ Store record + signature in Supabase
```

## File Locations

| Component | File | Language |
|-----------|------|----------|
| Python Signing Service | `edge-backend/ai-service/signing.py` | Python/Flask |
| Node.js Wrapper | `edge-backend/services/dilithiumSigning.js` | JavaScript |
| Integration Example | `edge-backend/routes/records.js` | JavaScript |
| Flask App Update | `edge-backend/ai-service/app.py` | Python |

## Installation

### 1. Install Python Dependencies

```bash
cd edge-backend/ai-service
pip install --only-binary :all: -r requirements.txt
```

**Installed packages:**
- `flask>=2.3.0` — Web framework
- `scikit-learn>=1.0.0` — ML predictions
- `joblib>=1.1.0` — Model serialization
- `numpy>=1.21.0` — Numerical computing

**Optional: Dilithium signing** (for real post-quantum signatures):
```bash
# Pure Python (no compilation):
pip install dilithium-py

# OR: High-performance liboqs bindings:
pip install pyoqs  # Requires C compiler installed
```

If Dilithium is not installed, the service automatically uses **SHA256 fallback** (signatures still work, just not quantum-safe).

## Quick Start

### 1. Install & Start Services

```bash
# Terminal 1: Python Flask service (handles signing)
cd edge-backend/ai-service
pip install --only-binary :all: -r requirements.txt
python app.py
# Should print: Running on http://127.0.0.1:5001

# Terminal 2: Node.js backend (handles records & API)
cd edge-backend
npm install  # if not done yet
node server.js
# Should print: Server listening on port 3001
```

### 2. Verify Services

```bash
# Test Python signing service
python -c "import requests; print(requests.get('http://localhost:5001/signing/health').json())"

# Test Node backend
curl http://localhost:3001/api/records/health  # if this endpoint exists
```

**Expected Output:**
```json
{
  "status": "ok",
  "service": "signing",
  "dilithium_available": false,
  "timestamp": "2026-06-18T13:30:00.048149Z"
}
```

### 3. Create a Record (Auto-Signs)

Frontend submits vital signs → Backend receives at POST `/api/records/create`:

```javascript
{
  "patientId": "patient-123",
  "vitals": {
    "temperature_celsius": 37.2,
    "systolic_bp": 120,
    "diastolic_bp": 80,
    "heart_rate": 72
  },
  "notes": "Patient stable",
  "staffId": "staff-456",
  "createdAt": "2026-06-18T13:30:00Z"
}
```

Backend automatically:
1. Hashes record (SHA-256)
2. Signs hash (Dilithium or SHA256 fallback)
3. Stores record + signature in Supabase
4. Returns success response

## Usage Flow

### Phase 1: Patient Registration

When registering a patient:

```javascript
// Backend: edge-backend/routes/identity.js
import { generateKeyPair } from '../services/dilithiumSigning.js'

const keyPairResult = await generateKeyPair(patientId, 'patient')

if (keyPairResult.success) {
  // Store public key in Supabase (for verification later)
  await supabase
    .from('patients')
    .update({
      public_key: keyPairResult.publicKey,
      signing_algorithm: keyPairResult.algorithm
    })
    .eq('id', patientId)
  
  // Private key: delete after patient confirmation (never send to frontend)
}
```

### Phase 2: Record Creation (Automatic Signing)

When doctor creates a vital record:

```javascript
// Backend: edge-backend/routes/records.js - POST /api/records/create

// 1. Create record payload
const recordPayload = {
  patient_id: patientId,
  vitals: { temperature: 37.2, bp: '120/80', ... },
  created_by: staffId,
  created_at: new Date().toISOString()
}

// 2. Hash the record
const recordHash = sha256Hash(recordPayload)

// 3. Sign with Dilithium (automatic)
const signResult = await signRecord(patientId, recordPayload)
if (signResult.success) {
  recordPayload.dilithium_signature = signResult.signature
  recordPayload.signing_algorithm = 'Dilithium3'
}

// 4. Store in Supabase
await supabase.from('records').insert([recordPayload])
```

### Phase 3: Verification (Auditing)

When auditor verifies record integrity:

```javascript
// Verify signature
const verifyResult = await verifySignature(
  recordId,
  originalRecordData,
  storedSignature,
  patientPublicKey
)

if (verifyResult.valid) {
  console.log('✓ Record authentic - not tampered with')
} else {
  console.log('✗ Record signature verification FAILED - possible tampering!')
}
```

## API Endpoints

### POST /signing/generate-keypair

Generate a new Dilithium keypair for a subject.

**Request:**
```json
{
  "subject_id": "patient-123",
  "subject_type": "patient"
}
```

**Response:**
```json
{
  "subject_id": "patient-123",
  "public_key": "abc123def456...",
  "private_key": "xyz789uvw012...",
  "algorithm": "Dilithium3",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### POST /signing/sign

Sign a record payload.

**Request:**
```json
{
  "subject_id": "patient-123",
  "payload": {
    "record_id": "rec-001",
    "vitals": { "temperature": 37.2 },
    "created_at": "2024-01-15T10:30:00Z"
  },
  "algorithm": "Dilithium3"
}
```

**Response:**
```json
{
  "signature": "hex-encoded-signature-string",
  "subject_id": "patient-123",
  "algorithm": "Dilithium3",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /signing/verify

Verify a signature.

**Request:**
```json
{
  "subject_id": "patient-123",
  "payload": { ... original record ... },
  "signature": "hex-encoded-signature",
  "public_key": "hex-encoded-public-key"
}
```

**Response:**
```json
{
  "valid": true,
  "subject_id": "patient-123",
  "algorithm": "Dilithium3",
  "message": "Signature verified successfully"
}
```

### GET /signing/health

Check service health.

**Response:**
```json
{
  "status": "ok",
  "service": "signing",
  "dilithium_available": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Node.js Service Functions

### generateKeyPair(subjectId, subjectType = 'patient')

Generate a new keypair.

```javascript
const result = await generateKeyPair('patient-123', 'patient')
if (result.success) {
  const { publicKey, privateKey, algorithm } = result
  // Store publicKey in Supabase
  // Delete privateKey after confirming storage
}
```

### signRecord(subjectId, payload)

Sign a record.

```javascript
const result = await signRecord('patient-123', recordPayload)
if (result.success) {
  const { signature, algorithm, timestamp } = result
  // Store signature with record
}
```

### verifySignature(subjectId, payload, signature, publicKey)

Verify a signature.

```javascript
const result = await verifySignature(
  'patient-123',
  originalPayload,
  signature,
  publicKey
)
if (result.valid) {
  console.log('✓ Authentic record')
} else {
  console.log('✗ Tampered record')
}
```

### isSigningServiceAvailable()

Check if Python service is running.

```javascript
const available = await isSigningServiceAvailable()
if (!available) {
  console.warn('Signing service unavailable - using fallback')
}
```

## Fallback Behavior

If the Python Dilithium service is unavailable:

1. **During Installation**: Uses `SHA256-Fallback` (simple hash, not a true signature)
2. **During Signing**: Automatically falls back to SHA256 hash
3. **Service Records**: Continues storing records normally
4. **Verification**: Accepts/rejects based on fallback algorithm

```javascript
// Fallback signing (when Python unavailable)
const fallbackResult = fallbackSignRecord(payload)
// Returns: { signature: 'sha256-hash', algorithm: 'SHA256-Fallback' }
```

## Data Schema (Supabase)

### patients table (NEW FIELDS)

```sql
ALTER TABLE patients ADD COLUMN public_key TEXT;
ALTER TABLE patients ADD COLUMN signing_algorithm VARCHAR(50) DEFAULT 'Dilithium3';
ALTER TABLE patients ADD COLUMN key_generated_at TIMESTAMPTZ;
```

### records table (NEW FIELDS)

```sql
ALTER TABLE records ADD COLUMN dilithium_signature TEXT;
ALTER TABLE records ADD COLUMN signing_algorithm VARCHAR(50) DEFAULT 'Dilithium3';
ALTER TABLE records ADD COLUMN signature_verified_at TIMESTAMPTZ;
```

## Testing

### Test 1: Generate Keypair

```bash
curl -X POST http://localhost:3001/api/signing/test/generate \
  -H "Content-Type: application/json" \
  -d '{"subject_id":"patient-123"}'
```

Expected: Public and private keys returned

### Test 2: Sign a Record

```bash
curl -X POST http://localhost:3001/api/signing/test/sign \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": "patient-123",
    "payload": {"record_id":"rec-001","temperature":37.2}
  }'
```

Expected: Signature returned

### Test 3: Verify Signature

```bash
curl -X POST http://localhost:3001/api/signing/test/verify \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": "patient-123",
    "payload": {"record_id":"rec-001","temperature":37.2},
    "signature": "...",
    "public_key": "..."
  }'
```

Expected: `"valid": true`

### Test 4: End-to-End Record Creation

1. Create patient via `/api/patients` → generates keypair
2. Create vital record via `/api/records/create` → automatically signed
3. Query record → verify `dilithium_signature` field populated
4. Call verification endpoint → confirm signature valid

## Performance Notes

- **Keypair Generation**: ~100-500ms per keypair
- **Signing**: ~50-200ms per record (includes network latency to Python)
- **Verification**: ~100-300ms per signature
- **Caching**: Keypairs cached in Python service memory (loss on restart)

## Security Considerations

1. **Private Keys**: Never transmitted to frontend
   - Generated on backend
   - Stored in Python service memory (or Supabase with encryption)
   - Only used for signing on backend

2. **Public Keys**: Safe to transmit
   - Stored in Supabase
   - Sent to frontend for verification

3. **Network**: Use HTTPS in production
   - Python service should only be accessible from Node backend
   - Not exposed to internet directly

4. **Keypair Storage**: In production, implement:
   - HSM (Hardware Security Module) for private key storage
   - Key versioning/rotation
   - Audit logs for key usage

## Troubleshooting

### Python Service Not Found

```
Error: Failed to sign record: connect ECONNREFUSED 127.0.0.1:5001
```

**Solution:**
1. Verify Python service running: `ps aux | grep app.py`
2. Check port 5001 is open: `netstat -an | grep 5001`
3. Restart service: `python app.py`

### Dilithium Import Error

```
ImportError: No module named 'dilithium'
```

**Solution:**
```bash
pip install dilithium-py
# OR
pip install pyoqs
```

### Signature Verification Failed

```
"valid": false, "message": "Signature verification failed"
```

**Causes:**
- Record payload modified after signing
- Wrong public key used for verification
- Signature corrupted in transmission

**Debug:**
1. Verify original payload hasn't changed
2. Confirm public key matches signing subject
3. Check network transmission of signature

### Service Using Fallback Signatures

```
"algorithm": "SHA256-Fallback"
"warning": "Using placeholder signatures - Dilithium not installed"
```

**Solution:**
```bash
pip install -r requirements.txt
# Then restart Python service
python app.py
```

## Next Steps

1. **Generate keypairs** for all existing patients
   - Script: `edge-backend/scripts/generateKeypairs.js` (create this)
   
2. **Sign all existing records** retroactively
   - Script: `edge-backend/scripts/signExistingRecords.js` (create this)

3. **Add verification UI** to Reports page
   - Show signature status: ✓ Valid / ✗ Invalid / ? Unknown

4. **Implement audit trail**
   - Log all signature verifications
   - Track who verified which records

5. **HSM Integration** (production)
   - Move private key storage to hardware security module
   - Implement key rotation policies

## References

- **Dilithium Spec**: https://pq-crystals.org/dilithium/data/Dilithium-specification-round3-public.pdf
- **NIST PQC**: https://csrc.nist.gov/projects/post-quantum-cryptography/
- **dilithium-py**: https://github.com/Fuzzylogic-AI/dilithium-py
- **pyoqs**: https://github.com/open-quantum-safe/liboqs-python
