import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'
import type { UserRole } from '@/types/api'

type BackendUser = { id: number; email: string; role: UserRole; stellarPublicKey: string; createdAt: string }

const ROLES: UserRole[] = ['STUDENT', 'REVIEWER', 'ADMIN']
const roleBadge = (role: UserRole) => {
  const colors: Record<UserRole, string> = { ADMIN: 'bg-error text-white', REVIEWER: 'bg-warning text-white', STUDENT: 'bg-success text-white' }
  return `px-2 py-0.5 rounded-full text-xs font-semibold ${colors[role]}`
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<BackendUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<BackendUser | null>(null)
  const [createForm, setCreateForm] = useState({ email: '', password: '', role: 'STUDENT' as UserRole })
  const [editRole, setEditRole] = useState<UserRole>('STUDENT')
  const [submitting, setSubmitting] = useState(false)
  const notify = useNotificationContext()

  const load = async () => {
    try {
      setLoading(true)
      const result = await apiClient.listUsers(1, 100)
      setUsers(result as unknown as BackendUser[])
    } catch {
      notify.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiClient.createUser({ email: createForm.email, name: '', password: createForm.password, role: createForm.role })
      notify.success('User created')
      setShowCreate(false)
      setCreateForm({ email: '', password: '', role: 'STUDENT' })
      load()
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setSubmitting(true)
    try {
      await apiClient.updateUser(String(editUser.id), { role: editRole } as any)
      notify.success('Role updated')
      setEditUser(null)
      load()
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return
    try {
      await apiClient.deleteUser(String(id))
      notify.success('User deleted')
      load()
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
    }
  }

  return (
    <Layout title="User Management">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>+ New User</button>
        </div>

        {showCreate && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">New User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label-field">Email</label>
                  <input className="input-field" type="email" required value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label-field">Password</label>
                  <input className="input-field" type="password" required value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div>
                  <label className="label-field">Role</label>
                  <select className="input-field" value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as UserRole }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {editUser && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Edit Role — {editUser.email}</h2>
            <form onSubmit={handleEditRole} className="flex gap-3 items-end">
              <div>
                <label className="label-field">New Role</label>
                <select className="input-field" value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setEditUser(null)}>Cancel</button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><p className="text-muted">Loading users...</p></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-background">
                    <td className="px-4 py-3 font-medium text-foreground">{u.email}</td>
                    <td className="px-4 py-3"><span className={roleBadge(u.role)}>{u.role}</span></td>
                    <td className="px-4 py-3 text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button className="btn btn-outline text-xs px-2 py-1" onClick={() => { setEditUser(u); setEditRole(u.role) }}>Edit Role</button>
                        <button className="btn btn-danger text-xs px-2 py-1" onClick={() => handleDelete(u.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-muted">No users found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
