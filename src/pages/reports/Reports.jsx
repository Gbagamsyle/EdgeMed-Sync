import { useEffect, useState } from 'react'
import AuditLogs from './AuditLogs'
import SignatureVerification from '../../components/reports/SignatureVerification'
import { BACKEND_URL } from '../../services/config'
import { supabase } from '../../services/supabaseClient'

export default function Reports() {
  const [activeTab, setActiveTab] = useState('audit')
  const [recordsForVerification, setRecordsForVerification] = useState([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState('')

  useEffect(() => {
    if (activeTab !== 'signatures' || recordsForVerification.length > 0) return

    const loadRecords = async () => {
      setRecordsLoading(true)
      setRecordsError('')

      try {
        const session = await supabase.auth.getSession()
        const token = session.data?.session?.access_token
        const response = await fetch(`${BACKEND_URL}/api/records?limit=100`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load records')
        }

        setRecordsForVerification(result.records || [])
      } catch (error) {
        setRecordsError(error.message)
      } finally {
        setRecordsLoading(false)
      }
    }

    void loadRecords()
  }, [activeTab, recordsForVerification.length])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reports & Compliance</h1>
        <p className="mt-1 text-sm text-slate-600">View activity logs, verify record authenticity, and ensure data integrity.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-3 font-medium text-sm transition ${
            activeTab === 'audit'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📋 Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('signatures')}
          className={`px-4 py-3 font-medium text-sm transition ${
            activeTab === 'signatures'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🔐 Signature Verification
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'audit' && <AuditLogs />}
      {activeTab === 'signatures' && (
        recordsLoading ? <p className="text-sm text-slate-600">Loading records...</p> :
        recordsError ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{recordsError}</p> :
        <SignatureVerification records={recordsForVerification} />
      )}
    </div>
  )
}
