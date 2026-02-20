import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { apiClient } from '@/services/api'
import { useNotificationContext } from '@/hooks/useNotificationContext'

const STELLAR_EXPERT = 'https://stellar.expert/explorer/testnet'

type RawSubmission = {
  id: number
  description: string
  status: string
  submittedAt: string
  reviewedAt: string | null
  activityId: number
  txHash: string | null
  badgeTxHash: string | null
}

type RawRedemption = {
  id: number
  pointsSpent: number
  status: string
  redeemedAt: string
  txHash: string | null
  redemptionTxHash: string | null
  reward: { name: string } | null
}

type TxEntry = {
  key: string
  date: string
  type: 'POINTS_MINT' | 'BADGE' | 'POINTS_BURN' | 'REDEMPTION_RECORD'
  label: string
  sublabel: string
  amount: string
  amountColor: string
  txHash: string
  explorerUrl: string
}

function buildEntries(subs: RawSubmission[], reds: RawRedemption[]): TxEntry[] {
  const entries: TxEntry[] = []

  for (const s of subs) {
    if (s.status !== 'APPROVED') continue
    const date = s.reviewedAt ?? s.submittedAt

    if (s.txHash) {
      entries.push({
        key: `sub-points-${s.id}`,
        date,
        type: 'POINTS_MINT',
        label: 'XPU Points Minted',
        sublabel: `Activity #${s.activityId} · Sub #${s.id}`,
        amount: '+ Points',
        amountColor: 'rgb(16 185 129)',
        txHash: s.txHash,
        explorerUrl: `${STELLAR_EXPERT}/tx/${s.txHash}`,
      })
    }

    if (s.badgeTxHash) {
      entries.push({
        key: `sub-badge-${s.id}`,
        date,
        type: 'BADGE',
        label: 'Achievement Badge Issued',
        sublabel: `Activity #${s.activityId} — ${s.description.substring(0, 60)}${s.description.length > 60 ? '…' : ''}`,
        amount: '🏅 Badge',
        amountColor: 'rgb(245 158 11)',
        txHash: s.badgeTxHash,
        explorerUrl: `${STELLAR_EXPERT}/tx/${s.badgeTxHash}`,
      })
    }
  }

  for (const r of reds) {
    if (r.txHash) {
      entries.push({
        key: `red-burn-${r.id}`,
        date: r.redeemedAt,
        type: 'POINTS_BURN',
        label: 'XPU Points Burned',
        sublabel: r.reward?.name ?? `Redemption #${r.id}`,
        amount: `- ${r.pointsSpent} pts`,
        amountColor: 'rgb(239 68 68)',
        txHash: r.txHash,
        explorerUrl: `${STELLAR_EXPERT}/tx/${r.txHash}`,
      })
    }

    if (r.redemptionTxHash) {
      entries.push({
        key: `red-record-${r.id}`,
        date: r.redeemedAt,
        type: 'REDEMPTION_RECORD',
        label: 'Redemption Recorded On-Chain',
        sublabel: r.reward?.name ?? `Redemption #${r.id}`,
        amount: '📝 Recorded',
        amountColor: 'rgb(139 92 246)',
        txHash: r.redemptionTxHash,
        explorerUrl: `${STELLAR_EXPERT}/tx/${r.redemptionTxHash}`,
      })
    }
  }

  // Sort newest first
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const TYPE_META: Record<string, { icon: string; bg: string; border: string }> = {
  POINTS_MINT:       { icon: '⚡', bg: 'rgb(16 185 129 / 0.1)',  border: 'rgb(16 185 129 / 0.3)' },
  BADGE:             { icon: '🏅', bg: 'rgb(245 158 11 / 0.1)',  border: 'rgb(245 158 11 / 0.3)' },
  POINTS_BURN:       { icon: '🔥', bg: 'rgb(239 68 68 / 0.1)',   border: 'rgb(239 68 68 / 0.3)' },
  REDEMPTION_RECORD: { icon: '📝', bg: 'rgb(139 92 246 / 0.1)',  border: 'rgb(139 92 246 / 0.3)' },
}

function shortHash(hash: string) {
  return `${hash.substring(0, 8)}…${hash.substring(hash.length - 8)}`
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy full hash'}
      style={{ color: copied ? 'rgb(16 185 129)' : 'rgb(100 116 139)', lineHeight: 1, transition: 'color 0.2s', fontSize: '0.75rem' }}
    >
      {copied ? '✓' : '⎘'}
    </button>
  )
}

export default function StudentTransactionsPage() {
  const [submissions, setSubmissions] = useState<RawSubmission[]>([])
  const [redemptions, setRedemptions] = useState<RawRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const notify = useNotificationContext()

  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, redRes] = await Promise.all([
          apiClient.listSubmissions(1, 200, 'APPROVED'),
          apiClient.listRedemptions(1, 200),
        ])
        setSubmissions(subRes as unknown as RawSubmission[])
        setRedemptions(redRes as unknown as RawRedemption[])
      } catch {
        notify.error('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const entries = buildEntries(submissions, redemptions)
  const hasTxData = entries.length > 0

  return (
    <Layout title="On-Chain Transactions" subtitle="Your verified activity on the Stellar Testnet network">
      <div className="space-y-5 animate-fade-in">

        {/* Stats bar */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Points Minted', count: entries.filter(e => e.type === 'POINTS_MINT').length,       color: 'rgb(16 185 129)' },
              { label: 'Badges Issued', count: entries.filter(e => e.type === 'BADGE').length,             color: 'rgb(245 158 11)' },
              { label: 'Points Burned', count: entries.filter(e => e.type === 'POINTS_BURN').length,       color: 'rgb(239 68 68)'  },
              { label: 'Redemptions',   count: entries.filter(e => e.type === 'REDEMPTION_RECORD').length, color: 'rgb(139 92 246)' },
            ].map(s => (
              <div
                key={s.label}
                className="card px-4 py-3 text-center"
                style={{ borderColor: `${s.color}20` }}
              >
                <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.count}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgb(100 116 139)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Network info */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{
            background: 'rgb(6 182 212 / 0.05)',
            border: '1px solid rgb(6 182 212 / 0.2)',
          }}
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgb(100 116 139)' }}>
            <span className="status-dot status-dot-online" />
            <span>Stellar Testnet</span>
            <span style={{ color: 'rgb(39 43 65)' }}>·</span>
            <span>{entries.length} on-chain transaction{entries.length !== 1 ? 's' : ''}</span>
          </div>
          <a
            href={`${STELLAR_EXPERT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-75 transition-opacity"
            style={{ color: 'rgb(6 182 212)' }}
          >
            Open Stellar Expert ↗
          </a>
        </div>

        {/* Transactions list */}
        {loading ? (
          <div className="card p-12 text-center">
            <span className="status-dot status-dot-pending mx-auto block mb-3" style={{ width: '0.75rem', height: '0.75rem' }} />
            <p style={{ color: 'rgb(100 116 139)' }}>Fetching on-chain data…</p>
          </div>
        ) : !hasTxData ? (
          <div className="card p-12 text-center space-y-3">
            <p className="text-4xl">🔗</p>
            <p className="font-semibold" style={{ color: 'rgb(148 163 184)' }}>No on-chain transactions yet</p>
            <p className="text-sm" style={{ color: 'rgb(100 116 139)' }}>
              Transactions will appear here once your activity submissions are approved by a reviewer.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Table header */}
            <div
              className="grid items-center px-5 py-3 text-xs font-bold uppercase tracking-wider"
              style={{
                gridTemplateColumns: '2.5rem 1fr 6rem 12rem 5rem',
                background: 'rgb(26 29 44)',
                borderBottom: '1px solid rgb(39 43 65)',
                color: 'rgb(100 116 139)',
              }}
            >
              <span />
              <span>Transaction</span>
              <span>Amount</span>
              <span>TX Hash</span>
              <span style={{ textAlign: 'right' }}>Date</span>
            </div>

            {/* Rows */}
            {entries.map((entry, i) => {
              const meta = TYPE_META[entry.type]!
              return (
                <div
                  key={entry.key}
                  className="grid items-center px-5 py-4"
                  style={{
                    gridTemplateColumns: '2.5rem 1fr 6rem 12rem 5rem',
                    borderBottom: i < entries.length - 1 ? '1px solid rgb(39 43 65)' : 'none',
                    transition: 'background 0.15s',
                    gap: '0.5rem',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgb(26 29 44)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '0.5rem',
                      background: meta.bg,
                      border: `1px solid ${meta.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      flexShrink: 0,
                    }}
                  >
                    {meta.icon}
                  </div>

                  {/* Label */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'rgb(226 232 240)' }}>
                      {entry.label}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'rgb(100 116 139)' }}>
                      {entry.sublabel}
                    </p>
                  </div>

                  {/* Amount */}
                  <p className="text-sm font-bold" style={{ color: entry.amountColor }}>
                    {entry.amount}
                  </p>

                  {/* TX Hash */}
                  <div className="flex items-center gap-2">
                    <a
                      href={entry.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on Stellar Expert"
                      className="hash-text text-xs hover:opacity-70 transition-opacity"
                    >
                      {shortHash(entry.txHash)}
                    </a>
                    <span style={{ color: 'rgb(6 182 212)', fontSize: '0.65rem', flexShrink: 0 }}>↗</span>
                    <CopyBtn value={entry.txHash} />
                  </div>

                  {/* Date */}
                  <p className="text-xs" style={{ color: 'rgb(100 116 139)', textAlign: 'right' }}>
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <br />
                    <span style={{ fontSize: '0.65rem' }}>
                      {new Date(entry.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Pending notice */}
        {!loading && submissions.some(s => s.status === 'APPROVED' && !s.txHash && !s.badgeTxHash) && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgb(245 158 11 / 0.06)',
              border: '1px solid rgb(245 158 11 / 0.2)',
            }}
          >
            <span style={{ color: 'rgb(245 158 11)', fontSize: '1rem' }}>⚠</span>
            <div style={{ color: 'rgb(148 163 184)' }}>
              <span className="font-semibold" style={{ color: 'rgb(245 158 11)' }}>Some approved submissions have no on-chain TX yet.</span>
              {' '}This happens when the Stellar RPC or smart contract wasn't configured at approval time.
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
