import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap,
  Gift,
  Eye,
  ArrowRight,
  Building2,
  Repeat2,
  ShieldCheck,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'
import { apiClient } from '@/services/api'
import StellarAddress from '@/components/StellarAddress'
import type { HealthResponse, Institution } from '@/types/api'

const FEATURES = [
  {
    icon: Zap,
    title: 'Verified Achievements',
    desc: 'Every approved activity earns a permanent, tamper-proof credential — no one can take it away.',
    color: 'rgb(139 92 246)',
  },
  {
    icon: Gift,
    title: 'Real Rewards',
    desc: 'Earn institution credits for completing activities. Redeem them for physical rewards and perks.',
    color: 'rgb(6 182 212)',
  },
  {
    icon: Eye,
    title: 'Independently Verifiable',
    desc: 'Your credit balance and history are publicly auditable — no need to trust anyone\'s database.',
    color: 'rgb(16 185 129)',
  },
  {
    icon: ShieldCheck,
    title: 'You Own Your Credits',
    desc: 'Credits are stored in your personal wallet, not a company database. They\'re yours, always.',
    color: 'rgb(245 158 11)',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Join an Institution',
    desc: 'Register and connect to your university, organization, or partner network.',
  },
  {
    step: '02',
    title: 'Complete Activities',
    desc: 'Submit proof of work for activities and earn institution-specific points.',
  },
  {
    step: '03',
    title: 'Swap & Redeem',
    desc: 'Exchange points across institutions via the Hub contract, or redeem for physical rewards.',
  },
]

export default function LandingPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.allSettled([
      apiClient.health(),
      apiClient.listInstitutions(),
    ]).then(([healthResult, institutionsResult]) => {
      if (healthResult.status === 'fulfilled') setHealth(healthResult.value)
      else setError('Unable to connect to the backend.')
      if (institutionsResult.status === 'fulfilled') setInstitutions(institutionsResult.value)
    }).finally(() => setLoading(false))
  }, [])

  const isHealthy = health?.status === 'ok' || health?.status === 'healthy'

  return (
    <div className="min-h-screen" style={{ background: 'rgb(10 11 18)', color: 'rgb(226 232 240)' }}>
      {/* Nav */}
      <nav
        style={{
          borderBottom: '1px solid rgb(39 43 65)',
          background: 'rgb(10 11 18 / 0.85)',
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
              }}
            >
              <Star size={14} color="white" fill="white" />
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
            Live Network
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
          XPUni connects institutions in a shared credit network. Complete activities,
          earn verified credits, and use them across universities, cafeterias, and partner organizations.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/register" className="btn btn-primary text-base px-8 py-3 flex items-center gap-2">
            Create Account <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="btn text-base px-8 py-3"
            style={{ border: '1px solid rgb(39 43 65)', color: 'rgb(148 163 184)', background: 'transparent' }}
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
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
                  }}
                >
                  <Icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-sm" style={{ color: 'rgb(226 232 240)' }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'rgb(100 116 139)' }}>{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgb(139 92 246)' }}>
            How It Works
          </p>
          <h2 className="text-3xl font-bold" style={{ color: 'rgb(226 232 240)' }}>
            From enrollment to on-chain rewards
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.step} className="relative">
              {i < HOW_IT_WORKS.length - 1 && (
                <div
                  className="hidden md:block absolute top-7 left-full w-full h-px"
                  style={{ background: 'linear-gradient(to right, rgb(39 43 65), transparent)', zIndex: 0 }}
                />
              )}
              <div className="card p-6 space-y-3 relative z-10">
                <span
                  className="text-xs font-black font-mono"
                  style={{ color: 'rgb(139 92 246)' }}
                >
                  {step.step}
                </span>
                <h3 className="font-bold" style={{ color: 'rgb(226 232 240)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgb(100 116 139)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Multi-institution economy */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div
          className="card p-8"
          style={{ borderColor: 'rgb(139 92 246 / 0.3)', background: 'rgb(139 92 246 / 0.04)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    background: 'rgb(139 92 246 / 0.15)',
                    border: '1px solid rgb(139 92 246 / 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={18} style={{ color: 'rgb(139 92 246)' }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'rgb(226 232 240)' }}>
                  Multi-Institution Economy
                </h2>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgb(148 163 184)' }}>
                Each institution issues its own credits. The network manages exchange rates
                and enables instant transfers between any two partner institutions.
              </p>
              <div className="space-y-2">
                {[
                  { icon: Building2, text: 'Universities, cafeterias, and partner orgs' },
                  { icon: Repeat2, text: 'Instant cross-institution transfers' },
                  { icon: ShieldCheck, text: 'Each institution controls its own credits' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5">
                    <Icon size={14} style={{ color: 'rgb(139 92 246)', flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: 'rgb(148 163 184)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live institutions panel */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgb(100 116 139)' }}>
                Live Institutions
              </p>
              {loading && (
                <div className="flex items-center gap-2 py-4" style={{ color: 'rgb(100 116 139)' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              )}
              {!loading && institutions.length === 0 && (
                <p className="text-sm" style={{ color: 'rgb(100 116 139)' }}>
                  No institutions registered yet.
                </p>
              )}
              {institutions.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{ background: 'rgb(26 29 44)', border: '1px solid rgb(39 43 65)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: '1.75rem',
                        height: '1.75rem',
                        borderRadius: '0.5rem',
                        background: 'rgb(139 92 246 / 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 size={12} style={{ color: 'rgb(139 92 246)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'rgb(226 232 240)' }}>{inst.name}</p>
                      <p className="text-xs font-mono" style={{ color: 'rgb(100 116 139)' }}>
                        {inst.slug}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: inst.status === 'ACTIVE' ? 'rgb(16 185 129 / 0.1)' : 'rgb(100 116 139 / 0.1)',
                      color: inst.status === 'ACTIVE' ? 'rgb(16 185 129)' : 'rgb(100 116 139)',
                    }}
                  >
                    {inst.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* System status */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="card p-8" style={{ borderColor: 'rgb(39 43 65)' }}>
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
            <div className="flex items-center gap-2" style={{ color: 'rgb(100 116 139)' }}>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Checking connectivity…</span>
            </div>
          )}

          {error && (
            <div
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{ background: 'rgb(239 68 68 / 0.08)', border: '1px solid rgb(239 68 68 / 0.25)' }}
            >
              <XCircle size={16} style={{ color: 'rgb(239 68 68)', flexShrink: 0, marginTop: '0.1rem' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'rgb(239 68 68)' }}>Backend Unreachable</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(100 116 139)' }}>{error}</p>
              </div>
            </div>
          )}

          {health && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'API', ok: isHealthy, value: health.status.toUpperCase() },
                { label: 'Database', ok: health.database === 'connected', value: health.database },
                ...(health.rpc_available !== undefined
                  ? [{ label: 'Stellar RPC', ok: health.rpc_available, value: health.rpc_available ? 'Connected' : 'Unavailable' }]
                  : []),
              ].map(({ label, ok, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{ background: 'rgb(26 29 44)' }}
                >
                  <span className="text-sm" style={{ color: 'rgb(148 163 184)' }}>{label}</span>
                  <div className="flex items-center gap-2">
                    {ok
                      ? <CheckCircle size={14} style={{ color: 'rgb(16 185 129)' }} />
                      : <XCircle size={14} style={{ color: 'rgb(239 68 68)' }} />
                    }
                    <span className="text-sm font-mono font-semibold" style={{ color: ok ? 'rgb(16 185 129)' : 'rgb(239 68 68)' }}>
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

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
        <p>XPUni · The Cross-Campus Credit Network · Your credits, always yours</p>
      </footer>
    </div>
  )
}
