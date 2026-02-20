import { useState, useCallback } from 'react'
import { apiClient } from '@/services/api'

interface UseApiCallOptions {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

export const useApiCall = <T,>(options?: UseApiCallOptions) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (fn: () => Promise<T>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await fn()
        setData(result)
        options?.onSuccess?.(result)
        return result
      } catch (err) {
        const message = apiClient.getErrorMessage(err)
        setError(message)
        options?.onError?.(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [options],
  )

  return { data, loading, error, execute }
}
