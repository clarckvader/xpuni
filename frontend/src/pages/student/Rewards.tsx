import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

type BackendReward = { id: number; name: string; description: string; pointsCost: number; stock: number | null; imageUrl: string | null; status: string }

export default function StudentRewardsPage() {
  const [rewards, setRewards] = useState<BackendReward[]>([])
  const [loading, setLoading] = useState(true)
  const notify = useNotificationContext()

  useEffect(() => {
    const load = async () => {
      try {
        const result = await apiClient.listRewards(1, 100)
        setRewards(result as unknown as BackendReward[])
      } catch {
        notify.error('Failed to load rewards')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Layout title="Rewards Catalog" subtitle="Redeem your XPU tokens for exclusive rewards">
      {loading ? (
        <div className="card p-12 text-center">
          <span className="status-dot status-dot-pending mx-auto block mb-3" style={{ width: '0.75rem', height: '0.75rem' }} />
          <p style={{ color: 'rgb(100 116 139)' }}>Loading rewards…</p>
        </div>
      ) : rewards.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-3xl mb-3">🎁</p>
          <p className="font-semibold" style={{ color: 'rgb(148 163 184)' }}>No rewards available</p>
          <p className="text-sm mt-1" style={{ color: 'rgb(100 116 139)' }}>Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
          {rewards.map(r => (
            <Link key={r.id} to={`/student/rewards/${r.id}`}>
              <div
                className="card h-full cursor-pointer overflow-hidden"
                style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgb(139 92 246 / 0.4)'
                  el.style.boxShadow = '0 0 24px rgb(139 92 246 / 0.12)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgb(39 43 65)'
                  el.style.boxShadow = ''
                }}
              >
                {r.imageUrl ? (
                  <img src={r.imageUrl} alt={r.name} className="w-full h-40 object-cover" />
                ) : (
                  <div
                    className="w-full h-32 flex items-center justify-center text-4xl"
                    style={{ background: 'linear-gradient(135deg, rgb(139 92 246 / 0.1), rgb(6 182 212 / 0.1))' }}
                  >
                    🎁
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold" style={{ color: 'rgb(226 232 240)' }}>{r.name}</h3>
                    <p className="text-sm mt-1 truncate-lines-2" style={{ color: 'rgb(100 116 139)' }}>{r.description}</p>
                  </div>

                  <div
                    className="flex justify-between items-center pt-3"
                    style={{ borderTop: '1px solid rgb(39 43 65)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: 'rgb(139 92 246)', fontSize: '1.25rem', fontWeight: 800 }}>
                        {r.pointsCost}
                      </span>
                      <span className="text-xs font-bold" style={{ color: 'rgb(100 116 139)' }}>XPU</span>
                    </div>
                    {r.stock !== null && (
                      <span
                        className="text-xs px-2 py-0.5 rounded font-semibold"
                        style={{
                          background: r.stock > 0 ? 'rgb(16 185 129 / 0.1)' : 'rgb(239 68 68 / 0.1)',
                          color: r.stock > 0 ? 'rgb(16 185 129)' : 'rgb(239 68 68)',
                          border: `1px solid ${r.stock > 0 ? 'rgb(16 185 129 / 0.3)' : 'rgb(239 68 68 / 0.3)'}`,
                        }}
                      >
                        {r.stock > 0 ? `${r.stock} left` : 'Out of stock'}
                      </span>
                    )}
                  </div>

                  <div className="btn btn-primary w-full text-sm" style={{ borderRadius: '0.5rem' }}>
                    View &amp; Redeem
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  )
}
