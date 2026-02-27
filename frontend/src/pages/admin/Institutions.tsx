import { useState, useEffect, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toolbar } from 'primereact/toolbar'
import { Building2 } from 'lucide-react'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import type { Institution } from '@/types/api'

const CATEGORIES = ['general', 'food', 'retail', 'services', 'education', 'health', 'entertainment'] as const

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editInst, setEditInst] = useState<Institution | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('general')
  const [submitting, setSubmitting] = useState(false)
  const toast = useRef<Toast>(null)

  const notify = {
    success: (msg: string) => toast.current?.show({ severity: 'success', summary: 'Done', detail: msg, life: 3000 }),
    error: (msg: string) => toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 4000 }),
  }

  const load = async () => {
    try {
      setLoading(true)
      setInstitutions(await apiClient.listInstitutions())
    } catch {
      notify.error('Failed to load partners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditInst(null)
    setName('')
    setDescription('')
    setCategory('general')
    setDialogVisible(true)
  }

  const openEdit = (inst: Institution) => {
    setEditInst(inst)
    setName(inst.name)
    setDescription(inst.description ?? '')
    setCategory(inst.category ?? 'general')
    setDialogVisible(true)
  }

  const closeDialog = () => {
    setDialogVisible(false)
    setEditInst(null)
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      if (editInst) {
        await apiClient.updateInstitution(editInst.id, {
          name: name.trim(),
          description: description.trim() || null,
          category,
        })
        notify.success('Partner updated')
      } else {
        await apiClient.createInstitution({
          name: name.trim(),
          slug: slugify(name.trim()),
          description: description.trim() || undefined,
          category,
        })
        notify.success('Partner created')
      }
      closeDialog()
      load()
    } catch (err) {
      notify.error(apiClient.getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDeactivate = (inst: Institution) => {
    confirmDialog({
      message: `Deactivate "${inst.name}"?`,
      header: 'Deactivate Partner',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await apiClient.deleteInstitution(inst.id)
          notify.success('Partner deactivated')
          load()
        } catch (err) {
          notify.error(apiClient.getErrorMessage(err))
        }
      },
    })
  }

  const nameTemplate = (inst: Institution) => (
    <div className="flex items-center gap-2.5">
      <div style={{
        width: '2rem', height: '2rem', borderRadius: '0.5rem',
        background: 'rgb(139 92 246 / 0.15)', border: '1px solid rgb(139 92 246 / 0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Building2 size={13} style={{ color: 'rgb(139 92 246)' }} />
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'rgb(226 232 240)' }}>{inst.name}</p>
        <p className="text-xs font-mono" style={{ color: 'rgb(100 116 139)' }}>/{inst.slug}</p>
      </div>
    </div>
  )

  const categoryTemplate = (inst: Institution) => (
    <span className="text-xs capitalize" style={{ color: 'rgb(148 163 184)' }}>
      {inst.category}
    </span>
  )

  const statusTemplate = (inst: Institution) => (
    <Tag
      value={inst.status}
      severity={inst.status === 'ACTIVE' ? 'success' : 'danger'}
      style={{ fontSize: '0.7rem' }}
    />
  )

  const actionsTemplate = (inst: Institution) => (
    <div className="flex items-center gap-1">
      <Button icon="pi pi-pencil" rounded text severity="secondary" size="small"
        onClick={() => openEdit(inst)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
      <Button icon="pi pi-trash" rounded text severity="danger" size="small"
        onClick={() => confirmDeactivate(inst)} tooltip="Deactivate" tooltipOptions={{ position: 'top' }} />
    </div>
  )

  return (
    <Layout>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
        <Toolbar
          start={
            <div className="flex items-center gap-3">
              <div style={{
                width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
                background: 'rgb(139 92 246 / 0.15)', border: '1px solid rgb(139 92 246 / 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Building2 size={16} style={{ color: 'rgb(139 92 246)' }} />
              </div>
              <div>
                <h1 className="font-bold" style={{ color: 'rgb(226 232 240)' }}>Partners</h1>
                <p className="text-xs" style={{ color: 'rgb(100 116 139)' }}>{institutions.length} registered</p>
              </div>
            </div>
          }
          end={
            <Button
              label="Add Partner"
              icon="pi pi-plus"
              onClick={openCreate}
              style={{ background: 'linear-gradient(135deg, rgb(139 92 246), rgb(109 40 217))', border: 'none', color: 'white' }}
            />
          }
          style={{ background: 'rgb(17 19 30)', border: '1px solid rgb(39 43 65)', borderRadius: '0.75rem' }}
        />

        <DataTable
          value={institutions}
          loading={loading}
          emptyMessage={
            <div className="text-center py-10">
              <Building2 size={28} style={{ color: 'rgb(100 116 139)', margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'rgb(100 116 139)' }}>No partners yet.</p>
            </div>
          }
          style={{ background: 'rgb(17 19 30)', border: '1px solid rgb(39 43 65)', borderRadius: '0.75rem' }}
          stripedRows
        >
          <Column header="Partner" body={nameTemplate} style={{ minWidth: '200px' }} />
          <Column header="Category" body={categoryTemplate} style={{ width: '130px' }} />
          <Column header="Status" body={statusTemplate} style={{ width: '110px' }} />
          <Column header="" body={actionsTemplate} style={{ width: '90px' }} />
        </DataTable>
      </div>

      <Dialog
        header={editInst ? `Edit: ${editInst.name}` : 'Add Partner'}
        visible={dialogVisible}
        onHide={closeDialog}
        style={{ width: '480px' }}
        modal
        draggable={false}
        resizable={false}
        footer={null}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="label-field" htmlFor="inst-name">Partner Name *</label>
            <input
              id="inst-name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="Coffee House, Bookstore, Gym…"
              required
              autoFocus
              className="input-field"
            />
          </div>

          {/* Slug preview — only on create */}
          {!editInst && name && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{ background: 'rgb(26 29 44)', border: '1px solid rgb(39 43 65)' }}
            >
              <span style={{ color: 'rgb(100 116 139)' }}>Page URL:</span>
              <span className="font-mono" style={{ color: 'rgb(139 92 246)' }}>
                /i/{slugify(name)}
              </span>
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="label-field" htmlFor="inst-desc">Description</label>
            <textarea
              id="inst-desc"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="What students can redeem here…"
              rows={2}
              className="input-field"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="label-field" htmlFor="inst-category">Category</label>
            <select
              id="inst-category"
              value={category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
              className="input-field"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Submit row */}
          <div className="flex gap-3 justify-end pt-3">
            <Button
              type="button"
              label="Cancel"
              severity="secondary"
              text
              onClick={closeDialog}
            />
            <Button
              type="submit"
              label={submitting ? 'Saving…' : editInst ? 'Save Changes' : 'Add Partner'}
              icon={submitting ? 'pi pi-spin pi-spinner' : editInst ? 'pi pi-check' : 'pi pi-building'}
              disabled={submitting || !name.trim()}
              style={{ background: 'linear-gradient(135deg, rgb(139 92 246), rgb(109 40 217))', border: 'none', color: 'white' }}
            />
          </div>
        </form>
      </Dialog>
    </Layout>
  )
}
