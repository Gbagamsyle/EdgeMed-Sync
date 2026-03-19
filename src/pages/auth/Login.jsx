import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: replace with auth logic
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold mb-4">Log in</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
        <Button type="submit">Login</Button>
      </form>
      <p className="mt-4">
        Need an account? <Link to="/auth/register" className="text-blue-600 hover:underline">Register</Link>
      </p>
    </div>
  )
}
