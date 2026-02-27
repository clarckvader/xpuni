import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Zap,
  ClipboardList,
  Gift,
  Gem,
  Link2,
  Search,
  Users,
  Activity,
  RotateCcw,
  HeartPulse,
  Building2,
  Star,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import StellarAddress from './StellarAddress'

const NAV_ITEMS = {
  STUDENT: [
    { label: 'Activities', href: '/student/activities', icon: Zap },
    { label: 'Submissions', href: '/student/submissions', icon: ClipboardList },
    { label: 'Rewards', href: '/student/rewards', icon: Gift },
    { label: 'Credits', href: '/student/balance', icon: Gem },
    { label: 'History', href: '/student/transactions', icon: Link2 },
  ],
  REVIEWER: [
    { label: 'Submissions', href: '/reviewer/submissions', icon: Search },
    { label: 'Activities', href: '/student/activities', icon: Zap },
  ],
  ADMIN: [
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Activities', href: '/admin/activities', icon: Activity },
    { label: 'Institutions', href: '/admin/institutions', icon: Building2 },
    { label: 'Rewards', href: '/admin/rewards', icon: Gift },
    { label: 'Redemptions', href: '/admin/redemptions', icon: RotateCcw },
    { label: 'System', href: '/admin/health', icon: HeartPulse },
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
  const stellarKey = user?.stellarPublicKey ?? user?.stellar_key

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
          <Link to={isAuthenticated ? '/profile' : '/'} className="flex items-center gap-2.5 group">
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
              }}
            >
              <Star size={14} color="white" fill="white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm gradient-text">XPUni</span>
              <span style={{ fontSize: '0.6rem', color: 'rgb(100 116 139)', letterSpacing: '0.1em' }}>
                ON STELLAR
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {isAuthenticated && items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    color: active ? 'rgb(139 92 246)' : 'rgb(148 163 184)',
                    background: active ? 'rgb(139 92 246 / 0.12)' : 'transparent',
                    borderBottom: active ? '2px solid rgb(139 92 246 / 0.6)' : '2px solid transparent',
                  }}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {stellarKey && (
                  <StellarAddress address={stellarKey} type="account" testnet chars={4} />
                )}

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

                <div style={{ height: '1.25rem', width: '1px', background: 'rgb(39 43 65)' }} />

                <Link to="/profile" className="flex items-center gap-2 group">
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
                  className="flex items-center gap-1.5 btn btn-ghost text-xs"
                  style={{ padding: '0.375rem 0.75rem' }}
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary text-sm">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: 'rgb(148 163 184)' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden py-4 space-y-1 animate-fade-in"
            style={{ borderTop: '1px solid rgb(39 43 65)' }}
          >
            {isAuthenticated && items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all"
                  style={{
                    color: active ? 'rgb(139 92 246)' : 'rgb(148 163 184)',
                    background: active ? 'rgb(139 92 246 / 0.1)' : 'transparent',
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              )
            })}

            {isAuthenticated && (
              <div style={{ borderTop: '1px solid rgb(39 43 65)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                {stellarKey && (
                  <div className="px-3 py-2">
                    <p style={{ fontSize: '0.7rem', color: 'rgb(100 116 139)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wallet</p>
                    <StellarAddress address={stellarKey} type="account" testnet chars={6} />
                  </div>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm"
                  style={{ color: 'rgb(148 163 184)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={15} />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm"
                  style={{ color: 'rgb(239 68 68)' }}
                >
                  <LogOut size={15} />
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
