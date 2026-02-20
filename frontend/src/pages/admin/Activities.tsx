import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

type BackendActivity = { id: number; title: string; description: string; pointsReward: number; status: string; createdAt: string }

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<BackendActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editActivity, setEditActivity] = useState<BackendActivity | null>(null)
  const [form, setForm] = useState({ title: '', description: '', points: '' })
  const [submitting, setSubmitting] = useState(false)
  const notify = useNotificationContext()

  const load = async () => {
    try {
      setLoading(true)
      const result = await apiClient.listActivities(1, 100)
      setActivities(result as unknown as BackendActivity[])
    } catch {
      notify.error('Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditActivity(null)
    setForm({ title: '', description: '', points: '' })
    setShowForm(true)
  }

  const openEdit = (a: BackendActivity) => {
    setEditActivity(a)
    setForm({ title: a.title, description: a.description, points: String(a.pointsReward) })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditActivity(null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { title: form.title, description: form.description, points: Number(form.points), category: '' }
      if (editActivity) {
        await apiClient.updateActivity(String(editActivity.id), payload)
        notify.success('Activity updated')
      } else {
        await apiClient.createActivity(payload)
        notify.success('Activity created')
      }
      closeForm()
      load()
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this activity?')) return
    try {
      await apiClient.deleteActivity(String(id))
      notify.success('Activity deleted')
      load()
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
    }
  }

  return (
    <Layout title="Activity Management">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={openCreate}>+ New Activity</button>
        </div>

        {showForm && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">{editActivity ? 'Edit Activity' : 'New Activity'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label-field">Title</label>
                  <input className="input-field" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="label-field">Description</label>
                  <textarea className="input-field" rows={3} required minLength={10} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label-field">Points Reward</label>
                  <input className="input-field" type="number" min="1" required value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
                <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><p className="text-muted">Loading activities...</p></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Points</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {activities.map(a => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-background">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted truncate max-w-xs">{a.description}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">{a.pointsReward}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.status === 'ACTIVE' ? 'bg-success text-white' : 'bg-muted text-white'}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button className="btn btn-outline text-xs px-2 py-1" onClick={() => openEdit(a)}>Edit</button>
                        <button className="btn btn-danger text-xs px-2 py-1" onClick={() => handleDelete(a.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activities.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted">No activities found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
