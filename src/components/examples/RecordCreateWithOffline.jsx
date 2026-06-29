import React, { useState } from 'react'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { useAuth } from '../context/AuthContext'
import { BACKEND_URL } from '../../services/config'

/**
 * Example: Offline Record Creation with Queue
 * 
 * This component demonstrates:
 * - Creating records with offline fallback
 * - Showing sync status and queue stats
 * - Retrying failed records
 * - Manual sync trigger
 */
export const RecordCreateWithOffline = ({ patientId }) => {
  const { profile } = useAuth()
  const {
    isOnline,
    syncStats,
    pendingCount,
    syncInProgress,
    queueRecord,
    getFailedRecords,
    retryFailed,
    manualSync
  } = useOfflineSync()

  const [formData, setFormData] = useState({
    vitals: { temperature: '', bloodPressure: '', heartRate: '' },
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failedRecords, setFailedRecords] = useState([])
  const [showFailedList, setShowFailedList] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const session = await profile?.session
      const token = session?.access_token

      // Prepare record data
      const recordData = {
        patientId,
        payload: {
          patientId,
          vitals: formData.vitals,
          notes: formData.notes,
          createdAt: new Date().toISOString(),
          staffId: profile?.id
        },
        token,
        backendUrl: BACKEND_URL,
        endpoint: '/api/records/create'
      }

      // Try to queue/send record
      if (isOnline) {
        // Try to send directly (with fallback to offline queue on failure)
        try {
          const response = await fetch(`${BACKEND_URL}/api/records/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify(recordData.payload),
            timeout: 5000
          })

          if (response.ok) {
            alert('Record saved successfully!')
            setFormData({ vitals: { temperature: '', bloodPressure: '', heartRate: '' }, notes: '' })
          } else {
            // Fallback: queue for offline sync
            await queueRecord(recordData)
            alert('Record queued for sync (network issue)')
          }
        } catch (err) {
          // Network error: queue for offline sync
          console.error('Network error, queuing record', err)
          await queueRecord(recordData)
          alert('Network error - record queued for offline sync')
        }
      } else {
        // Offline: queue record
        await queueRecord(recordData)
        alert('You are offline - record queued for sync when back online')
      }
    } catch (err) {
      console.error('Record creation error', err)
      alert('Failed to create record: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetryFailed = async () => {
    try {
      await retryFailed()
      setShowFailedList(false)
      alert('Failed records queued for retry')
    } catch (err) {
      alert('Error retrying failed records: ' + err.message)
    }
  }

  const handleShowFailed = async () => {
    try {
      const failed = await getFailedRecords()
      setFailedRecords(failed)
      setShowFailedList(true)
    } catch (err) {
      alert('Error loading failed records: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Network Status Banner */}
      <div className={`rounded-lg p-4 ${isOnline ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${isOnline ? 'text-green-900' : 'text-amber-900'}`}>
              {isOnline ? '✓ Online' : '⚠ Offline Mode'}
            </h3>
            <p className={`text-sm ${isOnline ? 'text-green-700' : 'text-amber-700'}`}>
              {isOnline ? 'Connected to server' : 'Records will be queued for sync when online'}
            </p>
          </div>
          {!isOnline && (
            <button
              onClick={manualSync}
              disabled={syncInProgress}
              className="rounded bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {syncInProgress ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
      </div>

      {/* Queue Status */}
      {pendingCount > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Pending Records: {pendingCount}</h3>
              <p className="text-sm text-blue-700">
                {syncStats.pending} pending, {syncStats.failed} failed
              </p>
            </div>
            <div className="flex gap-2">
              {syncStats.failed > 0 && (
                <button
                  onClick={handleShowFailed}
                  className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  View Failed
                </button>
              )}
              <button
                onClick={manualSync}
                disabled={syncInProgress}
                className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {syncInProgress ? 'Syncing...' : 'Sync All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Create Record</h2>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              value={formData.vitals.temperature}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vitals: { ...formData.vitals, temperature: e.target.value }
                })
              }
              className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="36.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Blood Pressure</label>
            <input
              type="text"
              value={formData.vitals.bloodPressure}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vitals: { ...formData.vitals, bloodPressure: e.target.value }
                })
              }
              className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="120/80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Heart Rate (bpm)</label>
            <input
              type="number"
              value={formData.vitals.heartRate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vitals: { ...formData.vitals, heartRate: e.target.value }
                })
              }
              className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="72"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            rows="3"
            placeholder="Additional clinical notes..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Record'}
        </button>
      </form>

      {/* Failed Records Modal */}
      {showFailedList && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-red-900">Failed Records ({failedRecords.length})</h3>

          {failedRecords.length === 0 ? (
            <p className="text-sm text-red-700">No failed records</p>
          ) : (
            <div className="mb-4 space-y-2">
              {failedRecords.map((record) => (
                <div key={record.id} className="rounded bg-white p-3">
                  <p className="text-sm font-medium text-slate-900">
                    Patient: {record.patientId}
                  </p>
                  <p className="text-xs text-slate-600">
                    Error: {record.lastError} (attempt {record.attempts})
                  </p>
                  <p className="text-xs text-slate-500">
                    Created: {new Date(record.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRetryFailed}
              className="rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Retry All Failed
            </button>
            <button
              onClick={() => setShowFailedList(false)}
              className="rounded bg-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecordCreateWithOffline
