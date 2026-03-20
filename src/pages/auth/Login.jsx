import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { supabase } from '../../services/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    setMessage({ type: 'success', text: 'Login successful! Redirecting...' })
    setTimeout(() => navigate('/dashboard'), 600)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-700 text-slate-50">
      <div className="mx-auto mt-16 flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl md:flex-row md:divide-x md:divide-white/20">
        <aside className="flex flex-1 flex-col justify-center gap-6 px-8 py-10 text-center md:px-14">
          <div className="mx-auto max-w-xs">
            <h1 className="text-4xl font-extrabold leading-tight text-white">Welcome Back</h1>
            <p className="mt-4 text-sm text-slate-200">Quick access for healthcare teams. Secure login with EdgeMed Sync.</p>
          </div>
          <div className="mx-auto flex max-w-xs justify-center gap-3">
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100">Secure</span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100">Encrypted</span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100">24/7</span>
          </div>
        </aside>

        <section className="flex flex-1 items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white p-6 shadow-lg shadow-slate-900/30 md:p-8">
            <h2 className="text-center text-3xl font-extrabold text-slate-900">Sign in to your account</h2>
            <p className="mt-2 text-center text-sm text-slate-600">Enter your email and password to continue.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
              <div>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
              </div>

              {message && <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>{message.text}</p>}

              <Button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Need an account?{' '}
              <Link to="/auth/register" className="font-semibold text-sky-600 hover:text-sky-700">Register</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
