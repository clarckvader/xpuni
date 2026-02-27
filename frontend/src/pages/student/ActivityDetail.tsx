import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

type BackendActivity = { id: number; title: string; description: string; pointsReward: number; status: string }

export default function StudentActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activity, setActivity] = useState<BackendActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const notify = useNotificationContext()

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const data = await apiClient.getActivity(id)
        setActivity(data as unknown as BackendActivity)
      } catch {
        notify.error('Failed to load activity')
        navigate('/student/activities')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!id || !file) return
    setSubmitting(true)
    try {
      await apiClient.createSubmission({ activity_id: id, description, file })
      notify.success('Submission sent successfully!')
      setSubmitted(true)
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Layout title="Activity Detail"><div className="text-center py-12"><p className="text-muted">Loading...</p></div></Layout>
  }

  if (!activity) return null

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => navigate('/student/activities')} className="text-primary hover:underline text-sm">
          ← Back to Activities
        </button>

        <div className="card p-8 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-foreground">{activity.title}</h1>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-primary">{activity.pointsReward}</p>
              <p className="text-xs text-muted">points</p>
            </div>
          </div>
          <p className="text-foreground leading-relaxed">{activity.description}</p>
        </div>

        {submitted ? (
          <div className="card p-8 text-center space-y-4">
            <p className="text-2xl font-bold text-success">Submitted!</p>
            <p className="text-muted">Your proof has been submitted for review.</p>
            <button className="btn btn-primary" onClick={() => navigate('/student/submissions')}>View My Submissions</button>
          </div>
        ) : (
          <div className="card p-8 space-y-4">
            <h2 className="text-xl font-bold text-foreground">Submit Proof</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-field">Description *</label>
                <textarea
                  className="input-field"
                  rows={3}
                  required
                  placeholder="Describe your work..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="label-field">Proof File</label>
                <input
                  className="input-field"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted mt-1">Accepted: images, PDF</p>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Proof'}
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  )
}
