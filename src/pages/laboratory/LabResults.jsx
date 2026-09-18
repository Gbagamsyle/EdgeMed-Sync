import { useEffect, useState } from 'react'
import { ClipboardList, FlaskConical } from 'lucide-react'
import { getLabResults } from '../../services/labService'

export default function LabResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getLabResults().then((payload) => setResults(payload.results || [])).catch((resultError) => setError(resultError.message)).finally(() => setLoading(false))
  }, [])

  return <div className="space-y-7"><header className="rounded-[1.75rem] bg-gradient-to-br from-sky-700 to-cyan-600 p-7 text-white shadow-sm"><div className="flex items-center gap-3"><ClipboardList className="h-6 w-6" /><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">Laboratory workspace</p><h1 className="mt-1 text-3xl font-bold">Test results</h1><p className="mt-2 text-sm text-sky-50">Review results submitted by this laboratory workstation.</p></div></div></header><section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7"><div className="flex items-center gap-2 border-b border-slate-100 pb-4"><FlaskConical className="h-5 w-5 text-cyan-700" /><h2 className="font-bold text-slate-950">Completed results</h2></div>{error ? <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}{loading ? <p className="mt-5 text-sm text-slate-500">Loading results…</p> : results.length === 0 ? <p className="mt-5 text-sm text-slate-500">No results have been submitted yet.</p> : <div className="mt-5 divide-y divide-slate-100">{results.map((result) => <article key={result.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-slate-950">{result.patient?.full_name || 'Patient'}</p><p className="mt-1 text-sm text-slate-600">{result.test_name} · {result.result_value} {result.unit || ''}</p><p className="mt-1 text-xs text-slate-500">{new Date(result.created_at).toLocaleString()}</p></div><span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase text-emerald-700">{result.status}</span></article>)}</div>}</section></div>
}
