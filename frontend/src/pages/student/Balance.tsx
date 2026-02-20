import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

type BackendSubmission = { id: number; description: string; status: string; submittedAt: string; activityId: number; txHash?: string | null }
type BackendRedemption = { id: number; pointsSpent: number; status: string; redeemedAt: string; reward: { name: string } | null; txHash?: string | null }

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'badge badge-warning',
  COMPLETED: 'badge badge-success',
  CANCELLED: 'badge badge-error',
}

export default function StudentBalancePage() {
  const [submissions, setSubmissions] = useState<BackendSubmission[]>([])
  const [redemptions, setRedemptions] = useState<BackendRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const notify = useNotificationContext()

  useEffect(() => {
    const load = async () => {
      try {
        const [subResult, redResult] = await Promise.all([
          apiClient.listSubmissions(1, 200, 'APPROVED'),
          apiClient.listRedemptions(1, 200),
        ])
        setSubmissions(subResult as unknown as BackendSubmission[])
        setRedemptions(redResult as unknown as BackendRedemption[])
      } catch {
        notify.error('Failed to load balance')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const spent = redemptions
    .filter(r => r.status !== 'CANCELLED')
    .reduce((acc, r) => acc + r.pointsSpent, 0)

  return (
    <Layout title="My Balance" subtitle="On-chain activity earnings and redemptions">
      <div className="space-y-6 animate-fade-in">
        {loading ? (
          <div className="card p-12 text-center">
            <span className="status-dot status-dot-pending mx-auto block mb-3" style={{ width: '0.75rem', height: '0.75rem' }} />
            <p style={{ color: 'rgb(100 116 139)' }}>Loading…</p>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="card p-6"
                style={{
                  background: 'linear-gradient(135deg, rgb(17 19 30) 0%, rgb(17 28 22) 100%)',
                  borderColor: 'rgb(16 185 129 / 0.25)',
                }}
              >
                <p className="label-field">Approved Activities</p>
                <p
                  className="text-5xl font-extrabold mt-2"
                  style={{ color: 'rgb(16 185 129)', textShadow: '0 0 24px rgb(16 185 129 / 0.4)' }}
                >
                  {submissions.length}
                </p>
                <p className="text-xs mt-2" style={{ color: 'rgb(100 116 139)' }}>verified on Stellar</p>
              </div>

              <div
                className="card p-6"
                style={{
                  background: 'linear-gradient(135deg, rgb(17 19 30) 0%, rgb(35 17 17) 100%)',
                  borderColor: 'rgb(239 68 68 / 0.25)',
                }}
              >
                <p className="label-field">Points Spent</p>
                <p
                  className="text-5xl font-extrabold mt-2"
                  style={{ color: 'rgb(239 68 68)', textShadow: '0 0 24px rgb(239 68 68 / 0.4)' }}
                >
                  {spent}
                </p>
                <p className="text-xs mt-2" style={{ color: 'rgb(100 116 139)' }}>on redemptions</p>
              </div>
            </div>

            {/* Approved submissions table */}
            <div className="card overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(39 43 65)' }}>
                <h2 className="font-bold" style={{ color: 'rgb(226 232 240)' }}>Approved Submissions</h2>
                <span className="badge badge-success">{submissions.length}</span>
              </div>
              {submissions.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-2xl mb-2">📋</p>
                  <p style={{ color: 'rgb(100 116 139)' }}>No approved submissions yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Activity</th>
                      {submissions.some(s => s.txHash) && <th>TX Hash</th>}
                      <th style={{ textAlign: 'right' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(s => (
                      <tr key={s.id}>
                        <td className="truncate max-w-xs">{s.description}</td>
                        <td>
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{ background: 'rgb(139 92 246 / 0.1)', color: 'rgb(139 92 246)', border: '1px solid rgb(139 92 246 / 0.2)' }}
                          >
                            #{s.activityId}
                          </span>
                        </td>
                        {submissions.some(sub => sub.txHash) && (
                          <td>
                            {s.txHash ? (
                              <a
                                href={`https://stellar.expert/explorer/testnet/tx/${s.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hash-text text-xs hover:opacity-70 transition-opacity"
                              >
                                {s.txHash.substring(0, 8)}…{s.txHash.substring(s.txHash.length - 8)} ↗
                              </a>
                            ) : (
                              <span style={{ color: 'rgb(100 116 139)', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>
                        )}
                        <td style={{ textAlign: 'right', color: 'rgb(100 116 139)', fontSize: '0.8rem' }}>
                          {new Date(s.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Redemptions table */}
            {redemptions.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(39 43 65)' }}>
                  <h2 className="font-bold" style={{ color: 'rgb(226 232 240)' }}>Redemption History</h2>
                  <span className="badge badge-primary">{redemptions.length}</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>Reward</th>
                      <th>Status</th>
                      {redemptions.some(r => r.txHash) && <th>TX Hash</th>}
                      <th style={{ textAlign: 'right' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.map(r => (
                      <tr key={r.id}>
                        <td className="font-medium" style={{ color: 'rgb(226 232 240)' }}>{r.reward?.name ?? '—'}</td>
                        <td>
                          <span className={STATUS_BADGE[r.status] ?? 'badge badge-primary'}>
                            {r.status}
                          </span>
                        </td>
                        {redemptions.some(rd => rd.txHash) && (
                          <td>
                            {r.txHash ? (
                              <a
                                href={`https://stellar.expert/explorer/testnet/tx/${r.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hash-text text-xs hover:opacity-70 transition-opacity"
                              >
                                {r.txHash.substring(0, 8)}…{r.txHash.substring(r.txHash.length - 8)} ↗
                              </a>
                            ) : (
                              <span style={{ color: 'rgb(100 116 139)', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>
                        )}
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-bold text-sm" style={{ color: 'rgb(239 68 68)' }}>
                            -{r.pointsSpent}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
