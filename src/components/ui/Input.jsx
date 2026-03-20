export default function Input(props) {
  return (
    <input
      className="w-full rounded-lg border border-slate-400 bg-white px-4 py-3 text-sm text-black placeholder:text-slate-500 outline-none transition duration-150 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
      {...props}
    />
  )
}
