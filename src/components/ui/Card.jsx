export default function Card({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <div>{children}</div>
    </div>
  )
}
