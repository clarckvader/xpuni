// User types
export type UserRole = 'ADMIN' | 'REVIEWER' | 'STUDENT'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  stellar_key?: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
  role?: UserRole
}

// Activity types
export interface Activity {
  id: string
  title: string
  description: string
  points: number
  category: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ActivityWithDetails extends Activity {
  status?: 'not_started' | 'in_progress' | 'submitted' | 'approved'
}

export interface CreateActivityRequest {
  title: string
  description: string
  points: number
  category: string
}

export interface UpdateActivityRequest {
  title?: string
  description?: string
  points?: number
  category?: string
}

// Submission types
export interface Submission {
  id: string
  activity_id: string
  user_id: string
  proof_url: string
  status: 'pending' | 'approved' | 'rejected'
  reviewer_comment?: string
  created_at: string
  updated_at: string
}

export interface SubmissionWithActivity extends Submission {
  activity: Activity
  student_name: string
  student_email: string
}

export interface CreateSubmissionRequest {
  activity_id: string
  description?: string
  // backend field is `file`
  proof?: File
  file?: File
}

export interface ApproveSubmissionRequest {
  // backend expects `notes`
  notes?: string
}

export interface RejectSubmissionRequest {
  notes: string
}

// Reward types
export interface Reward {
  id: string
  title: string
  description: string
  points_cost: number
  image_url?: string
  quantity_available: number
  created_at: string
  updated_at: string
}

export interface CreateRewardRequest {
  title: string
  description: string
  points_cost: number
  quantity_available: number
  image?: File
}

export interface UpdateRewardRequest {
  title?: string
  description?: string
  points_cost?: number
  quantity_available?: number
  image?: File
}

// Redemption types
export interface Redemption {
  id: string
  user_id: string
  reward_id: string
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface RedemptionWithDetails extends Redemption {
  reward: Reward
  user_name: string
}

export interface CreateRedemptionRequest {
  reward_id: string
}

export interface CompleteRedemptionRequest {
  // backend expects optional `notes` when completing a redemption
  notes?: string
}

// Health check types
export interface HealthResponse {
  status: string
  message: string
  database: string
  contracts?: {
    badge_issuer?: string
    token_admin?: string
  }
  rpc_available?: boolean
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// API Error types
export interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

// File upload types
export interface FileUploadResponse {
  url: string
  file_name: string
  size: number
}
