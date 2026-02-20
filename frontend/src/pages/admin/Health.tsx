import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StellarAddress from '@/components/StellarAddress'
import { apiClient } from '@/services/api'
import type { HealthResponse } from '@/types/api'

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-lg"
      style={{ background: 'rgb(26 29 44)' }}
    >
      <span className="text-sm font-medium" style={{ color: 'rgb(148 163 184)' }}>{label}</span>
      <div className="flex items-center gap-2">
        {ok !== undefined && (
          <span className={`status-dot ${ok ? 'status-dot-online' : 'status-dot-offline'}`} />
        )}
        <span
          className="text-sm font-semibold font-mono"
          style={{ color: ok === false ? 'rgb(239 68 68)' : ok === true ? 'rgb(16 185 129)' : 'rgb(226 232 240)' }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const data = await apiClient.health()
      setHealth(data)
      setLastChecked(new Date())
    } catch (error) {
      console.error('Health check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { checkHealth() }, [])

  const isHealthy = health?.status === 'ok' || health?.status === 'healthy'

  return (
    <Layout title="System Health" subtitle="Monitor blockchain connectivity and contract status">
      <div className="space-y-6 animate-fade-in">

        {/* Summary banner */}
        {health && (
          <div
            className="card p-5 flex items-center justify-between"
            style={{
              borderColor: isHealthy ? 'rgb(16 185 129 / 0.3)' : 'rgb(239 68 68 / 0.3)',
              background: isHealthy
                ? 'linear-gradient(135deg, rgb(17 19 30) 0%, rgb(17 28 22) 100%)'
                : 'linear-gradient(135deg, rgb(17 19 30) 0%, rgb(35 17 17) 100%)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  background: isHealthy ? 'rgb(16 185 129 / 0.15)' : 'rgb(239 68 68 / 0.15)',
                  border: `1px solid ${isHealthy ? 'rgb(16 185 129 / 0.3)' : 'rgb(239 68 68 / 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}
              >
                {isHealthy ? '✓' : '✗'}
              </div>
              <div>
                <p className="font-bold" style={{ color: isHealthy ? 'rgb(16 185 129)' : 'rgb(239 68 68)' }}>
                  {isHealthy ? 'All Systems Operational' : 'System Issues Detected'}
                </p>
                {lastChecked && (
                  <p className="text-xs mt-0.5" style={{ color: 'rgb(100 116 139)' }}>
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="btn btn-outline text-sm"
              style={{ opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Checking…' : '↻ Refresh'}
            </button>
          </div>
        )}

        {loading && !health && (
          <div className="card p-12 text-center">
            <div
              className="status-dot status-dot-pending mx-auto mb-3"
              style={{ width: '0.75rem', height: '0.75rem' }}
            />
            <p style={{ color: 'rgb(100 116 139)' }}>Checking system health…</p>
          </div>
        )}

        {health && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Infrastructure */}
            <div className="card p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgb(100 116 139)' }}>
                Infrastructure
              </h3>
              <div className="space-y-2">
                <StatusRow
                  label="API Status"
                  value={health.status.toUpperCase()}
                  ok={isHealthy}
                />
                <StatusRow
                  label="Database"
                  value={health.database}
                  ok={health.database === 'connected'}
                />
                {health.rpc_available !== undefined && (
                  <StatusRow
                    label="Stellar RPC"
                    value={health.rpc_available ? 'Connected' : 'Unavailable'}
                    ok={health.rpc_available}
                  />
                )}
                <StatusRow
                  label="Network"
                  value="Testnet"
                />
              </div>
            </div>

            {/* Smart Contracts */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgb(100 116 139)' }}>
                  Smart Contracts
                </h3>
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

              {health.contracts ? (
                <div className="space-y-4">
                  {health.contracts.badge_issuer && (
                    <div>
                      <p className="label-field">Badge Issuer Contract</p>
                      <div className="mt-1.5">
                        <StellarAddress
                          address={health.contracts.badge_issuer}
                          type="contract"
                          testnet
                          chars={8}
                        />
                      </div>
                    </div>
                  )}
                  {health.contracts.token_admin && (
                    <div>
                      <p className="label-field">Token Admin Contract</p>
                      <div className="mt-1.5">
                        <StellarAddress
                          address={health.contracts.token_admin}
                          type="contract"
                          testnet
                          chars={8}
                        />
                      </div>
                    </div>
                  )}
                  {!health.contracts.badge_issuer && !health.contracts.token_admin && (
                    <p className="text-sm" style={{ color: 'rgb(100 116 139)' }}>No contracts deployed</p>
                  )}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'rgb(100 116 139)' }}>Contract info unavailable</p>
              )}

              {(health.contracts?.badge_issuer || health.contracts?.token_admin) && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: 'rgb(6 182 212 / 0.06)',
                    border: '1px solid rgb(6 182 212 / 0.15)',
                    color: 'rgb(100 116 139)',
                  }}
                >
                  <span style={{ color: 'rgb(6 182 212)' }}>↗</span>
                  Click the explorer icon to view contracts on Stellar Expert
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
