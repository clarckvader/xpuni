// Date formatting
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export const formatRelativeTime = (date: string | Date): string => {
  const d = new Date(date)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(d)
}

// String formatting
export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str
  return `${str.substring(0, length)}...`
}

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// File handling
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Stellar explorer helpers
const STELLAR_EXPERT_BASE = (testnet: boolean) =>
  `https://stellar.expert/explorer/${testnet ? 'testnet' : 'public'}`

export const getStellarExpertTxLink = (txHash: string, testnet = true): string =>
  `${STELLAR_EXPERT_BASE(testnet)}/tx/${txHash}`

export const getStellarExpertAccountLink = (address: string, testnet = true): string =>
  `${STELLAR_EXPERT_BASE(testnet)}/account/${address}`

export const getStellarExpertContractLink = (contractId: string, testnet = true): string =>
  `${STELLAR_EXPERT_BASE(testnet)}/contract/${contractId}`

/** @deprecated use getStellarExpertContractLink */
export const getSorobanExplorerLink = getStellarExpertContractLink

export const formatAddress = (address: string, chars = 6): string => {
  if (!address || address.length <= chars * 2) return address
  return `${address.substring(0, chars)}…${address.substring(address.length - chars)}`
}

export const formatTxHash = (hash: string, length = 16): string => {
  if (hash.length <= length) return hash
  return `${hash.substring(0, length / 2)}...${hash.substring(hash.length - length / 2)}`
}

// Array helpers
export const unique = <T,>(array: T[], key?: (item: T) => any): T[] => {
  if (!key) {
    return [...new Set(array)]
  }
  const seen = new Set()
  return array.filter((item) => {
    const k = key(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export const groupBy = <T,>(
  array: T[],
  key: (item: T) => string | number,
): Record<string | number, T[]> => {
  return array.reduce(
    (acc, item) => {
      const k = key(item)
      if (!acc[k]) acc[k] = []
      acc[k].push(item)
      return acc
    },
    {} as Record<string | number, T[]>,
  )
}

// Status badge helpers
export const getStatusColor = (
  status: string,
): 'success' | 'warning' | 'error' | 'primary' => {
  switch (status) {
    case 'approved':
    case 'completed':
    case 'success':
      return 'success'
    case 'pending':
    case 'in_progress':
      return 'warning'
    case 'rejected':
    case 'cancelled':
    case 'failed':
    case 'error':
      return 'error'
    default:
      return 'primary'
  }
}

export const getStatusLabel = (status: string): string => {
  return capitalize(status.replace(/_/g, ' '))
}
