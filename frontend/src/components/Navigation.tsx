import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import StellarAddress from './StellarAddress'

const NAV_ITEMS = {
  STUDENT: [
    { label: 'Activities', href: '/student/activities', icon: '⚡' },
    { label: 'Submissions', href: '/student/submissions', icon: '📋' },
    { label: 'Rewards', href: '/student/rewards', icon: '🎁' },
    { label: 'Balance', href: '/student/balance', icon: '💎' },
    { label: 'Transactions', href: '/student/transactions', icon: '🔗' },
  ],
  REVIEWER: [
    { label: 'Submissions', href: '/reviewer/submissions', icon: '🔍' },
    { label: 'Activities', href: '/student/activities', icon: '⚡' },
  ],
  ADMIN: [
    { label: 'Users', href: '/admin/users', icon: '👥' },
    { label: 'Activities', href: '/admin/activities', icon: '⚡' },
    { label: 'Rewards', href: '/admin/rewards', icon: '🎁' },
    { label: 'Redemptions', href: '/admin/redemptions', icon: '🔁' },
    { label: 'Health', href: '/admin/health', icon: '💡' },
  ],
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/30',
  REVIEWER: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  STUDENT: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
}

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  const items = user ? NAV_ITEMS[user.role] ?? [] : []

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/')

  return (
    <nav
      style={{
        background: 'rgb(10 11 18 / 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgb(39 43 65)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to={isAuthenticated ? '/profile' : '/'}
            className="flex items-center gap-2.5 group"
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                background: 'linear-gradient(135deg, rgb(139 92 246) 0%, rgb(6 182 212) 100%)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgb(139 92 246 / 0.4)',
                transition: 'box-shadow 0.2s',
                fontSize: '1rem',
              }}
              className="group-hover:[box-shadow:0_0_24px_rgb(139_92_246/0.6)]"
            >
              ✦
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm gradient-text">XPUni</span>
              <span style={{ fontSize: '0.6rem', color: 'rgb(100 116 139)', letterSpacing: '0.1em' }}>
                ON STELLAR
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated && items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: isActive(item.href) ? 'rgb(139 92 246)' : 'rgb(148 163 184)',
                  background: isActive(item.href) ? 'rgb(139 92 246 / 0.12)' : 'transparent',
                  borderBottom: isActive(item.href) ? '2px solid rgb(139 92 246 / 0.6)' : '2px solid transparent',
                }}
              >
                <span style={{ fontSize: '0.75rem' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Stellar address chip */}
                {user?.stellar_key && (
                  <StellarAddress
                    address={user.stellar_key}
                    type="account"
                    testnet
                    chars={4}
                  />
                )}

                {/* Network badge */}
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgb(16 185 129 / 0.1)',
                    border: '1px solid rgb(16 185 129 / 0.3)',
                    color: 'rgb(16 185 129)',
                  }}
                >
                  <span className="status-dot status-dot-online" />
                  Testnet
                </span>

                {/* User menu */}
                <div
                  style={{
                    height: '1.25rem',
                    width: '1px',
                    background: 'rgb(39 43 65)',
                  }}
                />
                <Link
                  to="/profile"
                  className="flex items-center gap-2 group"
                >
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, rgb(139 92 246 / 0.3) 0%, rgb(6 182 212 / 0.3) 100%)',
                      border: '1px solid rgb(139 92 246 / 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'rgb(226 232 240)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgb(226 232 240)' }}>
                      {user?.name}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded border ${ROLE_STYLES[user?.role ?? 'STUDENT']}`}
                      style={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}
                    >
                      {user?.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="btn btn-ghost text-xs"
                  style={{ padding: '0.375rem 0.75rem' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn btn-ghost text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: 'rgb(148 163 184)' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden py-4 space-y-1 animate-fade-in"
            style={{ borderTop: '1px solid rgb(39 43 65)' }}
          >
            {isAuthenticated && items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  color: isActive(item.href) ? 'rgb(139 92 246)' : 'rgb(148 163 184)',
                  background: isActive(item.href) ? 'rgb(139 92 246 / 0.1)' : 'transparent',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {isAuthenticated && (
              <div style={{ borderTop: '1px solid rgb(39 43 65)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                {user?.stellar_key && (
                  <div className="px-3 py-2">
                    <p style={{ fontSize: '0.7rem', color: 'rgb(100 116 139)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wallet</p>
                    <StellarAddress address={user.stellar_key} type="account" testnet chars={6} />
                  </div>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                  style={{ color: 'rgb(148 163 184)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm"
                  style={{ color: 'rgb(239 68 68)' }}
                >
                  Sign Out
                </button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="flex flex-col gap-2 pt-2" style={{ borderTop: '1px solid rgb(39 43 65)' }}>
                <Link to="/login" className="btn btn-ghost text-sm" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn btn-primary text-sm" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
