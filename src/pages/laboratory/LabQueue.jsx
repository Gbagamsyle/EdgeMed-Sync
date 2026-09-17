import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, FlaskConical, RefreshCw } from 'lucide-react'
import { getLabQueue } from '../../services/labService'

export default function LabQueue() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadQueue = async () => {
    setLoading(true)
    setError('')

    try {
      const payload = await getLabQueue()
      setRequests(payload.requests || [])
    } catch (requestError) {
      setError(requestError.message || 'Unable to load laboratory requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadQueue()
  }, [])

  return (
    <div className="space-y-7">
      <header className="rounded-[1.75rem] bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-600 px-6 py-7 text-white shadow-[0_22px_55px_-28px_rgba(14,116,144,0.65)] sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-100">
              <FlaskConical className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Laboratory workspace</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Pending requests</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-sky-50">Review doctor-authorized investigations and open a request to record the completed test.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold backdrop-blur">
            <ClipboardList className="h-4 w-4" />
            {requests.length} awaiting work
          </div>
        </div>
      </header>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-bold text-slate-950">Technician queue</p>
          <button
            type="button"
            onClick={loadQueue}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-400 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error ? <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

        {loading ? <p className="mt-5 text-sm text-slate-500">Loading laboratory requests…</p> : requests.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <FlaskConical className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-700">No pending requests</p>
            <p className="mt-1 text-sm text-slate-500">New doctor-authorized investigations will appear here.</p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-slate-100">
            {requests.map((request) => (
              <Link
                key={request.id}
                to={`/dashboard/laboratory/${request.id}`}
                className="group flex items-center justify-between gap-4 py-5 first:pt-0 last:pb-0 focus:outline-none"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-950">{request.patient?.full_name || 'Patient'}</p>
                    <p className="mt-1 text-sm text-slate-600">{request.test_name} <span className="text-slate-300">·</span> {request.test_category}</p>
                    <p className="mt-1 text-xs text-slate-500">Requested by {request.requester?.full_name || 'doctor'} · {new Date(request.requested_at).toLocaleString()}</p>
                    {request.clinical_notes ? <p className="mt-2 max-w-2xl text-sm text-slate-500">{request.clinical_notes}</p> : null}
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-700 transition group-hover:bg-sky-100">
                  Open request
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
