import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import StellarAddress from '@/components/StellarAddress'

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  ADMIN: { label: 'Admin', color: 'rgb(239 68 68)', bg: 'rgb(239 68 68 / 0.1)', border: 'rgb(239 68 68 / 0.3)', icon: '🔑' },
  REVIEWER: { label: 'Reviewer', color: 'rgb(245 158 11)', bg: 'rgb(245 158 11 / 0.1)', border: 'rgb(245 158 11 / 0.3)', icon: '🔍' },
  STUDENT: { label: 'Student', color: 'rgb(139 92 246)', bg: 'rgb(139 92 246 / 0.1)', border: 'rgb(139 92 246 / 0.3)', icon: '🎓' },
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleConfig = user ? (ROLE_CONFIG[user.role] ?? ROLE_CONFIG.STUDENT) : ROLE_CONFIG.STUDENT

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

        {/* Header card */}
        <div
          className="card p-8"
          style={{
            background: 'linear-gradient(135deg, rgb(17 19 30) 0%, rgb(26 19 44) 100%)',
            borderColor: 'rgb(139 92 246 / 0.25)',
            boxShadow: '0 0 40px rgb(139 92 246 / 0.08)',
          }}
        >
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div
              style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgb(139 92 246 / 0.4) 0%, rgb(6 182 212 / 0.4) 100%)',
                border: '2px solid rgb(139 92 246 / 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'rgb(226 232 240)',
                flexShrink: 0,
                boxShadow: '0 0 20px rgb(139 92 246 / 0.3)',
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold" style={{ color: 'rgb(226 232 240)' }}>{user?.name}</h1>
              <p className="text-sm mt-0.5" style={{ color: 'rgb(100 116 139)' }}>{user?.email}</p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                  style={{ color: roleConfig.color, background: roleConfig.bg, borderColor: roleConfig.border }}
                >
                  <span>{roleConfig.icon}</span>
                  {roleConfig.label}
                </span>

                <span
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{
                    color: 'rgb(16 185 129)',
                    background: 'rgb(16 185 129 / 0.1)',
                    borderColor: 'rgb(16 185 129 / 0.3)',
                  }}
                >
                  <span className="status-dot status-dot-online" />
                  Testnet
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details card */}
        <div className="card p-6 space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgb(100 116 139)' }}>
            Account Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="label-field">Full Name</p>
              <p className="font-semibold" style={{ color: 'rgb(226 232 240)' }}>{user?.name}</p>
            </div>

            <div>
              <p className="label-field">Email</p>
              <p className="font-semibold" style={{ color: 'rgb(226 232 240)' }}>{user?.email}</p>
            </div>

            <div>
              <p className="label-field">Member Since</p>
              <p className="font-semibold" style={{ color: 'rgb(226 232 240)' }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
            </div>

            <div>
              <p className="label-field">User ID</p>
              <p className="font-mono text-sm" style={{ color: 'rgb(148 163 184)' }}>#{user?.id}</p>
            </div>
          </div>
        </div>

        {/* Stellar wallet card */}
        <div
          className="card p-6 space-y-4"
          style={{
            borderColor: user?.stellar_key ? 'rgb(6 182 212 / 0.25)' : 'rgb(39 43 65)',
            background: user?.stellar_key ? 'linear-gradient(135deg, rgb(17 19 30) 0%, rgb(17 28 35) 100%)' : undefined,
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgb(100 116 139)' }}>
              Stellar Wallet
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded font-mono font-semibold"
              style={{
                background: 'rgb(6 182 212 / 0.1)',
                color: 'rgb(6 182 212)',
                border: '1px solid rgb(6 182 212 / 0.2)',
              }}
            >
              TESTNET
            </span>
          </div>

          {user?.stellar_key ? (
            <div className="space-y-3">
              <div>
                <p className="label-field">Public Key</p>
                <div className="mt-1.5">
                  <StellarAddress
                    address={user.stellar_key}
                    type="account"
                    testnet
                    full
                    className="text-xs"
                    style={{ borderRadius: '0.5rem', padding: '0.5rem 0.75rem', display: 'flex' } as React.CSSProperties}
                  />
                </div>
              </div>

              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: 'rgb(6 182 212 / 0.06)',
                  border: '1px solid rgb(6 182 212 / 0.15)',
                  color: 'rgb(100 116 139)',
                }}
              >
                <span style={{ color: 'rgb(6 182 212)' }}>ℹ</span>
                Your Stellar key is used for on-chain badge and token transactions.
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{
                background: 'rgb(245 158 11 / 0.06)',
                border: '1px solid rgb(245 158 11 / 0.2)',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgb(245 158 11)' }}>No Stellar key linked</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(100 116 139)' }}>
                  Contact an admin to link your Stellar wallet.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold" style={{ color: 'rgb(226 232 240)' }}>Sign Out</p>
              <p className="text-sm mt-0.5" style={{ color: 'rgb(100 116 139)' }}>Ends your current session</p>
            </div>
            <button onClick={handleLogout} className="btn btn-danger">
              Sign Out
            </button>
          </div>
        </div>

      </div>
    </Layout>
  )
}
