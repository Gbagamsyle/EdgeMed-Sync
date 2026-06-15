import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPatientById } from '../../services/patientService'

export default function QRScanner({ onDetected } = {}) {
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [foundPatient, setFoundPatient] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let stream = null
    let rafId = null
    let detector = null

    const stopStream = () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
        stream = null
      }
      setScanning(false)
    }

    const start = async () => {
      setError('')
      setResult(null)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported in this browser.')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        if ('BarcodeDetector' in window) {
          try {
            detector = new BarcodeDetector({ formats: ['qr_code'] })
          } catch (err) {
            detector = null
          }
        }

        if (!detector) {
          setError('BarcodeDetector API not available. Use image upload fallback.')
          setScanning(true)
          return
        }

        setScanning(true)

        const scan = async () => {
          try {
            const codes = await detector.detect(videoRef.current)
            if (codes && codes.length) {
                const value = codes[0].rawValue || codes[0].raw_data || codes[0].raw
                setResult(value)
                onDetected?.(value)
                // lookup patient by id (common QR encodes patient id)
                try {
                  const { data, error } = await getPatientById(value)
                  if (!error && data) setFoundPatient(data)
                } catch (e) {
                  // ignore
                }
                stopStream()
                return
              }
          } catch (e) {
            // ignore detection errors
          }
          rafId = requestAnimationFrame(scan)
        }

        rafId = requestAnimationFrame(scan)
      } catch (err) {
        setError(err.message || String(err))
      }
    }

    start()
    return () => stopStream()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFile = async (e) => {
    const file = e?.target?.files && e.target.files[0]
    if (!file) return
    setError('')
    setResult(null)

    try {
      // try BarcodeDetector first
      if ('BarcodeDetector' in window) {
        try {
          const imgBitmap = await createImageBitmap(file)
          const detector = new BarcodeDetector({ formats: ['qr_code'] })
          const codes = await detector.detect(imgBitmap)
          if (codes && codes.length) {
            const value = codes[0].rawValue || codes[0].raw_data || codes[0].raw
            setResult(value)
            onDetected?.(value)
            try {
              const { data, error } = await getPatientById(value)
              if (!error && data) setFoundPatient(data)
            } catch (e) {}
            return
          }
        } catch (err) {
          // fallthrough to jsQR fallback
        }
      }

      // Fallback: dynamic load jsQR and decode via canvas
      if (!window.jsQR) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://unpkg.com/jsqr/dist/jsQR.js'
          s.onload = resolve
          s.onerror = () => reject(new Error('Failed to load jsQR'))
          document.head.appendChild(s)
        })
      }

      const img = new Image()
      const objUrl = URL.createObjectURL(file)
      img.src = objUrl
      await new Promise((res) => (img.onload = res))
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = window.jsQR(imageData.data, canvas.width, canvas.height)
      if (code && code.data) {
        const value = code.data
        setResult(value)
        onDetected?.(value)
        try {
          const { data, error } = await getPatientById(value)
          if (!error && data) setFoundPatient(data)
        } catch (e) {}
      } else {
        setError('No QR code found in image')
      }
      // release object URL
      URL.revokeObjectURL(objUrl)
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black/5">
        <video ref={videoRef} className="w-full h-60 object-cover bg-black" playsInline muted />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Restart Camera
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white hover:shadow"
          >
            Upload image
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      </div>

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Detected: {result}</div>
      )}
      {foundPatient && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">{foundPatient.full_name}</div>
              <div className="text-xs text-slate-500">{foundPatient.phone || foundPatient.email || ''}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/dashboard/patients/${foundPatient.id}`)}
                className="rounded-md border border-slate-200 px-3 py-1 text-sm"
              >
                View Profile
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/vitals', { state: { selectedPatientId: foundPatient.id } })}
                className="rounded-md bg-sky-600 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Open Vitals
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}

      <div className="text-xs text-slate-500">Tip: allow camera access and point the camera at the QR code.</div>
    </div>
  )
}
