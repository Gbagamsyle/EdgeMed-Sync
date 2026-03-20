export default function Button({ children, ...props }) {
  return (
    <button
      className="w-full rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/40 transition duration-200 hover:-translate-y-0.5 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:bg-sky-300"
      {...props}
    >
      {children}
    </button>
  )
}
