import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: replace with real registration
    navigate('/auth/login')
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
        <Button type="submit">Register</Button>
      </form>
      <p className="mt-4">
        Already have an account? <Link to="/auth/login" className="text-blue-600 hover:underline">Login</Link>
      </p>
    </div>
  )
}
