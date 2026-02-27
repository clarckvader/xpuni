import { useState, useEffect, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { Tag } from 'primereact/tag'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toolbar } from 'primereact/toolbar'
import { Users } from 'lucide-react'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import type { UserRole } from '@/types/api'

type BackendUser = { id: number; email: string; name?: string; role: UserRole; stellarPublicKey: string; createdAt: string }

const ROLES: { label: string; value: UserRole }[] = [
  { label: 'Student', value: 'STUDENT' },
  { label: 'Reviewer', value: 'REVIEWER' },
  { label: 'Admin', value: 'ADMIN' },
]

const roleSeverity = (role: UserRole): 'info' | 'warning' | 'danger' => {
  if (role === 'ADMIN') return 'danger'
  if (role === 'REVIEWER') return 'warning'
  return 'info'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<BackendUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createVisible, setCreateVisible] = useState(false)
  const [editUser, setEditUser] = useState<BackendUser | null>(null)
  const [createForm, setCreateForm] = useState({ email: '', name: '', password: '', role: 'STUDENT' as UserRole })
  const [editRole, setEditRole] = useState<UserRole>('STUDENT')
  const [submitting, setSubmitting] = useState(false)
  const toast = useRef<Toast>(null)

  const notify = {
    success: (msg: string) => toast.current?.show({ severity: 'success', summary: 'Success', detail: msg, life: 3000 }),
    error: (msg: string) => toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 4000 }),
  }

  const load = async () => {
    try {
      setLoading(true)
      setUsers(await apiClient.listUsers(1, 100) as unknown as BackendUser[])
    } catch {
      notify.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setSubmitting(true)
    try {
      await apiClient.createUser({ email: createForm.email, name: createForm.name, password: createForm.password, role: createForm.role })
      notify.success('User created')
      setCreateVisible(false)
      setCreateForm({ email: '', name: '', password: '', role: 'STUDENT' })
      load()
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditRole = async () => {
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

  const confirmDelete = (user: BackendUser) => {
    confirmDialog({
      message: `Delete user "${user.email}"? This cannot be undone.`,
      header: 'Delete User',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await apiClient.deleteUser(String(user.id))
          notify.success('User deleted')
          load()
        } catch (err) {
          notify.error(apiClient.getErrorMessage(err))
        }
      },
    })
  }

  // Column templates
  const emailTemplate = (u: BackendUser) => (
    <div>
      <p className="text-sm font-medium" style={{ color: 'rgb(226 232 240)' }}>{u.email}</p>
      {u.name && <p className="text-xs" style={{ color: 'rgb(100 116 139)' }}>{u.name}</p>}
    </div>
  )

  const roleTemplate = (u: BackendUser) => (
    <Tag value={u.role} severity={roleSeverity(u.role)} style={{ fontSize: '0.7rem' }} />
  )

  const joinedTemplate = (u: BackendUser) => (
    <span className="text-xs" style={{ color: 'rgb(100 116 139)' }}>
      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
    </span>
  )

  const actionsTemplate = (u: BackendUser) => (
    <div className="flex items-center gap-1">
      <Button
        icon="pi pi-user-edit"
        rounded text severity="secondary" size="small"
        onClick={() => { setEditUser(u); setEditRole(u.role) }}
        tooltip="Change Role"
        tooltipOptions={{ position: 'top' }}
      />
      <Button
        icon="pi pi-trash"
        rounded text severity="danger" size="small"
        onClick={() => confirmDelete(u)}
        tooltip="Delete"
        tooltipOptions={{ position: 'top' }}
      />
    </div>
  )

  const toolbarLeft = (
    <div className="flex items-center gap-3">
      <div style={{
        width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
        background: 'rgb(239 68 68 / 0.12)', border: '1px solid rgb(239 68 68 / 0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Users size={16} style={{ color: 'rgb(239 68 68)' }} />
      </div>
      <div>
        <h1 className="font-bold" style={{ color: 'rgb(226 232 240)' }}>Users</h1>
        <p className="text-xs" style={{ color: 'rgb(100 116 139)' }}>{users.length} total</p>
      </div>
    </div>
  )

  const toolbarRight = (
    <Button
      label="New User"
      icon="pi pi-plus"
      onClick={() => setCreateVisible(true)}
      style={{
        background: 'linear-gradient(135deg, rgb(139 92 246), rgb(109 40 217))',
        border: 'none',
        color: 'white',
      }}
    />
  )

  const createFooter = (
    <div className="flex gap-3 justify-end pt-2">
      <Button label="Cancel" icon="pi pi-times" severity="secondary" text onClick={() => setCreateVisible(false)} />
      <Button
        label={submitting ? 'Creating…' : 'Create User'}
        icon={submitting ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
        disabled={submitting}
        onClick={handleCreate}
        style={{ background: 'linear-gradient(135deg, rgb(139 92 246), rgb(109 40 217))', border: 'none', color: 'white' }}
      />
    </div>
  )

  const editFooter = (
    <div className="flex gap-3 justify-end pt-2">
      <Button label="Cancel" icon="pi pi-times" severity="secondary" text onClick={() => setEditUser(null)} />
      <Button
        label={submitting ? 'Saving…' : 'Save Role'}
        icon={submitting ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
        disabled={submitting}
        onClick={handleEditRole}
        style={{ background: 'linear-gradient(135deg, rgb(139 92 246), rgb(109 40 217))', border: 'none', color: 'white' }}
      />
    </div>
  )

  return (
    <Layout>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
        <Toolbar
          start={toolbarLeft}
          end={toolbarRight}
          style={{ background: 'rgb(17 19 30)', border: '1px solid rgb(39 43 65)', borderRadius: '0.75rem' }}
        />

        <DataTable
          value={users}
          loading={loading}
          emptyMessage={<p className="text-center py-8" style={{ color: 'rgb(100 116 139)' }}>No users found.</p>}
          style={{ background: 'rgb(17 19 30)', border: '1px solid rgb(39 43 65)', borderRadius: '0.75rem' }}
          stripedRows
          globalFilterFields={['email', 'role']}
        >
          <Column header="User" body={emailTemplate} style={{ minWidth: '200px' }} />
          <Column header="Role" body={roleTemplate} style={{ width: '120px' }} />
          <Column header="Joined" body={joinedTemplate} style={{ width: '130px' }} />
          <Column header="" body={actionsTemplate} style={{ width: '80px' }} />
        </DataTable>
      </div>

      {/* Create user dialog */}
      <Dialog
        header="New User"
        visible={createVisible}
        onHide={() => setCreateVisible(false)}
        footer={createFooter}
        style={{ width: '480px' }}
        modal draggable={false} resizable={false}
      >
        <div className="space-y-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="label-field">Email *</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="student@uni.edu"
              className="input-field"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label-field">Name</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
              className="input-field"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label-field">Password *</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="input-field"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label-field">Role</label>
            <Dropdown
              value={createForm.role}
              options={ROLES}
              onChange={(e) => setCreateForm((f) => ({ ...f, role: e.value }))}
              optionLabel="label"
              optionValue="value"
              className="w-full"
            />
          </div>
        </div>
      </Dialog>

      {/* Edit role dialog */}
      <Dialog
        header={`Change Role — ${editUser?.email}`}
        visible={!!editUser}
        onHide={() => setEditUser(null)}
        footer={editFooter}
        style={{ width: '360px' }}
        modal draggable={false} resizable={false}
      >
        <div className="pt-2">
          <label className="label-field block mb-1.5">New Role</label>
          <Dropdown
            value={editRole}
            options={ROLES}
            onChange={(e) => setEditRole(e.value)}
            optionLabel="label"
            optionValue="value"
            className="w-full"
          />
        </div>
      </Dialog>
    </Layout>
  )
}
