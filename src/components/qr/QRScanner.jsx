import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode'
import { lookupPatientByDID, extractDIDFromQR, validateDID, isCameraSupported, requestCameraPermission } from '../../services/qrService'
import { patientCache } from '../../utils/dexieDb'
import Button from '../ui/Button'
import Card from '../ui/Card'

export default function QRScanner() {
  const navigate = useNavigate()
  const html5QrcodeRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [scannedDID, setScannedDID] = useState(null)
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cachedPatient, setCachedPatient] = useState(false)
  const [error, setError] = useState(() => (isCameraSupported() ? null : 'Camera access is not supported in your browser.'))
  const [cameraSupported] = useState(() => isCameraSupported())
  const [cameraPermission, setCameraPermission] = useState(null)
  const [manualDID, setManualDID] = useState('')
  const [isOnline] = useState(navigator.onLine)

  

  
  // Lookup patient by DID with offline cache fallback
  const lookupPatient = useCallback(async (did) => {
    setLoading(true)
    setError(null)
    setPatient(null)

    try {
      if (!navigator.onLine) {
        throw new Error('Offline mode: loading cached patient data')
      }

      const result = await lookupPatientByDID(did)
      if (result.error) {
        throw new Error(result.error)
      }

      const patientData = result.data
      setPatient(patientData)
      setCachedPatient(false)

      // Cache patient locally for offline access
      try {
        await patientCache.add({
          id: patientData.id,
          did: patientData.did,
          full_name: patientData.full_name,
          phone: patientData.phone,
          gender: patientData.gender,
          blood_group: patientData.blood_group,
          email: patientData.email,
          public_key: patientData.public_key,
          created_at: patientData.created_at
        })
        console.log('✓ Patient cached locally for offline access')
      } catch (err) {
        console.warn('Failed to cache patient locally:', err)
      }
    } catch (err) {
      console.warn('[QRScanner] lookup error:', err.message)
      const cachedPatientData = await patientCache.getByDid(did)
      if (cachedPatientData) {
        setPatient(cachedPatientData)
        setCachedPatient(true)
        setError('Offline: loaded cached patient data')
      } else {
        setCachedPatient(false)
        setError(err.message || 'Failed to lookup patient')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Stop scanner
  const stopScanner = useCallback(async () => {
    try {
      if (html5QrcodeRef.current) {
        const state = html5QrcodeRef.current.getState()
        if (state !== Html5QrcodeScannerState.NOT_STARTED) {
          await html5QrcodeRef.current.clear()
          html5QrcodeRef.current = null
        }
      }
      setScanning(false)
    } catch (err) {
      console.error('[QRScanner] Stop error:', err)
    }
  }, [])

  // Handle QR scan errors (silent - logs to console only)
  const onScanError = useCallback((error) => {
    // Silently ignore scanning errors - they're common during scanning
    // Only log critical errors
    if (!error.includes('No QR code found')) {
      console.debug('[QRScanner] Scan error:', error)
    }
  }, [])

  // Handle successful QR scan
  const onScanSuccess = useCallback(async (decodedText) => {
    console.log('🔍 QR scanned:', decodedText)
    
    // Extract DID from QR code
    const did = extractDIDFromQR(decodedText)
    
    if (!did) {
      setError('Invalid QR code. Expected a patient DID (did:cdss:...)')
      return
    }

    // Stop scanner to prevent multiple scans
    await stopScanner()
    setScannedDID(did)

    // Lookup patient
    await lookupPatient(did)
  }, [stopScanner, lookupPatient])

  // Initialize QR scanner
  const initScanner = useCallback(async () => {
    if (!cameraSupported) {
      setError('Camera not supported. Please use a modern browser.')
      return
    }

    // Check permissions first
    const permResult = await requestCameraPermission()
    if (permResult.error) {
      setCameraPermission('denied')
      setError(permResult.error)
      return
    }

    setCameraPermission('granted')

    try {
      if (!html5QrcodeRef.current) {
        html5QrcodeRef.current = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            disableFlip: false,
            facingMode: 'environment'
          },
          false
        )
      }

      const scanner = html5QrcodeRef.current

      await scanner.render(onScanSuccess, onScanError)
      setScanning(true)
      setError(null)
    } catch (err) {
      console.error('[QRScanner] Init error:', err)
      setError(`Failed to start camera: ${err.message}`)
      setScanning(false)
    }
  }, [cameraSupported, onScanSuccess, onScanError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void stopScanner()
    }
  }, [stopScanner])


  // Handle manual DID entry
  const handleManualLookup = async (e) => {
    e.preventDefault()
    
    if (!manualDID.trim()) {
      setError('Please enter a DID')
      return
    }

    if (!validateDID(manualDID.trim())) {
      setError('Invalid DID format. Expected: did:cdss:xxxxxxxxxxxxxxxx')
      return
    }

    setScannedDID(manualDID.trim())
    await lookupPatient(manualDID.trim())
  }

  // Reset state
  const handleReset = async () => {
    await stopScanner()
    setScannedDID(null)
    setPatient(null)
    setCachedPatient(false)
    setError(null)
    setManualDID('')
  }

  // Navigate to patient profile
  const handleViewProfile = () => {
    if (patient && patient.id) {
      navigate(`/patients/${patient.id}`)
    }
  }

  // Navigate to create vital for patient
  const handleRecordVital = () => {
    if (patient && patient.id) {
      navigate('/vitals', { state: { selectedPatientId: patient.id } })
    }
  }

  // Start scanning
  const handleStartScanning = async () => {
    setError(null)
    setManualDID('')
    await initScanner()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Patient Check-In</h2>
        <p className="mt-1 text-sm text-slate-500">Scan a patient's QR code or enter their DID manually. Patient data is cached locally for offline access.</p>
        {!isOnline && (
          <p className="mt-2 inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <span>⚠</span>
            Offline mode — using cached patient data
          </p>
        )}
        {cachedPatient && (
          <p className="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            <span>💾</span>
            Patient loaded from local cache. Live lookup unavailable.
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scanner Section */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {!scanning && !scannedDID ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                  <span className="material-symbols-outlined text-3xl text-sky-600">qr_code_2</span>
                </div>
                
                {!cameraSupported || cameraPermission === 'denied' ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-red-50 p-4 text-left">
                      <p className="text-sm font-medium text-red-900">
                        {!cameraSupported 
                          ? '📷 Camera not supported' 
                          : '🔒 Camera permission denied'}
                      </p>
                      <p className="mt-1 text-xs text-red-700">
                        {!cameraSupported
                          ? 'Your browser does not support camera access. Use the manual entry below.'
                          : 'Please enable camera access in your browser settings to use the scanner.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Ready to Scan</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Click the button below to start scanning patient QR codes.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleStartScanning}
                  disabled={!cameraSupported || cameraPermission === 'denied'}
                  className="mt-4 w-full"
                >
                  <span className="material-symbols-outlined mr-2 text-base">photo_camera</span>
                  Start Camera Scanner
                </Button>
              </div>
            ) : scanning ? (
              <div>
                <div id="qr-reader" className="rounded-lg overflow-hidden" />
                <div className="mt-4 text-center">
                  <p className="text-sm text-slate-600 mb-3">Position QR code in the frame</p>
                  <Button 
                    onClick={stopScanner} 
                    variant="secondary"
                    className="w-full"
                  >
                    Stop Scanning
                  </Button>
                </div>
              </div>
            ) : (
              scannedDID && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✓</span>
                      <div className="text-left">
                        <h4 className="font-semibold text-green-900">QR Code Scanned</h4>
                        <p className="mt-1 break-all text-xs text-green-700 font-mono">{scannedDID}</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleReset}
                    variant="secondary"
                    className="w-full"
                  >
                    Scan Another
                  </Button>
                </div>
              )
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-4">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="mt-1 text-xs text-red-700">{error}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Manual Entry & Results Section */}
        <div className="space-y-6">
          {/* Manual DID Entry */}
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-slate-900">Manual Entry</h3>
            <form onSubmit={handleManualLookup} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Patient DID
                </label>
                <input
                  type="text"
                  value={manualDID}
                  onChange={(e) => setManualDID(e.target.value)}
                  placeholder="did:cdss:..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <Button 
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Searching...' : 'Look Up Patient'}
              </Button>
            </form>
          </Card>

          {/* Patient Results */}
          {patient && (
            <Card className="p-6 border-green-200 bg-green-50/50">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">✓ Patient Found</h3>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="font-medium text-slate-900">{patient.full_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-medium text-slate-900">{patient.phone}</p>
                  </div>
                  
                  {patient.gender && (
                    <div>
                      <p className="text-xs text-slate-500">Gender</p>
                      <p className="font-medium text-slate-900 capitalize">{patient.gender}</p>
                    </div>
                  )}
                  
                  {patient.blood_group && (
                    <div>
                      <p className="text-xs text-slate-500">Blood Group</p>
                      <p className="font-medium text-slate-900">{patient.blood_group}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-slate-500">DID</p>
                    <p className="font-mono text-xs text-slate-600 break-all">{patient.did}</p>
                  </div>
                </div>

                <div className="border-t border-green-200 pt-3 space-y-2">
                  <Button 
                    onClick={handleViewProfile}
                    className="w-full"
                  >
                    <span className="material-symbols-outlined mr-2 text-base">person</span>
                    View Patient Profile
                  </Button>
                  <Button 
                    onClick={handleRecordVital}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <span className="material-symbols-outlined mr-2 text-base">vitals</span>
                    Record Vital Signs
                  </Button>
                  <Button 
                    onClick={handleReset}
                    variant="secondary"
                    className="w-full"
                  >
                    Scan Another Patient
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {loading && (
            <Card className="p-6 text-center">
              <div className="inline-flex items-center gap-2 text-slate-600">
                <div className="animate-spin">⌛</div>
                <span>Searching...</span>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Camera Support Info */}
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">📱 Quick Tip</p>
        <p className="mt-1">For best results on mobile devices, hold the phone steady and point the camera at the QR code from about 6 inches away.</p>
      </div>
    </div>
  )
}
