// Call backend to register a patient and get QR code:
// POST http://localhost:3001/api/identity/register
// Body: { patient_id: "patient-uuid", pin: "1234" }
import { BACKEND_URL, API_BASE } from './config'

/**
 * QR Code scanning and patient lookup service
 */

/**
 * Lookup patient by DID (Decentralized Identifier)
 * Called after QR code is scanned
 */
export const lookupPatientByDID = async (did) => {
  try {
    const response = await fetch(`${API_BASE}/identity/${did}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'Patient not found. DID may be invalid or not registered.' }
      }
      return { error: `Server error: ${response.statusText}` }
    }

    const data = await response.json()
    return { data }
  } catch (err) {
    return { error: `Failed to lookup patient: ${err.message}` }
  }
}

/**
 * Validate DID format
 * DID should be: did:cdss:16-char-hex
 */
export const validateDID = (did) => {
  const didPattern = /^did:cdss:[a-f0-9]{16}$/i
  return didPattern.test(did)
}

/**
 * Extract DID from QR code data
 * QR typically contains just the DID string
 */
export const extractDIDFromQR = (qrData) => {
  // Trim whitespace
  const cleaned = qrData.trim()
  
  // Check if it's already a valid DID
  if (validateDID(cleaned)) {
    return cleaned
  }

  // Try to extract from potential URL format (e.g., edgemed://patient/did:cdss:...)
  const didMatch = cleaned.match(/did:cdss:[a-f0-9]{16}/i)
  if (didMatch) {
    return didMatch[0]
  }

  return null
}

/**
 * Check if browser supports camera access
 */
export const isCameraSupported = () => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  )
}

/**
 * Request camera permissions
 */
export const requestCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    // Close the stream immediately, we just wanted to test permissions
    stream.getTracks().forEach(track => track.stop())
    return { success: true }
  } catch (err) {
    let message = 'Camera access denied'
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      message = 'Camera permission denied. Please enable camera access in browser settings.'
    } else if (err.name === 'NotFoundError') {
      message = 'No camera found on this device.'
    } else if (err.name === 'NotSupportedError') {
      message = 'Camera not supported in this browser.'
    }

    return { error: message }
  }
}

/**
 * Recover identity by phone + PIN (calls backend /api/identity/recover)
 */
export const recoverIdentity = async (phone, pin) => {
  try {
    const response = await fetch(`${API_BASE}/identity/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Failed to recover identity' }
    }

    return { data }
  } catch (err) {
    return { error: `Recovery failed: ${err.message}` }
  }
}
