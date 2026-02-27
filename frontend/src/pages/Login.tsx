import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login({ email, password })
      navigate('/profile')
    } catch (err) {
      setError(apiClient.getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at 60% 0%, rgb(139 92 246 / 0.12) 0%, rgb(10 11 18) 60%)',
      }}
    >
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2.5 mb-4"
          >
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
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(226 232 240)' }}>Welcome Back</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgb(100 116 139)' }}>Sign in to your account</p>
        </div>

        <div className="card p-8 space-y-6">
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
              <label className="label-field">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="label-field">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
              style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div className="text-center text-sm" style={{ color: 'rgb(100 116 139)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: 'rgb(139 92 246)' }}>
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
