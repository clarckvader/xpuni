import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

type BackendSubmission = {
  id: number; studentId: number; activityId: number; description: string; fileUrl: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; reviewerNotes: string | null; submittedAt: string; reviewedAt: string | null
}
type BackendActivity = { id: number; title: string; pointsReward: number }

export default function ReviewerSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState<BackendSubmission | null>(null)
  const [activity, setActivity] = useState<BackendActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [acting, setActing] = useState(false)
  const notify = useNotificationContext()

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const data = await apiClient.getSubmission(id)
        const s = data as unknown as BackendSubmission
        setSubmission(s)
        const act = await apiClient.getActivity(String(s.activityId))
        setActivity(act as unknown as BackendActivity)
      } catch {
        notify.error('Failed to load submission')
        navigate('/reviewer/submissions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleApprove = async () => {
    if (!id) return
    setActing(true)
    try {
      await apiClient.approveSubmission(id, { notes: notes || undefined })
      notify.success('Submission approved')
      navigate('/reviewer/submissions')
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!id) return
    if (!notes.trim()) { notify.error('Rejection requires a note'); return }
    setActing(true)
    try {
      await apiClient.rejectSubmission(id, { notes })
      notify.success('Submission rejected')
      navigate('/reviewer/submissions')
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
      setActing(false)
    }
  }

  if (loading) {
    return <Layout title="Review Submission"><div className="text-center py-12"><p className="text-muted">Loading...</p></div></Layout>
  }

  if (!submission) return null

  const isPending = submission.status === 'PENDING'

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => navigate('/reviewer/submissions')} className="text-primary hover:underline text-sm">
          ← Back to Submissions
        </button>

        <div className="card p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activity && (
              <div>
                <p className="text-xs text-muted font-medium">Activity</p>
                <p className="font-semibold text-foreground">{activity.title}</p>
                <p className="text-sm text-primary font-bold">{activity.pointsReward} pts</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted font-medium">Submitted</p>
              <p className="font-semibold text-foreground">{new Date(submission.submittedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted font-medium">Status</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                submission.status === 'APPROVED' ? 'bg-success text-white' :
                submission.status === 'REJECTED' ? 'bg-error text-white' : 'bg-warning text-white'
              }`}>{submission.status}</span>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted font-medium">Student Description</p>
            <p className="text-foreground mt-1">{submission.description}</p>
          </div>

          {submission.fileUrl && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted font-medium mb-3">Proof</p>
              {/\.(jpg|jpeg|png|gif|webp)$/i.test(submission.fileUrl) ? (
                <img src={submission.fileUrl} alt="Proof" className="max-w-full rounded-lg border border-border" />
              ) : (
                <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Proof File →</a>
              )}
            </div>
          )}

          {submission.reviewerNotes && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted font-medium">Previous Review Note</p>
              <p className="text-foreground mt-1">{submission.reviewerNotes}</p>
            </div>
          )}

          {isPending && (
            <div className="border-t border-border pt-6 space-y-4">
              <div>
                <label className="label-field">Notes <span className="text-muted font-normal">(required for rejection)</span></label>
                <textarea className="input-field" rows={3} placeholder="Add review notes..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button className="btn btn-primary flex-1" onClick={handleApprove} disabled={acting}>{acting ? 'Processing...' : 'Approve'}</button>
                <button className="btn btn-danger flex-1" onClick={handleReject} disabled={acting}>{acting ? 'Processing...' : 'Reject'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
