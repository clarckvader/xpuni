import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '@/services/api'
import StellarAddress from '@/components/StellarAddress'
import type { HealthResponse } from '@/types/api'

const FEATURES = [
  {
    icon: '⚡',
    title: 'On-Chain Achievements',
    desc: 'Every approved submission mints a verifiable badge on the Stellar blockchain.',
    color: 'rgb(139 92 246)',
  },
  {
    icon: '🎁',
    title: 'Token Rewards',
    desc: 'Earn XPU tokens for completing activities. Redeem them for real rewards.',
    color: 'rgb(6 182 212)',
  },
  {
    icon: '🔍',
    title: 'Fully Transparent',
    desc: 'All transactions are publicly verifiable on Stellar Expert explorer.',
    color: 'rgb(16 185 129)',
  },
  {
    icon: '💎',
    title: 'Soroban Smart Contracts',
    desc: 'Powered by Soroban — Stellar\'s high-performance smart contract platform.',
    color: 'rgb(245 158 11)',
  },
]

export default function LandingPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient.health()
      .then(setHealth)
      .catch(() => setError('Unable to connect to the backend.'))
      .finally(() => setLoading(false))
  }, [])

  const isHealthy = health?.status === 'ok' || health?.status === 'healthy'

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'rgb(10 11 18)',
        color: 'rgb(226 232 240)',
      }}
    >
      {/* Nav */}
      <nav
        style={{
          borderBottom: '1px solid rgb(39 43 65)',
          background: 'rgb(10 11 18 / 0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: '2rem',
                height: '2rem',
                background: 'linear-gradient(135deg, rgb(139 92 246), rgb(6 182 212))',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgb(139 92 246 / 0.4)',
                fontSize: '1rem',
              }}
            >
              ✦
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm gradient-text">XPUni</span>
              <span style={{ fontSize: '0.6rem', color: 'rgb(100 116 139)', letterSpacing: '0.1em' }}>ON STELLAR</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-ghost text-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        {/* Network badge */}
        <div className="flex justify-center mb-8">
          <span
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border"
            style={{
              background: 'rgb(16 185 129 / 0.08)',
              borderColor: 'rgb(16 185 129 / 0.3)',
              color: 'rgb(16 185 129)',
            }}
          >
            <span className="status-dot status-dot-online" />
            Live on Stellar Testnet
          </span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 text-balance"
          style={{ letterSpacing: '-0.02em' }}
        >
          <span style={{ color: 'rgb(226 232 240)' }}>Learn.</span>{' '}
          <span style={{ color: 'rgb(226 232 240)' }}>Earn.</span>{' '}
          <span className="gradient-text">On-chain.</span>
        </h1>

        <p
          className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-pretty"
          style={{ color: 'rgb(148 163 184)', lineHeight: 1.7 }}
        >
          XPUni gamifies learning with blockchain-verified achievements and token rewards
          built on the Stellar network.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/register" className="btn btn-primary text-base px-8 py-3">
            Create Account →
          </Link>
          <Link
            to="/login"
            className="btn text-base px-8 py-3"
            style={{
              border: '1px solid rgb(39 43 65)',
              color: 'rgb(148 163 184)',
              background: 'transparent',
            }}
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card p-6 space-y-3"
              style={{ borderColor: `${f.color}20` }}
            >
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  background: `${f.color}15`,
                  border: `1px solid ${f.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-sm" style={{ color: 'rgb(226 232 240)' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgb(100 116 139)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System status */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div
          className="card p-8"
          style={{ borderColor: 'rgb(39 43 65)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold" style={{ color: 'rgb(226 232 240)' }}>System Status</h2>
            {health && (
              <span
                className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border"
                style={{
                  background: isHealthy ? 'rgb(16 185 129 / 0.1)' : 'rgb(239 68 68 / 0.1)',
                  borderColor: isHealthy ? 'rgb(16 185 129 / 0.3)' : 'rgb(239 68 68 / 0.3)',
                  color: isHealthy ? 'rgb(16 185 129)' : 'rgb(239 68 68)',
                }}
              >
                <span className={`status-dot ${isHealthy ? 'status-dot-online' : 'status-dot-offline'}`} />
                {isHealthy ? 'Operational' : 'Degraded'}
              </span>
            )}
          </div>

          {loading && (
            <p className="text-sm" style={{ color: 'rgb(100 116 139)' }}>Checking connectivity…</p>
          )}

          {error && (
            <div
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{
                background: 'rgb(239 68 68 / 0.08)',
                border: '1px solid rgb(239 68 68 / 0.25)',
              }}
            >
              <span style={{ color: 'rgb(239 68 68)', marginTop: '0.1rem' }}>✗</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'rgb(239 68 68)' }}>Backend Unreachable</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(100 116 139)' }}>{error}</p>
              </div>
            </div>
          )}

          {health && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: 'rgb(26 29 44)' }}
              >
                <span className="text-sm" style={{ color: 'rgb(148 163 184)' }}>API</span>
                <div className="flex items-center gap-2">
                  <span className={`status-dot ${isHealthy ? 'status-dot-online' : 'status-dot-offline'}`} />
                  <span className="text-sm font-mono font-semibold" style={{ color: isHealthy ? 'rgb(16 185 129)' : 'rgb(239 68 68)' }}>
                    {health.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: 'rgb(26 29 44)' }}
              >
                <span className="text-sm" style={{ color: 'rgb(148 163 184)' }}>Database</span>
                <div className="flex items-center gap-2">
                  <span className={`status-dot ${health.database === 'connected' ? 'status-dot-online' : 'status-dot-offline'}`} />
                  <span className="text-sm font-mono font-semibold" style={{ color: health.database === 'connected' ? 'rgb(16 185 129)' : 'rgb(239 68 68)' }}>
                    {health.database}
                  </span>
                </div>
              </div>

              {health.rpc_available !== undefined && (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{ background: 'rgb(26 29 44)' }}
                >
                  <span className="text-sm" style={{ color: 'rgb(148 163 184)' }}>Stellar RPC</span>
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${health.rpc_available ? 'status-dot-online' : 'status-dot-offline'}`} />
                    <span className="text-sm font-mono font-semibold" style={{ color: health.rpc_available ? 'rgb(16 185 129)' : 'rgb(239 68 68)' }}>
                      {health.rpc_available ? 'Connected' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contract addresses */}
          {health?.contracts && (health.contracts.badge_issuer || health.contracts.token_admin) && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgb(39 43 65)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgb(100 116 139)' }}>
                Deployed Contracts
              </p>
              <div className="flex flex-wrap gap-4">
                {health.contracts.badge_issuer && (
                  <div>
                    <p className="label-field mb-1.5">Badge Issuer</p>
                    <StellarAddress address={health.contracts.badge_issuer} type="contract" testnet chars={6} />
                  </div>
                )}
                {health.contracts.token_admin && (
                  <div>
                    <p className="label-field mb-1.5">Token Admin</p>
                    <StellarAddress address={health.contracts.token_admin} type="contract" testnet chars={6} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-8 text-center text-xs"
        style={{ borderColor: 'rgb(39 43 65)', color: 'rgb(100 116 139)' }}
      >
        <p>XPUni · Built on Stellar · Powered by Soroban smart contracts</p>
      </footer>
    </div>
  )
}
