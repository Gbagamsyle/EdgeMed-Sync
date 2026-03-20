import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { supabase } from '../../services/supabaseClient'

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'receptionist'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const passwordStrengthScore = () => {
    const pass = form.password
    let score = 0
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1
    return score
  }

  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-600']

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setMessage(null)

    if (!form.fullName.trim()) {
      setMessage({ type: 'error', text: 'Please enter your full name.' })
      return
    }
    if (!form.email.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' })
      return
    }
    if (form.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }

    if (!acceptTerms) {
      setMessage({ type: 'error', text: 'Please agree to terms and privacy policy.' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: form.role
        }
      }
    })
    setLoading(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      return
    }

    setMessage({ type: 'success', text: 'Account created successfully! Check your email to verify your account.' })
    setTimeout(() => navigate('/auth/login'), 1400)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-700 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl md:flex-row md:divide-x md:divide-white/20">
        <aside className="flex flex-1 flex-col justify-center gap-6 px-8 py-10 text-center md:px-14">
          <div className="mx-auto max-w-xs">
            <h1 className="text-4xl font-extrabold leading-tight text-white">Join EdgeMed Connect</h1>
            <p className="mt-4 text-sm text-slate-200">Modern, secure Hospital operations for triage, scheduling, and analytics.</p>
          </div>
          <div className="mx-auto flex max-w-xs justify-center gap-3">
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100">HIPAA-ready</span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100">2FA support</span>
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100">Role-based</span>
          </div>
        </aside>

        <section className="flex flex-1 items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white p-6 shadow-lg shadow-slate-900/30 md:p-8">
            <h2 className="text-center text-3xl font-extrabold !text-slate-900">Register your account</h2>
            <p className="mt-2 text-center text-sm text-slate-600">Use your clinic email to get started quickly.</p>

            <form className="mt-6 space-y-4" onSubmit={handleRegister}>
              <Input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                type="text"
                required
              />
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                type="email"
                required
              />

              <div className="relative">
                <Input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <div>
                <div className="mb-1 text-xs font-medium text-slate-600">Password strength</div>
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div
                    className={`h-2 rounded-full ${strengthColors[passwordStrengthScore()]} transition-all duration-300`}
                    style={{ width: `${(passwordStrengthScore() / 4) * 100}%` }}
                  />
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-600">
                  {form.password ? strengthLabels[passwordStrengthScore()] : 'Type a password'}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700" htmlFor="role">
                  Select role
                </label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-150 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="receptionist">🧑‍💼 Receptionist</option>
                  <option value="doctor">🩺 Doctor</option>
                  <option value="admin">🛡️ Admin</option>
                </select>
              </div>

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                />
                <span>
                  I agree to the{' '}
                  <a href="#" className="font-semibold text-sky-600 hover:text-sky-700" onClick={(e) => e.preventDefault()}>
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="#" className="font-semibold text-sky-600 hover:text-sky-700" onClick={(e) => e.preventDefault()}>
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

              {message && <p className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>{message.text}</p>}

              <Button type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already registered?{' '}
              <Link to="/auth/login" className="font-semibold text-sky-600 hover:text-sky-700">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
