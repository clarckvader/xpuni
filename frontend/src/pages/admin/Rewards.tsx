import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

type BackendReward = { id: number; name: string; description: string; pointsCost: number; stock: number | null; imageUrl: string | null; status: string; createdAt: string }

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<BackendReward[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editReward, setEditReward] = useState<BackendReward | null>(null)
  const [form, setForm] = useState({ title: '', description: '', points_cost: '', quantity_available: '', image: null as File | null })
  const [submitting, setSubmitting] = useState(false)
  const notify = useNotificationContext()

  const load = async () => {
    try {
      setLoading(true)
      const result = await apiClient.listRewards(1, 100)
      setRewards(result as unknown as BackendReward[])
    } catch {
      notify.error('Failed to load rewards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditReward(null)
    setForm({ title: '', description: '', points_cost: '', quantity_available: '', image: null })
    setShowForm(true)
  }

  const openEdit = (r: BackendReward) => {
    setEditReward(r)
    setForm({ title: r.name, description: r.description, points_cost: String(r.pointsCost), quantity_available: String(r.stock ?? ''), image: null })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditReward(null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        points_cost: Number(form.points_cost),
        quantity_available: Number(form.quantity_available),
        ...(form.image ? { image: form.image } : {}),
      }
      if (editReward) {
        await apiClient.updateReward(String(editReward.id), payload)
        notify.success('Reward updated')
      } else {
        await apiClient.createReward(payload)
        notify.success('Reward created')
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
    if (!confirm('Delete this reward?')) return
    try {
      await apiClient.deleteReward(String(id))
      notify.success('Reward deleted')
      load()
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
    }
  }

  return (
    <Layout title="Reward Management">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={openCreate}>+ New Reward</button>
        </div>

        {showForm && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">{editReward ? 'Edit Reward' : 'New Reward'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label-field">Title</label>
                  <input className="input-field" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="label-field">Description</label>
                  <textarea className="input-field" rows={3} required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="label-field">Points Cost</label>
                  <input className="input-field" type="number" min="1" required value={form.points_cost} onChange={e => setForm(f => ({ ...f, points_cost: e.target.value }))} />
                </div>
                <div>
                  <label className="label-field">Stock (leave empty for unlimited)</label>
                  <input className="input-field" type="number" min="0" value={form.quantity_available} onChange={e => setForm(f => ({ ...f, quantity_available: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="label-field">Image {editReward && '(leave empty to keep current)'}</label>
                  <input className="input-field" type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, image: e.target.files?.[0] ?? null }))} />
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
          <div className="text-center py-12"><p className="text-muted">Loading rewards...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map(r => (
              <div key={r.id} className="card p-6 space-y-3">
                {r.imageUrl && <img src={r.imageUrl} alt={r.name} className="w-full h-40 object-cover rounded-lg" />}
                <div>
                  <h3 className="font-bold text-foreground">{r.name}</h3>
                  <p className="text-sm text-muted mt-1 line-clamp-2">{r.description}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-primary">{r.pointsCost} pts</span>
                  <span className="text-muted">Stock: {r.stock ?? '∞'}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button className="btn btn-outline text-xs flex-1 py-1" onClick={() => openEdit(r)}>Edit</button>
                  <button className="btn btn-danger text-xs flex-1 py-1" onClick={() => handleDelete(r.id)}>Delete</button>
                </div>
              </div>
            ))}
            {rewards.length === 0 && (
              <div className="md:col-span-3 card p-8 text-center"><p className="text-muted">No rewards found</p></div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
