export default function Card({ title, children }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_15px_60px_-24px_rgba(15,23,42,0.22)]">
      <h3 className="mb-4 text-xl font-semibold text-slate-900">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
