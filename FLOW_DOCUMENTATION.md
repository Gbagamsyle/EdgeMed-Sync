# EdgeMed Sync - Application Flow & Architecture

## 1. Purpose
This document explains the main flow of the `EdgeMed-Sync` project so it can be shared with other team members or stakeholders. It describes:
- frontend application flow
- backend route responsibilities
- identity and QR flow
- offline sync behavior
- data storage and integration points

## 2. Repository Structure

Root level:
- `package.json` – frontend dependencies and Vite scripts
- `README.md` – default repo README (not currently containing flow-specific docs)
- `src/` – React frontend source code
- `edge-backend/` – backend API and supporting services

Frontend:
- `src/App.jsx` – main app shell and offline status banner
- `src/routes/AppRoutes.jsx` – browser routes and protected dashboard area
- `src/context/AuthContext.jsx` – user authentication state using Supabase
- `src/services/` – data service helpers for Supabase, QR, vitals, patients
- `src/hooks/useOfflineSync.js` – offline record sync manager
- `src/utils/dexieDb.js` – IndexedDB offline queue implementation
- `src/components/qr/QRScanner.jsx` – QR scanner logic and patient lookup UI

Backend:
- `edge-backend/server.js` – Express server entry point
- `edge-backend/routes/` – route modules by domain
- `edge-backend/services/` – reusable backend helpers for DID, signing, hashing, QR generation, Merkle
- `edge-backend/ai-service/` – external Python AI prediction service

## 3. High-Level Application Flow

### 3.1 User Journey
1. User opens the frontend app.
2. Authentication uses Supabase sessions and protects dashboard routes.
3. Staff can add patients, create and update patient records, and access reports.
4. The app can scan a patient QR code and resolve the patient by DID.
5. Medical records can be created offline and queued until connectivity returns.
6. The backend handles identity registration, record creation, AI prediction, hashing, signing, audit logging, and eventual sync.

## 4. Frontend Flow

### 4.1 App Entry and Routing
- `src/App.jsx` wraps the app and displays connectivity / pending sync status.
- `src/routes/AppRoutes.jsx` defines public routes:
  - `/` - `Homepage`
  - `/auth/login` - login page
  - `/auth/register` - registration page

- Dashboard routes require authentication via `ProtectedRoute`:
  - `/dashboard` - main dashboard
  - `/dashboard/patients` - view patients
  - `/dashboard/patients/add` - add patient
  - `/dashboard/patients/:id` - patient profile
  - `/dashboard/patients/:id/edit` - edit patient
  - `/dashboard/patients/:id/records` - patient records
  - `/dashboard/diagnosis` - diagnosis page
  - `/dashboard/vitals` - vitals entry page
  - `/dashboard/qr/scan` - QR scan page
  - `/dashboard/reports` - reports page
  - `/dashboard/settings` - settings page

### 4.2 Authentication
- `src/context/AuthContext.jsx` uses `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()`.
- Auth state provides `user`, `profile`, and `loading`.
- `ProtectedRoute` redirects unauthenticated users to `/auth/login`.

### 4.3 Patient CRUD
- `src/services/patientService.js` provides Supabase operations:
  - `createPatient`
  - `getPatients`
  - `getPatientById`
  - `updatePatient`
- Patient pages interact with these services to show and update patient data.

### 4.4 QR Identity Flow
- `src/components/qr/QRScanner.jsx` scans QR codes using `html5-qrcode`.
- `src/services/qrService.js` validates DID format and hits the backend identity endpoint:
  - `GET /api/identity/:did`
- The backend responds with patient metadata for the scanned DID.
- QR scanning supports both direct DID text and QR-encoded payloads.

### 4.5 Vitals & Records
- Vital entries are created via the vitals page and stored as record payloads.
- A record includes:
  - vitals data
  - staff or doctor identifiers
  - optional notes
  - AI prediction metadata
- The frontend can queue a record if offline and then sync later.

### 4.6 Offline Sync
- `src/hooks/useOfflineSync.js` manages online/offline status and queue statistics.
- `src/utils/dexieDb.js` stores queued records in IndexedDB under `EdgeMedSync`.
- Queue schema includes `recordQueue` items with `status`, `attempts`, and timestamps.
- When online, the app can trigger the sync worker to push pending records.
- The worker uses a message-based interface to coordinate sync events.

## 5. Backend Flow

### 5.1 Server Entry
- `edge-backend/server.js` loads environment variables and configures Express.
- Middleware includes CORS and JSON body parsing.
- Registered API routes:
  - `/api/identity`
  - `/api/records`
  - `/api/ai`
  - `/api/merkle`
  - `/api/blockchain`
  - `/api/sync`
  - `/api/audit`

### 5.2 Identity Routes
- `POST /api/identity/register`
  - validates `patient_id` and 4-digit PIN
  - loads patient from Supabase
  - generates a DID using patient data
  - produces a cryptographic key pair
  - hashes the PIN and stores PIN salt/hash
  - generates a QR code image data URL
  - updates the patient record with DID, public key, QR code, and identity metadata

- `POST /api/identity/recover`
  - staff-protected route
  - receives `phone` and `pin`
  - finds a patient by phone, verifies the PIN
  - returns DID and QR code if valid

- `GET /api/identity/:did`
  - looks up patient profile by DID
  - returns patient details for QR scan resolution

### 5.3 Records Routes
- `POST /api/records` and `POST /api/records/create`
  - build a record payload from submitted vitals and metadata
  - request AI prediction from the AI service
  - compute `sha256_hash` of the record
  - sign the record with Dilithium or fallback signature
  - insert the record into Supabase
  - mark record sync status

- `GET /api/records/:recordId` and `GET /api/records/patient/:patientDID`
  - fetch records by ID or patient DID

### 5.4 AI Service
- `edge-backend/routes/ai.js` proxies requests to the external AI microservice at `process.env.AI_SERVICE_URL`.
- It exposes:
  - `POST /api/ai/predict`
  - `GET /api/ai/status`
- The AI service is responsible for analyzing vitals and returning a prediction payload.

### 5.5 Merkle & Blockchain
- `edge-backend/routes/merkle.js` provides Merkle tree operations:
  - `POST /api/merkle/batch` – build a Merkle tree from record hashes and store batch metadata
  - `POST /api/merkle/proof` – generate a proof for a leaf hash
  - `POST /api/merkle/verify` – verify a proof against a root

- `edge-backend/routes/blockchain.js` offers blockchain anchoring placeholders:
  - `POST /api/blockchain/anchor`
  - `GET /api/blockchain/verify/:recordId`
- These endpoints are marked as pending and are intended for later on-chain tamper-proof anchoring.

### 5.6 Audit Logging
- `edge-backend/routes/audit.js` writes audit events to Supabase.
- `POST /api/audit/log` stores log events:
  - `event_type`
  - `patient_id`
  - `patient_did`
  - `staff_id`
  - `details`
- There is also a protected `GET /api/audit/logs` route for fetching filtered audit logs.

## 6. Backend Services

### 6.1 DID & Identity Helpers
- `edge-backend/services/did.js`
  - generates patient DID strings
  - creates PIN hashes and salts
  - verifies PIN values
  - validates DID format

### 6.2 Signing & Hashing
- `edge-backend/services/signing.js` and `dilithiumSigning.js`
  - sign records with cryptographic keys
  - verify signatures
  - generate key pairs
  - fallback signing if external signing service is unavailable

- `edge-backend/services/hashing.js`
  - `sha256Hash` and `sha256Buffer`
  - verify hash result against expected value

### 6.3 QR Code Generation
- `edge-backend/services/qrCode.js`
  - generate QR data URLs, SVG, and raw buffers from text

### 6.4 Merkle Utilities
- `edge-backend/services/merkle.js`
  - build Merkle trees from record hashes
  - return proofs and verify leaves

## 7. Data Storage

### 7.1 Supabase
Used as the core backend database for:
- `patients`
- `records`
- `audit_logs`
- `merkle_batches`
- `users`

Supabase also handles authentication for the frontend.

### 7.2 IndexedDB / Dexie
Used for offline-first behavior via `src/utils/dexieDb.js`:
- `recordQueue` – offline records waiting for sync
- `patients` – local patient cache
- `records` – cached records
- `syncLog` – sync event history

### 7.3 AI Service
- `edge-backend/ai-service/` contains the Python AI prediction service.
- Note: This service is reached via `process.env.AI_SERVICE_URL`.

## 8. Deployment & Run Notes

### Frontend
1. Install dependencies in repo root:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```

### Backend
1. Change to backend folder:
   ```bash
   cd edge-backend
   npm install
   npm run dev
   ```
2. Ensure environment variables are set:
   - `FRONTEND_URL`
   - `AI_SERVICE_URL`
   - Supabase credentials / keys as used by backend services

### AI Service
- The backend proxies prediction requests to the AI service URL.
- Confirm the Flask service is running and reachable.

## 9. Sharing & Export
This `FLOW_DOCUMENTATION.md` file is already exportable and can be shared as a standalone architecture overview.

For a presentation or quick handoff, the key points are:
- frontend routes and auth via Supabase
- QR identity registration + lookup
- offline record queue in IndexedDB
- backend APIs for identity, records, AI, Merkle, blockchain anchor, and audit logs
- the external AI microservice and on-chain workflow placeholders

## 10. Recommended Talking Points
- `ProtectedRoute` secures dashboard pages using Supabase auth.
- Patient identity is represented by a DID and printed as QR.
- Scanned QR data resolves to a patient profile via backend lookup.
- New records are hashed, optionally signed, and stored in Supabase.
- Offline writes queue locally in IndexedDB and synchronize when online.
- Merkle tree and blockchain endpoints are present for future tamper-proof audit capabilities.
- Audit logging captures staff and patient activity.
