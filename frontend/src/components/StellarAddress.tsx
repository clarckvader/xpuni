import { useState } from 'react'
import { formatAddress, getStellarExpertAccountLink, getStellarExpertContractLink, getStellarExpertTxLink } from '@/utils/helpers'

type AddressType = 'account' | 'contract' | 'tx'

interface StellarAddressProps {
  address: string
  type?: AddressType
  testnet?: boolean
  /** Show the full address (no truncation) */
  full?: boolean
  /** Chars to show on each side when truncated */
  chars?: number
  className?: string
  /** Show copy button */
  copy?: boolean
  /** Show explorer link */
  explorer?: boolean
}

function getExplorerLink(address: string, type: AddressType, testnet: boolean) {
  if (type === 'tx') return getStellarExpertTxLink(address, testnet)
  if (type === 'contract') return getStellarExpertContractLink(address, testnet)
  return getStellarExpertAccountLink(address, testnet)
}

/** Icon: external link */
function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

/** Icon: copy */
function CopyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

/** Icon: check */
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function StellarAddress({
  address,
  type = 'account',
  testnet = true,
  full = false,
  chars = 6,
  className = '',
  copy = true,
  explorer = true,
}: StellarAddressProps) {
  const [copied, setCopied] = useState(false)

  const display = full ? address : formatAddress(address, chars)
  const explorerUrl = getExplorerLink(address, type, testnet)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <span className={`address-chip ${className}`}>
      <span className="hash-text" title={address}>{display}</span>
      {copy && (
        <button
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
          style={{
            color: copied ? 'rgb(16 185 129)' : 'rgb(100 116 139)',
            transition: 'color 0.2s',
            lineHeight: 1,
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      )}
      {explorer && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="View on Stellar Expert"
          style={{ color: 'rgb(100 116 139)', lineHeight: 1, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgb(6 182 212)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgb(100 116 139)')}
        >
          <ExternalLinkIcon />
        </a>
      )}
    </span>
  )
}

/** Inline tx-hash link — just a styled anchor, no chip */
export function TxLink({ hash, testnet = true, children }: { hash: string; testnet?: boolean; children?: React.ReactNode }) {
  const href = getStellarExpertTxLink(hash, testnet)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hash-text"
      style={{ textDecoration: 'none', transition: 'opacity 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      title="View on Stellar Expert"
    >
      {children ?? formatAddress(hash, 8)}
      {' '}
      <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>↗</span>
    </a>
  )
}
