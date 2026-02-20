import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'STUDENT' | 'REVIEWER' | 'ADMIN'>('STUDENT')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await register({ email, name, password, role })
      navigate('/profile')
    } catch (err) {
      setError(apiClient.getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'radial-gradient(ellipse at 40% 0%, rgb(6 182 212 / 0.1) 0%, rgb(10 11 18) 55%)',
      }}
    >
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'linear-gradient(135deg, rgb(139 92 246), rgb(6 182 212))',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                boxShadow: '0 0 20px rgb(139 92 246 / 0.4)',
              }}
            >
              ✦
            </div>
            <span className="text-xl font-bold gradient-text">XPUni</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(226 232 240)' }}>Create Account</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgb(100 116 139)' }}>Join the on-chain rewards platform</p>
        </div>

        <div className="card p-8 space-y-5">
          {error && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-lg text-sm"
              style={{ background: 'rgb(239 68 68 / 0.08)', border: '1px solid rgb(239 68 68 / 0.3)', color: 'rgb(239 68 68)' }}
            >
              <span>✗</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Your Name" required disabled={loading} />
            </div>

            <div>
              <label className="label-field">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required disabled={loading} />
            </div>

            <div>
              <label className="label-field">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="input-field" disabled={loading}>
                <option value="STUDENT">Student</option>
                <option value="REVIEWER">Reviewer</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div>
              <label className="label-field">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required disabled={loading} />
            </div>

            <div>
              <label className="label-field">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" placeholder="••••••••" required disabled={loading} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
              style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating Account…' : 'Create Account →'}
            </button>
          </form>

          <div className="text-center text-sm" style={{ color: 'rgb(100 116 139)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'rgb(139 92 246)' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
