import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

type BackendSubmission = {
  id: number; description: string; fileUrl: string | null; status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewerNotes: string | null; submittedAt: string; activityId: number; txHash?: string | null
  student: { id: number; email: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string; icon: string }> = {
  PENDING:  { label: 'Pending Review', badge: 'badge badge-warning',  dot: 'status-dot-pending',  icon: '⏳' },
  APPROVED: { label: 'Approved',       badge: 'badge badge-success',  dot: 'status-dot-online',   icon: '✓' },
  REJECTED: { label: 'Rejected',       badge: 'badge badge-error',    dot: 'status-dot-offline',  icon: '✗' },
}

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<BackendSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
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
    <Layout title="My Submissions" subtitle="Track your activity submissions and blockchain confirmations">
      <div className="space-y-5 animate-fade-in">

        {/* Filter */}
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <span className="label-field mb-0">Filter:</span>
          {['', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all border"
              style={{
                background: statusFilter === s ? 'rgb(139 92 246 / 0.2)' : 'transparent',
                borderColor: statusFilter === s ? 'rgb(139 92 246 / 0.5)' : 'rgb(39 43 65)',
                color: statusFilter === s ? 'rgb(139 92 246)' : 'rgb(100 116 139)',
              }}
            >
              {s || 'All'}
            </button>
          ))}
          <span className="ml-auto text-xs" style={{ color: 'rgb(100 116 139)' }}>
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="card p-12 text-center">
            <span className="status-dot status-dot-pending mx-auto block mb-3" style={{ width: '0.75rem', height: '0.75rem' }} />
            <p style={{ color: 'rgb(100 116 139)' }}>Loading submissions…</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="font-semibold" style={{ color: 'rgb(148 163 184)' }}>No submissions found</p>
            <p className="text-sm mt-1" style={{ color: 'rgb(100 116 139)' }}>Complete an activity to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map(s => {
              const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.PENDING
              return (
                <div
                  key={s.id}
                  className="card p-5"
                  style={{
                    borderColor: s.status === 'APPROVED' ? 'rgb(16 185 129 / 0.2)' : s.status === 'REJECTED' ? 'rgb(239 68 68 / 0.2)' : 'rgb(39 43 65)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                          style={{
                            background: 'rgb(139 92 246 / 0.1)',
                            color: 'rgb(139 92 246)',
                            border: '1px solid rgb(139 92 246 / 0.2)',
                          }}
                        >
                          Activity #{s.activityId}
                        </span>
                        <span className="text-xs" style={{ color: 'rgb(100 116 139)' }}>
                          Sub #{s.id}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm truncate-lines-2" style={{ color: 'rgb(148 163 184)' }}>
                        {s.description}
                      </p>

                      {/* Date */}
                      <p className="text-xs" style={{ color: 'rgb(100 116 139)' }}>
                        Submitted {new Date(s.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`${cfg.badge} shrink-0`}>
                      <span>{cfg.icon}</span>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Reviewer notes */}
                  {s.reviewerNotes && (
                    <div
                      className="mt-4 pt-4 px-3 py-2.5 rounded-lg text-sm"
                      style={{
                        borderTop: '1px solid rgb(39 43 65)',
                        background: 'rgb(26 29 44)',
                      }}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgb(100 116 139)' }}>
                        Reviewer Notes
                      </p>
                      <p style={{ color: 'rgb(148 163 184)' }}>{s.reviewerNotes}</p>
                    </div>
                  )}

                  {/* Footer: tx hash + proof link */}
                  {(s.txHash || s.fileUrl) && (
                    <div
                      className="mt-4 pt-4 flex flex-wrap items-center gap-4"
                      style={{ borderTop: '1px solid rgb(39 43 65)' }}
                    >
                      {s.txHash && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'rgb(100 116 139)' }}>TX</span>
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${s.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hash-text text-xs hover:opacity-70 transition-opacity flex items-center gap-1"
                          >
                            {s.txHash.substring(0, 8)}…{s.txHash.substring(s.txHash.length - 8)}
                            <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>↗</span>
                          </a>
                        </div>
                      )}
                      {s.fileUrl && (
                        <a
                          href={s.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
                          style={{ color: 'rgb(6 182 212)' }}
                        >
                          View Proof ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
