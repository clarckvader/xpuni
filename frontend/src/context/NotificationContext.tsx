import React, { createContext } from 'react'
import { useNotification, type NotificationType } from '@/hooks/useNotification'

interface NotificationContextType {
  show: (
    message: string,
    type?: NotificationType,
    duration?: number,
    txHash?: string,
  ) => string
  remove: (id: string) => void
  success: (message: string, txHash?: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

export const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
)

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notification = useNotification()

  return (
    <NotificationContext.Provider value={notification}>
      {children}
    </NotificationContext.Provider>
  )
}
