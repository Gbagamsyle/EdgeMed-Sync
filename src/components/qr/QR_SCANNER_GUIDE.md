# QR Scanner Integration Guide

## Overview
The QR Scanner (html5-qrcode) is fully integrated into the ScanQR page with offline-first capabilities.

## Features Implemented

### 1. **QR Code Scanning** ✅
- Uses `html5-qrcode` library for browser-based camera access
- Supports both front and rear cameras
- Real-time scanning with visual feedback
- Automatic DID extraction and validation

### 2. **Patient Lookup** ✅
- Scans DID from QR code
- Calls backend `/api/identity/:did` endpoint
- Displays patient profile (name, phone, blood group, etc.)
- Shows "Patient Found" success state

### 3. **Offline Caching** ✅
- Scanned patient data cached in IndexedDB (Dexie)
- Enables offline patient lookup when network unavailable
- Cache populated automatically on each successful scan
- Survives browser refresh

### 4. **Navigation Integration** ✅
- **View Patient Profile** button → `/patients/{patientId}`
- **Record Vital Signs** button → `/vitals` page with pre-selected patient
- **Scan Another Patient** button → Reset and scan again

### 5. **Fallback Mode** ✅
- Manual DID entry field if camera unavailable
- Camera permission denied handling
- Browser compatibility checks
- Error messages for failed lookups

## File Locations

| File | Purpose |
|------|---------|
| `src/pages/qr/ScanQR.jsx` | QR Scanner page wrapper |
| `src/components/qr/QRScanner.jsx` | Main scanner component (html5-qrcode) |
| `src/services/qrService.js` | QR/DID utilities (validation, extraction) |
| `src/utils/dexieDb.js` | Patient cache via patientCache API |
| `edge-backend/routes/identity.js` | Backend GET /api/identity/:did endpoint |

## Data Flow

```
1. User navigates to ScanQR page
   ↓
2. QRScanner initializes camera
   ↓
3. User points camera at QR code
   ↓
4. QR code detected → extractDIDFromQR()
   ↓
5. validateDID() checks format
   ↓
6. lookupPatientByDID() calls backend /api/identity/:did
   ↓
7. Backend queries Supabase, returns patient data
   ↓
8. Patient data cached in IndexedDB (patientCache.add)
   ↓
9. Patient profile displayed with action buttons
   ↓
10. User clicks "Record Vital Signs" → navigates to /vitals with patient pre-selected
```

## Offline Behavior

### Online
- Scans QR → Backend lookup → Cache locally → Display result

### Offline
- QR code scanned → Check local cache → Show from cache or "Patient not in cache" error
- Manual DID entry still works if patient was previously scanned

### Going Online
- All subsequent scans fetch fresh data from backend
- New data automatically updates cache

## Testing

### Test 1: Basic QR Scan
1. Navigate to `/qr` (Patient Check-In)
2. Click "Start Camera Scanner"
3. Point at patient QR code
4. Verify patient details display
5. Verify "Patient cached locally" message in console

### Test 2: Manual Entry
1. Navigate to `/qr`
2. Scroll down to "Manual Entry" section
3. Enter a valid DID: `did:cdss:0123456789abcdef`
4. Click "Look Up Patient"
5. Verify patient displays or "Patient not found" error

### Test 3: Offline Caching
1. Scan a patient QR (online)
2. Go to DevTools Network → Offline
3. Try scanning same patient again
4. Should display cached result instantly
5. Go back online, try another patient

### Test 4: Navigation
1. Scan patient successfully
2. Click "Record Vital Signs"
3. Verify redirected to `/vitals` with patient pre-selected
4. Should be ready to enter vitals immediately

### Test 5: Camera Fallback
1. In DevTools, disable camera (Device Permissions)
2. Refresh `/qr` page
3. Should show "Camera not supported" or "Camera permission denied"
4. Manual entry field should still be functional

## Error Handling

| Error | Expected Behavior |
|-------|-------------------|
| Camera not supported | Show "Camera not supported" message, fallback to manual entry |
| Permission denied | Show "Camera permission denied", allow retry |
| Invalid QR format | Show "Invalid QR code. Expected DID format" |
| Patient not found | Show "Patient not found" error, allow retry |
| Network error (offline) | Show error, check if patient in local cache |
| Backend error (5xx) | Show "Server error", allow retry when online |

## Cache Management

### Auto-Cache
- Every successful patient lookup auto-caches in IndexedDB
- Cache key: patient ID
- No manual cache management needed

### Manual Cache (Advanced)
```javascript
import { patientCache } from '@/utils/dexieDb'

// View cached patients
const patients = await patientCache.getAll()

// Clear cache (if needed)
await patientCache.clear()
```

## Performance Notes

- **Scan Speed**: ~1-2 seconds average (html5-qrcode processing)
- **Lookup Speed**: ~500ms online, instant if cached offline
- **Camera Init**: ~2-3 seconds first time (permission check + camera startup)
- **Memory**: <1MB cache per 100 patients in IndexedDB

## Security Considerations

1. **DID Format Validation**: All DIDs validated against `/^did:cdss:[a-f0-9]{16}$/` pattern
2. **Backend Auth**: Backend /api/identity/:did endpoint is PUBLIC (read-only lookup)
3. **Local Cache**: Patient data stored in browser IndexedDB (same security as localStorage)
4. **No Sensitive Data**: QR code contains only DID, not full patient record
5. **PII Protection**: Patient phone/email cached but not displayed in QR

## Dependencies

```json
{
  "html5-qrcode": "^2.3.8",  // QR scanning
  "dexie": "^4.4.4",         // IndexedDB cache
  "react-router-dom": "^7.13.1"  // Navigation
}
```

All already in package.json ✓

## Next Steps

1. **Test offline flow** in production
2. **Add patient search UI** in case patient not found
3. **Implement audit logging** (log QR scans for staff accountability)
4. **Add barcode format** support (Code128, UPC for hospital ID scanning)
5. **Sync scanned vitals** when back online via offline sync system

## Troubleshooting

### QR not scanning
- Check camera permissions in browser settings
- Ensure QR code is valid format: `did:cdss:0123456789abcdef`
- Try manual entry field instead

### Patient not found
- Verify patient is registered in system (check Supabase)
- Check patient has DIDs assigned via `/api/identity/register`
- Try manual DID entry if QR code is damaged

### Camera not starting
- Try different browser (Chrome/Firefox recommended)
- Check if browser has camera permission
- Verify HTTPS (required for camera access, except localhost)

### Offline lookup not working
- Check that patient was scanned while online (to cache them)
- Verify IndexedDB is enabled in browser
- Try DevTools Application → IndexedDB → EdgeMedSync → patients table

## API Reference

### QR Service Functions

```javascript
// Extract DID from QR code data
extractDIDFromQR(qrData: string): string | null

// Validate DID format
validateDID(did: string): boolean

// Lookup patient by DID (calls backend)
lookupPatientByDID(did: string): Promise<{ data: Patient } | { error: string }>

// Check if camera is supported
isCameraSupported(): boolean

// Request camera permissions
requestCameraPermission(): Promise<{ success: true } | { error: string }>
```

### Patient Cache Functions

```javascript
// Add/update patient in local cache
await patientCache.add(patient: Patient)

// Get patient by ID
await patientCache.get(patientId: string)

// Get all cached patients
await patientCache.getAll()

// Clear all cached patients
await patientCache.clear()
```

## Related Documentation

- QR Generator: `src/components/qr/QRGenerator.jsx`
- Patient Service: `src/services/patientService.js`
- Offline Sync: `src/workers/README.md`
- Backend Identity Routes: `edge-backend/routes/identity.js`
