/**
 * Signature Verification Component
 * Displays signature authenticity status for medical records
 * Shows which records have been verified and their validation status
 */

import { useState } from 'react'

export default function SignatureVerification({ records = [] }) {
  const [verificationStatus, setVerificationStatus] = useState({})
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  /**
   * Verify signature of a single record
   */
  const verifyRecord = async (recordId, patientId) => {
    setLoading(true)
    try {
      const response = await fetch('/api/records/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: recordId, patient_id: patientId })
      })

      const result = await response.json()
      setVerificationStatus(prev => ({
        ...prev,
        [recordId]: result
      }))
    } catch (err) {
      console.error('Verification error:', err)
      setVerificationStatus(prev => ({
        ...prev,
        [recordId]: { valid: false, error: err.message }
      }))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Verify all records at once
   */
  const verifyAllRecords = async () => {
    if (records.length === 0) return

    setLoading(true)
    try {
      const recordIds = records.map(r => r.record_id)
      const response = await fetch('/api/records/verify-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_ids: recordIds })
      })

      const result = await response.json()
      const statusMap = {}
      result.results?.forEach(r => {
        statusMap[r.record_id] = r
      })
      setVerificationStatus(statusMap)
    } catch (err) {
      console.error('Batch verification error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get status badge based on verification result
   */
  const getStatusBadge = (recordId) => {
    const status = verificationStatus[recordId]

    if (!status) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          Unverified
        </div>
      )
    }

    if (status.valid === true) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          ✓ Verified Authentic
        </div>
      )
    }

    if (status.valid === false) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-semibold">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          ✗ Invalid Signature
        </div>
      )
    }

    // Unknown or no signature
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
        No Signature
      </div>
    )
  }

  // Summary stats
  const totalRecords = records.length
  const verifiedCount = Object.values(verificationStatus).filter(s => s.valid === true).length
  const invalidCount = Object.values(verificationStatus).filter(s => s.valid === false).length
  const unverifiedCount = totalRecords - Object.keys(verificationStatus).length

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🔐 Signature Verification</h3>
          <p className="text-sm text-gray-600 mt-1">Post-quantum cryptographic signature authenticity</p>
        </div>
        <button
          onClick={verifyAllRecords}
          disabled={loading || records.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded font-medium transition"
        >
          {loading ? 'Verifying...' : 'Verify All'}
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded p-4">
          <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
          <div className="text-sm text-gray-600">Total Records</div>
        </div>
        <div className="bg-green-50 rounded p-4">
          <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
          <div className="text-sm text-gray-600">Verified Authentic</div>
        </div>
        <div className="bg-red-50 rounded p-4">
          <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
          <div className="text-sm text-gray-600">Invalid Signatures</div>
        </div>
        <div className="bg-yellow-50 rounded p-4">
          <div className="text-2xl font-bold text-yellow-600">{unverifiedCount}</div>
          <div className="text-sm text-gray-600">Unverified</div>
        </div>
      </div>

      {/* Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-4"
      >
        {showDetails ? '▼' : '▶'} Show Details
      </button>

      {/* Detailed List */}
      {showDetails && (
        <div className="border-t pt-4">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {records.map(record => (
              <div
                key={record.record_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <div className="font-mono text-xs text-gray-500">{record.record_id}</div>
                  <div className="text-sm text-gray-700">
                    {new Date(record.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(record.record_id)}

                  {!verificationStatus[record.record_id] && (
                    <button
                      onClick={() => verifyRecord(record.record_id, record.patient_id)}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 rounded transition"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No records to verify</p>
        </div>
      )}

      {/* Information Box */}
      <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
        <div className="text-sm text-gray-700">
          <p className="font-semibold text-blue-900 mb-2">ℹ️ About Signature Verification</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Verified Authentic:</strong> Signature is valid—record has not been tampered with</li>
            <li><strong>Invalid Signature:</strong> Signature verification failed—possible tampering detected</li>
            <li><strong>No Signature:</strong> Record created before signing was enabled</li>
            <li><strong>Algorithm:</strong> Using Dilithium3 (post-quantum cryptography) for 30+ year security</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
