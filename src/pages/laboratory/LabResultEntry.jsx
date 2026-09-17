import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, FlaskConical } from 'lucide-react'
import { getLabRequest, submitLabResult } from '../../services/labService'

const emptyForm = { result_value: '', unit: '', reference_range: '', status: 'normal', notes: '' }

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'

export default function LabResultEntry() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRequest = async () => {
      try {
        const payload = await getLabRequest(requestId)
        setRequest(payload.request)
      } catch (requestError) {
        setError(requestError.message || 'Unable to load this laboratory request.')
      } finally {
        setLoading(false)
      }
    }

    void loadRequest()
  }, [requestId])

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      await submitLabResult(requestId, form)
      navigate('/dashboard/laboratory', { state: { message: 'Result submitted successfully.' } })
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit this result.')
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading laboratory request…</p>

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link to="/dashboard/laboratory" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-sky-700">
        <ArrowLeft className="h-4 w-4" />
        Back to laboratory queue
      </Link>

      {error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      {request ? (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-600 px-5 py-4 text-white sm:px-7">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0"><div className="flex items-center gap-2 text-cyan-100"><ClipboardList className="h-3.5 w-3.5" /><p className="text-[9px] font-bold uppercase tracking-[0.18em]">Request context</p></div><h1 className="mt-1.5 truncate text-2xl font-bold tracking-tight text-white">{request.patient?.full_name || 'Patient'}</h1><p className="mt-0.5 text-xs text-sky-50">Laboratory test assignment</p></div>
                <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"><FlaskConical className="h-3 w-3" /> Awaiting result</span>
              </div>
            </div>
            <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-4 sm:px-6"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Requested test</p><p className="mt-1.5 text-sm font-bold text-slate-950">{request.test_name}</p><p className="mt-0.5 text-xs capitalize text-slate-500">{request.test_category}</p></div>
              <div className="p-4 sm:px-6"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Requested by</p><p className="mt-1.5 text-sm font-bold text-slate-950">{request.requester?.full_name || 'Doctor'}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(request.requested_at).toLocaleString()}</p></div>
              <div className="flex items-center gap-2.5 p-4 sm:px-6"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700"><FlaskConical className="h-3.5 w-3.5" /></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Next step</p><p className="mt-0.5 text-xs font-semibold text-slate-800">Enter verified findings below</p></div></div>
            </div>
            {request.clinical_notes ? <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-7"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Clinical notes from doctor</p><p className="mt-1 text-sm leading-6 text-slate-700">{request.clinical_notes}</p></div> : null}
          </section>

          <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between"><div className="border-l-4 border-cyan-600 pl-4"><h2 className="font-bold text-slate-950">Test result details</h2><p className="mt-1 text-sm text-slate-500">Record the verified findings for the requesting doctor.</p></div><span className="text-xs text-slate-400">Required result <span className="text-rose-600">*</span></span></div>

            <div className="mt-6 space-y-6">
              <section className="space-y-2" aria-labelledby="primary-finding-heading"><div><h3 id="primary-finding-heading" className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">01 · Primary finding</h3><p className="mt-1 text-xs text-slate-500">Enter the result exactly as observed during testing.</p></div><label className="block"><span className="sr-only">Observed result</span><textarea name="result_value" value={form.result_value} onChange={updateForm} required rows="6" placeholder="Enter values, interpretation, or positive/negative finding" className={`${inputClass} resize-y text-base leading-7`} /></label></section>
              <section className="space-y-3 border-t border-slate-100 pt-5" aria-labelledby="measurement-details-heading"><div><h3 id="measurement-details-heading" className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">02 · Measurement details</h3><p className="mt-1 text-xs text-slate-500">Add the values needed to interpret this finding.</p></div><div className="grid gap-4 md:grid-cols-3"><label className="space-y-2"><span className="text-sm font-semibold text-slate-700">Unit</span><input name="unit" value={form.unit} onChange={updateForm} placeholder="e.g. mmol/L" className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-semibold text-slate-700">Reference range</span><input name="reference_range" value={form.reference_range} onChange={updateForm} placeholder="e.g. 4.0–6.0" className={inputClass} /></label><label className="space-y-2"><span className="text-sm font-semibold text-slate-700">Result status</span><select name="status" value={form.status} onChange={updateForm} className={`${inputClass} capitalize`}>{['normal', 'abnormal', 'critical', 'positive', 'negative'].map((status) => <option key={status} value={status}>{status}</option>)}</select></label></div></section>
              <section className="space-y-2 border-t border-slate-100 pt-5" aria-labelledby="technician-notes-heading"><div><h3 id="technician-notes-heading" className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">03 · Technician notes</h3><p className="mt-1 text-xs text-slate-500">Add method details, observations, or anything the doctor should review.</p></div><label className="block"><span className="sr-only">Technician notes</span><textarea name="notes" value={form.notes} onChange={updateForm} rows="4" placeholder="Add notes for the patient record" className={`${inputClass} resize-y`} /></label></section>
            </div>

            <div className="mt-7 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-slate-500">Review all values before submitting. The result will be attached to the patient record.</p><div className="flex flex-col-reverse gap-3 sm:flex-row"><Link to="/dashboard/laboratory" className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">Cancel</Link><button type="submit" disabled={saving} className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Submitting result…' : 'Submit result'}</button></div></div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
