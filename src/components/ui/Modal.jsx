export default function Modal({ title, children, open, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded p-4 w-[90vw] max-w-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="font-bold">x</button>
        </div>
        {children}
      </div>
    </div>
  )
}
