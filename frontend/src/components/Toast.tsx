import { useState } from 'react'
import type { Notification } from '@/hooks/useNotification'

interface ToastProps {
  notification: Notification
  onRemove: (id: string) => void
}

export default function Toast({ notification, onRemove }: ToastProps) {
  const [copied, setCopied] = useState(false)

  const bgColor = {
    success: 'bg-success',
    error: 'bg-error',
    info: 'bg-primary',
    warning: 'bg-warning',
  }[notification.type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }[notification.type]

  const handleCopyTxHash = () => {
    if (notification.txHash) {
      navigator.clipboard.writeText(notification.txHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={`${bgColor} text-white rounded-lg shadow-lg p-4 mb-3 flex items-start gap-3`}>
      <span className="text-xl font-bold flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <p className="font-semibold">{notification.message}</p>
        {notification.txHash && (
          <button
            onClick={handleCopyTxHash}
            className="text-xs mt-2 opacity-80 hover:opacity-100 transition"
          >
            {copied ? 'Copied!' : `TX: ${notification.txHash.substring(0, 16)}...`}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(notification.id)}
        className="flex-shrink-0 text-xl opacity-70 hover:opacity-100 transition"
      >
        ✕
      </button>
    </div>
  )
}
