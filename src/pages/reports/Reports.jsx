import { useState } from 'react'
import AuditLogs from './AuditLogs'
import SignatureVerification from '../../components/reports/SignatureVerification'

export default function Reports() {
  const [activeTab, setActiveTab] = useState('audit')
  const [recordsForVerification, setRecordsForVerification] = useState([])

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
      {activeTab === 'signatures' && <SignatureVerification records={recordsForVerification} />}
    </div>
  )
}
