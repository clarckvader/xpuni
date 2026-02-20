import { useNotification } from '@/hooks/useNotification'
import Toast from './Toast'

export default function Toaster() {
  const { notifications, remove } = useNotification()

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onRemove={remove}
        />
      ))}
    </div>
  )
}
