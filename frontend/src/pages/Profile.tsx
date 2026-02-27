import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import {
  Key,
  Search,
  GraduationCap,
  Gem,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import Layout from '@/components/Layout'
import StellarAddress from '@/components/StellarAddress'

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; Icon: typeof Key }> = {
  ADMIN: { label: 'Admin', color: 'rgb(239 68 68)', bg: 'rgb(239 68 68 / 0.1)', border: 'rgb(239 68 68 / 0.3)', Icon: Key },
  REVIEWER: { label: 'Reviewer', color: 'rgb(245 158 11)', bg: 'rgb(245 158 11 / 0.1)', border: 'rgb(245 158 11 / 0.3)', Icon: Search },
  STUDENT: { label: 'Student', color: 'rgb(139 92 246)', bg: 'rgb(139 92 246 / 0.1)', border: 'rgb(139 92 246 / 0.3)', Icon: GraduationCap },
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleConfig = user ? (ROLE_CONFIG[user.role] ?? ROLE_CONFIG.STUDENT) : ROLE_CONFIG.STUDENT
  const RoleIcon = roleConfig.Icon
  const stellarKey = user?.stellarPublicKey ?? user?.stellar_key
  const joinedAt = user?.createdAt ?? user?.created_at

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
            <div
              style={{
                width: '4rem', height: '4rem', borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgb(139 92 246 / 0.4) 0%, rgb(6 182 212 / 0.4) 100%)',
                border: '2px solid rgb(139 92 246 / 0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 800, color: 'rgb(226 232 240)',
                flexShrink: 0, boxShadow: '0 0 20px rgb(139 92 246 / 0.3)',
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
                  <RoleIcon size={11} />
                  {roleConfig.label}
                </span>

                {/* Verified badge — value-add without crypto jargon */}
                <span
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{ color: 'rgb(16 185 129)', background: 'rgb(16 185 129 / 0.1)', borderColor: 'rgb(16 185 129 / 0.3)' }}
                >
                  <ShieldCheck size={11} />
                  Verified Account
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account details */}
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
                {joinedAt ? new Date(joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="label-field">Account ID</p>
              <p className="font-mono text-sm" style={{ color: 'rgb(148 163 184)' }}>#{user?.id}</p>
            </div>
          </div>
        </div>

        {/* Credits */}
        {user?.pointsBalance && (
          <div className="card p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Gem size={14} style={{ color: 'rgb(139 92 246)' }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgb(100 116 139)' }}>
                My Credits
              </h2>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'rgb(139 92 246)' }}>
              {user.pointsBalance} <span className="text-sm font-normal" style={{ color: 'rgb(100 116 139)' }}>credits</span>
            </p>
          </div>
        )}

        {/* Advanced section — wallet details hidden by default */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4"
            style={{ color: 'rgb(100 116 139)' }}
          >
            <div className="flex items-center gap-2">
              <Key size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">Advanced</span>
            </div>
            {showAdvanced ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>

          {showAdvanced && stellarKey && (
            <div
              className="px-6 pb-5 space-y-3"
              style={{ borderTop: '1px solid rgb(39 43 65)' }}
            >
              <p className="text-xs pt-4" style={{ color: 'rgb(100 116 139)' }}>
                Your account is backed by a blockchain wallet. This address can be used to independently verify your credit balance and transfer history.
              </p>
              <div>
                <p className="label-field mb-1.5">Wallet Address</p>
                <StellarAddress
                  address={stellarKey}
                  type="account"
                  testnet
                  full
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {showAdvanced && !stellarKey && (
            <div className="px-6 pb-5 pt-4" style={{ borderTop: '1px solid rgb(39 43 65)' }}>
              <p className="text-sm" style={{ color: 'rgb(100 116 139)' }}>
                No blockchain wallet linked yet. Contact support if you think this is an error.
              </p>
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
            <button onClick={handleLogout} className="btn btn-danger flex items-center gap-2">
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

      </div>
    </Layout>
  )
}
