import { useEffect, useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { BACKEND_URL } from '../../services/config'
import Card from '../../components/ui/Card'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [summary, setSummary] = useState({ total: 0, today: 0, unique_staff: 0, unique_patients: 0 })
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [offset, setOffset] = useState(0)
  const [signatureStatus, setSignatureStatus] = useState({})
  const [verifyingRecords, setVerifyingRecords] = useState(new Set())
  const pageSize = 50

  const loadLogs = async (filters = {}, isLoadMore = false) => {
    setLoading(true)
    try {
      const session = await supabase.auth.getSession()
      const token = session.data?.session?.access_token

      const params = new URLSearchParams()
      params.set('limit', pageSize.toString())
      params.set('offset', isLoadMore ? (offset + pageSize).toString() : '0')
      if (filters.patient_id) params.set('patient_id', filters.patient_id)
      if (filters.staff_id) params.set('staff_id', filters.staff_id)
      if (filters.start) params.set('start', filters.start)
      if (filters.end) params.set('end', filters.end)

      const url = `${BACKEND_URL}/api/audit/logs?${params.toString()}`
      const resp = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      })

      if (!resp.ok) {
        console.error('Failed to fetch audit logs', await resp.text())
        if (!isLoadMore) setLogs([])
        setLoading(false)
        return
      }

      const data = await resp.json()
      const newLogs = data.logs || []

      // Sort logs client-side
      newLogs.sort((a, b) => {
        let aVal = a[sortBy]
        let bVal = b[sortBy]
        
        if (sortBy === 'created_at') {
          aVal = new Date(aVal)
          bVal = new Date(bVal)
        }
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })

      if (isLoadMore) {
        setLogs([...logs, ...newLogs])
        setOffset(offset + pageSize)
      } else {
        setLogs(newLogs)
        setOffset(0)
      }

      // Calculate summary (only on first load)
      if (!isLoadMore) {
        const today = new Date().toDateString()
        const todayLogs = newLogs.filter(l => new Date(l.created_at).toDateString() === today)
        const uniqueStaff = new Set(newLogs.map(l => l.staff_id).filter(Boolean))
        const uniquePatients = new Set(newLogs.map(l => l.patient_id).filter(Boolean))
        setSummary({
          total: newLogs.length,
          today: todayLogs.length,
          unique_staff: uniqueStaff.size,
          unique_patients: uniquePatients.size
        })
      }
    } catch (err) {
      console.error('Audit logs load error', err)
      if (!isLoadMore) setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  /**
   * Verify signature for a record
   */
  const verifyRecordSignature = async (recordId, patientId) => {
    if (verifyingRecords.has(recordId)) return

    setVerifyingRecords(prev => new Set([...prev, recordId]))
    try {
      const response = await fetch('/api/records/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: recordId, patient_id: patientId })
      })

      const result = await response.json()
      setSignatureStatus(prev => ({
        ...prev,
        [recordId]: result
      }))
    } catch (err) {
      console.error('Signature verification error:', err)
      setSignatureStatus(prev => ({
        ...prev,
        [recordId]: { valid: false, error: err.message }
      }))
    } finally {
      setVerifyingRecords(prev => {
        const updated = new Set(prev)
        updated.delete(recordId)
        return updated
      })
    }
  }

  /**
   * Get signature status badge
   */
  const getSignatureBadge = (recordId, patientId, isVerifying) => {
    const status = signatureStatus[recordId]

    if (isVerifying) {
      return <span className="inline-flex items-center gap-1 text-xs text-gray-600">⟳ Verifying...</span>
    }

    if (!status) {
      return (
        <button
          onClick={() => verifyRecordSignature(recordId, patientId)}
          className="text-xs text-blue-600 hover:text-blue-700 underline"
        >
          Verify
        </button>
      )
    }

    if (status.valid === true) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold">✓ Valid</span>
    }

    if (status.valid === false) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-semibold">✗ Invalid</span>
    }

    return <span className="inline-flex items-center gap-1 text-xs text-gray-600">- No Sig</span>
  }

  useEffect(() => {
    void loadLogs()
  }, [])

  const handleApply = async (e) => {
    e?.preventDefault()
    const filters = {
      patient_id: patientId || undefined,
      staff_id: staffId || undefined,
      start: startDate ? new Date(startDate).toISOString() : undefined,
      end: endDate ? new Date(endDate).toISOString() : undefined
    }
    await loadLogs(filters)
  }

  const handleReset = async () => {
    setPatientId('')
    setStaffId('')
    setStartDate('')
    setEndDate('')
    await loadLogs()
  }

  return (
    <div className="space-y-6">
      {/* Summary metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-medium">TOTAL LOGS</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.total}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-medium">TODAY</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.today}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-medium">UNIQUE STAFF</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.unique_staff}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 font-medium">UNIQUE PATIENTS</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.unique_patients}</p>
        </div>
      </div>

      {/* Filter panel */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Filters</h3>
          <button onClick={() => setShowFilters(!showFilters)} className="text-xs text-sky-600 hover:underline">
            {showFilters ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showFilters && (
          <form onSubmit={handleApply} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Patient ID</label>
                <input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="e.g., patient-123" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Staff ID</label>
                <input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="e.g., staff-456" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Start date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">End date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none" />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <button type="submit" className="rounded-lg bg-sky-600 hover:bg-sky-700 px-4 py-2 text-white text-sm font-medium transition">
                Apply Filters
              </button>
              <button type="button" onClick={handleReset} className="rounded-lg border border-slate-300 hover:bg-slate-50 px-4 py-2 text-slate-700 text-sm font-medium transition">
                Reset
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* Logs table */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Activity Log</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-slate-600">
                <div className="animate-spin">⌛</div>
                <span>Loading audit logs...</span>
              </div>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <p className="text-slate-500 text-sm">No audit logs found</p>
            </div>
          </div>
        ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b">
                <th className="p-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('created_at')}>
                  Time {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('event_type')}>
                  Event {sortBy === 'event_type' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('patient_id')}>
                  Patient {sortBy === 'patient_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('staff_name')}>
                  Staff {sortBy === 'staff_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3 font-semibold text-slate-700">Signature</th>
                <th className="p-3 font-semibold text-slate-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, idx) => (
                <tr key={l.id} className={`border-b hover:bg-slate-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="p-3 text-xs text-slate-600">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="p-3"><span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">{l.event_type}</span></td>
                  <td className="p-3 align-top">
                    <div className="font-medium text-slate-900">{l.patient_id}</div>
                    <div className="text-xs text-slate-500 font-mono">{l.patient_did}</div>
                  </td>
                  <td className="p-3">{l.staff_name ? <div><div className="font-medium text-slate-900">{l.staff_name}</div><div className="text-xs text-slate-500">{l.staff_id}</div></div> : <span className="text-slate-500 text-xs">-</span>}</td>
                  <td className="p-3">{getSignatureBadge(l.record_id || l.id, l.patient_id, verifyingRecords.has(l.record_id || l.id))}</td>
                  <td className="p-3 text-xs"><pre className="whitespace-pre-wrap bg-slate-50 p-1 rounded text-slate-600">{l.details || '-'}</pre></td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length > 0 && (
            <div className="mt-4 flex justify-center">
              <button onClick={() => loadLogs({}, true)} disabled={loading} className="rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 px-4 py-2 text-sm font-medium transition">
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
        )}
      </Card>
    </div>
  )
}
