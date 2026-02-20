import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

type BackendRedemption = {
  id: number; pointsSpent: number; status: 'PENDING' | 'COMPLETED' | 'CANCELLED'; notes: string | null; redeemedAt: string; completedAt: string | null
  student: { id: number; email: string } | null
  reward: { id: number; name: string; rewardType: string } | null
}

const STATUS_COLORS: Record<string, string> = { PENDING: 'bg-warning text-white', COMPLETED: 'bg-success text-white', CANCELLED: 'bg-error text-white' }

export default function AdminRedemptionsPage() {
  const [redemptions, setRedemptions] = useState<BackendRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [completing, setCompleting] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const notify = useNotificationContext()

  const load = async () => {
    try {
      setLoading(true)
      const result = await apiClient.listRedemptions(1, 100, statusFilter || undefined)
      setRedemptions(result as unknown as BackendRedemption[])
    } catch {
      notify.error('Failed to load redemptions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  const handleComplete = async (id: number) => {
    try {
      await apiClient.completeRedemption(String(id), { notes: notes || undefined })
      notify.success('Redemption marked as completed')
      setCompleting(null)
      setNotes('')
      load()
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
    }
  }

  return (
    <Layout title="Redemption Management">
      <div className="space-y-6">
        <div className="card p-4">
          <label className="label-field">Filter by Status</label>
          <select className="input-field max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12"><p className="text-muted">Loading redemptions...</p></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Student</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Reward</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Points</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map(r => (
                  <>
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-background">
                      <td className="px-4 py-3 font-medium text-foreground">{r.student?.email ?? '—'}</td>
                      <td className="px-4 py-3 text-foreground">{r.reward?.name ?? '—'}</td>
                      <td className="px-4 py-3 font-bold text-primary">{r.pointsSpent}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] ?? ''}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted">{new Date(r.redeemedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'PENDING' && (
                          <button className="btn btn-primary text-xs px-2 py-1" onClick={() => setCompleting(completing === r.id ? null : r.id)}>Complete</button>
                        )}
                      </td>
                    </tr>
                    {completing === r.id && (
                      <tr key={`${r.id}-complete`} className="bg-background">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="flex gap-3 items-end">
                            <div className="flex-1">
                              <label className="label-field">Notes (optional)</label>
                              <input className="input-field" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery notes..." />
                            </div>
                            <button className="btn btn-primary" onClick={() => handleComplete(r.id)}>Confirm</button>
                            <button className="btn btn-outline" onClick={() => { setCompleting(null); setNotes('') }}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {redemptions.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted">No redemptions found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
