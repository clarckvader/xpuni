import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

type BackendSubmission = {
  id: number; description: string; fileUrl: string | null; status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewerNotes: string | null; submittedAt: string; activityId: number
  student: { id: number; email: string } | null
}

const STATUS_COLORS: Record<string, string> = { PENDING: 'bg-warning text-white', APPROVED: 'bg-success text-white', REJECTED: 'bg-error text-white' }

export default function ReviewerSubmissionsPage() {
  const [submissions, setSubmissions] = useState<BackendSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const notify = useNotificationContext()

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const result = await apiClient.listSubmissions(1, 100, statusFilter || undefined)
        setSubmissions(result as unknown as BackendSubmission[])
      } catch {
        notify.error('Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [statusFilter])

  return (
    <Layout title="Pending Submissions">
      <div className="space-y-6">
        <div className="card p-4">
          <label className="label-field">Filter by Status</label>
          <select className="input-field max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="">All</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12"><p className="text-muted">Loading submissions...</p></div>
        ) : submissions.length === 0 ? (
          <div className="card p-8 text-center"><p className="text-muted">No submissions found</p></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Student</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Activity</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-background">
                    <td className="px-4 py-3 font-medium text-foreground">{s.student?.email ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">#{s.activityId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(s.submittedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/reviewer/submissions/${s.id}`} className="btn btn-primary text-xs px-2 py-1">Review</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
