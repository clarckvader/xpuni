import { useState, useCallback } from 'react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  message: string
  type: NotificationType
  duration?: number
  txHash?: string
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const show = useCallback(
    (
      message: string,
      type: NotificationType = 'info',
      duration = 5000,
      txHash?: string,
    ) => {
      const id = Math.random().toString(36).substr(2, 9)
      const notification: Notification = { id, message, type, duration, txHash }

      setNotifications((prev) => [...prev, notification])

      if (duration > 0) {
        setTimeout(() => {
          remove(id)
        }, duration)
      }

      return id
    },
    [],
  )

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const success = useCallback(
    (message: string, txHash?: string) => {
      show(message, 'success', 5000, txHash)
    },
    [show],
  )

  const error = useCallback(
    (message: string) => {
      show(message, 'error', 7000)
    },
    [show],
  )

  const info = useCallback(
    (message: string) => {
      show(message, 'info', 5000)
    },
    [show],
  )

  const warning = useCallback(
    (message: string) => {
      show(message, 'warning', 5000)
    },
    [show],
  )

  return { notifications, show, remove, success, error, info, warning }
}
