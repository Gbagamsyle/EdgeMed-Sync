export default function Button({ children, variant = 'primary', disabled, ...props }) {
  const baseStyles = 'rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 focus:outline-none disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'w-full bg-sky-700 text-white shadow-lg shadow-sky-200/40 hover:-translate-y-0.5 hover:bg-sky-600 focus:ring-2 focus:ring-sky-300 disabled:bg-sky-300',
    secondary: 'w-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-slate-300 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400'
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.primary}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
