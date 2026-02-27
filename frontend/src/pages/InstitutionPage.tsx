import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  Zap,
  Gift,
  ArrowRight,
  ShieldCheck,
  Star,
  Repeat2,
  Building2,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { apiClient } from '@/services/api'
import type { Institution } from '@/types/api'

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create Your Account',
    desc: 'Register with your email. A secure personal wallet is created for you automatically.',
  },
  {
    step: '02',
    title: 'Complete Activities',
    desc: 'Submit proof of work for activities posted by the institution. Each approval earns credits.',
  },
  {
    step: '03',
    title: 'Redeem Rewards',
    desc: 'Use your earned credits to claim physical rewards, perks, and exclusive offers.',
  },
]

const PERKS = [
  {
    icon: ShieldCheck,
    title: 'Tamper-proof Records',
    desc: 'Every credit you earn is recorded permanently. No one can take it away.',
    color: 'rgb(139 92 246)',
  },
  {
    icon: Zap,
    title: 'Instant Earning',
    desc: 'Credits hit your balance as soon as an activity is approved — no waiting.',
    color: 'rgb(6 182 212)',
  },
  {
    icon: Gift,
    title: 'Real Rewards',
    desc: 'Redeem credits for physical goods, discounts, and perks at participating partners.',
    color: 'rgb(16 185 129)',
  },
  {
    icon: Repeat2,
    title: 'Cross-Network Value',
    desc: 'Credits are part of a shared network — transferable across institutions.',
    color: 'rgb(245 158 11)',
  },
]

export default function InstitutionPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    apiClient.getInstitution(slug)
      .then(setInstitution)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(10 11 18)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'rgb(139 92 246)' }} />
      </div>
    )
  }

  if (notFound || !institution) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'rgb(10 11 18)', color: 'rgb(226 232 240)' }}>
        <Building2 size={48} style={{ color: 'rgb(100 116 139)' }} />
        <h1 className="text-2xl font-bold">Institution not found</h1>
        <p style={{ color: 'rgb(100 116 139)' }}>The institution <strong>{slug}</strong> doesn't exist or has been deactivated.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-2">Back to Home</button>
      </div>
    )
  }

  const joinUrl = `/register?institution=${slug}`

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
          <Link to="/" className="flex items-center gap-2.5">
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
              <span className="font-bold text-sm" style={{ background: 'linear-gradient(135deg, rgb(139 92 246), rgb(6 182 212))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>XPUni</span>
              <span style={{ fontSize: '0.6rem', color: 'rgb(100 116 139)', letterSpacing: '0.1em' }}>REWARDS NETWORK</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-ghost text-sm">Sign In</Link>
            <Link to={joinUrl} className="btn btn-primary text-sm">
              Join {institution.name}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        {/* Institution badge */}
        <div className="flex justify-center mb-6">
          <div
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold border"
            style={{
              background: 'rgb(139 92 246 / 0.08)',
              borderColor: 'rgb(139 92 246 / 0.3)',
              color: 'rgb(139 92 246)',
            }}
          >
            <Building2 size={16} />
            {institution.status === 'ACTIVE' ? 'Active Institution' : institution.status}
          </div>
        </div>

        {/* Logo or initials */}
        <div className="flex justify-center mb-6">
          {institution.logoUrl ? (
            <img
              src={institution.logoUrl}
              alt={institution.name}
              className="w-20 h-20 rounded-2xl object-cover"
              style={{ border: '1px solid rgb(39 43 65)' }}
            />
          ) : (
            <div
              style={{
                width: '5rem',
                height: '5rem',
                borderRadius: '1rem',
                background: 'linear-gradient(135deg, rgb(139 92 246 / 0.3), rgb(6 182 212 / 0.3))',
                border: '1px solid rgb(139 92 246 / 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'rgb(139 92 246)',
              }}
            >
              {institution.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <h1
          className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 text-balance"
          style={{ letterSpacing: '-0.02em', color: 'rgb(226 232 240)' }}
        >
          {institution.name}
        </h1>

        {institution.description && (
          <p
            className="text-lg max-w-2xl mx-auto mb-10 text-pretty"
            style={{ color: 'rgb(148 163 184)', lineHeight: 1.7 }}
          >
            {institution.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          <Link to={joinUrl} className="btn btn-primary text-base px-8 py-3 flex items-center gap-2">
            Join {institution.name} <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="btn text-base px-8 py-3"
            style={{ border: '1px solid rgb(39 43 65)', color: 'rgb(148 163 184)', background: 'transparent' }}
          >
            Already a member? Sign In
          </Link>
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap justify-center gap-6 mt-12">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(100 116 139)' }}>
            <CheckCircle size={14} style={{ color: 'rgb(16 185 129)' }} />
            Credits redeemable instantly
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(100 116 139)' }}>
            <CheckCircle size={14} style={{ color: 'rgb(16 185 129)' }} />
            Verified achievement records
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(100 116 139)' }}>
            <CheckCircle size={14} style={{ color: 'rgb(16 185 129)' }} />
            Transferable across the network
          </div>
        </div>
      </section>

      {/* Perks grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERKS.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.title}
                className="card p-5 flex flex-col gap-3"
                style={{ background: 'rgb(17 19 30)' }}
              >
                <div
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '0.625rem',
                    background: `${p.color.replace('rgb', 'rgba').replace(')', ' / 0.12)')}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} style={{ color: p.color }} />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: 'rgb(226 232 240)' }}>{p.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgb(100 116 139)' }}>{p.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section
        className="py-20"
        style={{ background: 'rgb(17 19 30)', borderTop: '1px solid rgb(39 43 65)', borderBottom: '1px solid rgb(39 43 65)' }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <h2
            className="text-2xl font-bold text-center mb-12"
            style={{ color: 'rgb(226 232 240)' }}
          >
            How it works at{' '}
            <span style={{ background: 'linear-gradient(135deg, rgb(139 92 246), rgb(6 182 212))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {institution.name}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-sm mb-4"
                  style={{
                    background: 'rgb(139 92 246 / 0.12)',
                    border: '1px solid rgb(139 92 246 / 0.3)',
                    color: 'rgb(139 92 246)',
                  }}
                >
                  {step.step}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'rgb(226 232 240)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgb(100 116 139)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ color: 'rgb(226 232 240)' }}>
          Ready to start earning?
        </h2>
        <p className="text-base mb-8" style={{ color: 'rgb(100 116 139)' }}>
          Join {institution.name} and turn your activities into real rewards.
        </p>
        <Link to={joinUrl} className="btn btn-primary text-base px-10 py-3 inline-flex items-center gap-2">
          Create Account <ArrowRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer
        className="py-8 text-center text-xs"
        style={{ borderTop: '1px solid rgb(39 43 65)', color: 'rgb(100 116 139)' }}
      >
        <span>Powered by </span>
        <Link to="/" className="font-semibold hover:underline" style={{ color: 'rgb(139 92 246)' }}>XPUni</Link>
        <span> — the institutional rewards network</span>
      </footer>
    </div>
  )
}
