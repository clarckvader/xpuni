import axios, { AxiosInstance, AxiosError } from 'axios'
import type * as Types from '@/types/api'

const rawBase = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000'
const baseURL = (rawBase as string).replace(/\/$/, '') + '/api'

class ApiClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  // Normalize backend responses which often wrap payloads as { data: ... }
  private normalize<T>(response: { data: any }): T {
    const d = response.data
    if (d && typeof d === 'object' && Object.prototype.hasOwnProperty.call(d, 'data')) {
      return d.data as T
    }
    return d as T
  }

  private setupInterceptors() {
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<Types.ApiError>) => {
        if (error.response?.status === 401) {
          this.token = null
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }
        return Promise.reject(error)
      },
    )
  }

  setToken(token: string | null) {
    this.token = token
  }

  getToken() {
    return this.token
  }

  // Instance helper for existing callers that use apiClient.getErrorMessage(err)
  getErrorMessage(error: unknown): string {
    return ApiClient.getErrorMessage(error)
  }

  // Health checks
  async health() {
    const response = await this.client.get<Types.HealthResponse>('/health')
    return this.normalize<Types.HealthResponse>(response)
  }

  // Auth endpoints
  async register(data: Types.RegisterRequest) {
    const response = await this.client.post<Types.AuthResponse>('/auth/register', data)
    return this.normalize<Types.AuthResponse>(response)
  }

  async login(data: Types.LoginRequest) {
    const response = await this.client.post<Types.AuthResponse>('/auth/login', data)
    return this.normalize<Types.AuthResponse>(response)
  }

  async getProfile() {
    const response = await this.client.get<Types.User>('/auth/me')
    return this.normalize<Types.User>(response)
  }

  // User endpoints
  async listUsers(page = 1, limit = 20) {
    const response = await this.client.get<{ data: Types.User[] }>('/users', { params: { page, limit } })
    return (response.data as any).data as Types.User[]
  }

  async createUser(data: Types.RegisterRequest) {
    const response = await this.client.post<Types.User>('/users', data)
    return this.normalize<Types.User>(response)
  }

  async updateUser(id: string, data: Partial<Types.User>) {
    const response = await this.client.patch<Types.User>(`/users/${id}/role`, { role: data.role })
    return this.normalize<Types.User>(response)
  }

  async deleteUser(id: string) {
    await this.client.delete(`/users/${id}`)
  }

  // Activity endpoints
  async listActivities(page = 1, limit = 20, search?: string) {
    const response = await this.client.get<{ data: Types.Activity[] }>('/activities', { params: { page, limit, search } })
    return (response.data as any).data as Types.Activity[]
  }

  async getActivity(id: string) {
    const response = await this.client.get<Types.Activity>(`/activities/${id}`)
    return this.normalize<Types.Activity>(response)
  }

  async createActivity(data: Types.CreateActivityRequest) {
    const payload = { title: data.title, description: data.description, pointsReward: data.points }
    const response = await this.client.post<Types.Activity>('/activities', payload)
    return this.normalize<Types.Activity>(response)
  }

  async updateActivity(id: string, data: Types.UpdateActivityRequest) {
    const payload: any = {}
    if (data.title !== undefined) payload.title = data.title
    if (data.description !== undefined) payload.description = data.description
    if (data.points !== undefined) payload.pointsReward = data.points
    const response = await this.client.patch<Types.Activity>(`/activities/${id}`, payload)
    return this.normalize<Types.Activity>(response)
  }

  async deleteActivity(id: string) {
    await this.client.delete(`/activities/${id}`)
  }

  // Submission endpoints
  async listSubmissions(
    page = 1,
    limit = 20,
    status?: string,
    activity_id?: string,
  ) {
    const response = await this.client.get<{ data: Types.SubmissionWithActivity[] }>('/submissions', { params: { page, limit, status, activity_id } })
    return (response.data as any).data as Types.SubmissionWithActivity[]
  }

  async getSubmission(id: string) {
    const response = await this.client.get<Types.SubmissionWithActivity>(`/submissions/${id}`)
    return this.normalize<Types.SubmissionWithActivity>(response)
  }

  async createSubmission(data: Types.CreateSubmissionRequest) {
    const formData = new FormData()
    formData.append('activity_id', String((data as any).activity_id))
    if ((data as any).description) formData.append('description', (data as any).description)
    // backend expects file field named `file`
    if ((data as any).file) {
      formData.append('file', (data as any).file)
    } else if ((data as any).proof) {
      formData.append('file', (data as any).proof)
    }

    const response = await this.client.post<Types.Submission>('/submissions', formData, { headers: { 'Content-Type': undefined } })
    return this.normalize<Types.Submission>(response)
  }

  async approveSubmission(id: string, data: Types.ApproveSubmissionRequest) {
    const response = await this.client.patch<Types.Submission>(`/submissions/${id}/approve`, data)
    return this.normalize<Types.Submission>(response)
  }

  async rejectSubmission(id: string, data: Types.RejectSubmissionRequest) {
    const response = await this.client.patch<Types.Submission>(`/submissions/${id}/reject`, data)
    return this.normalize<Types.Submission>(response)
  }

  // Reward endpoints
  async listRewards(page = 1, limit = 20) {
    const response = await this.client.get<{ data: Types.Reward[] }>('/rewards', { params: { page, limit } })
    return (response.data as any).data as Types.Reward[]
  }

  async getReward(id: string) {
    const response = await this.client.get<Types.Reward>(`/rewards/${id}`)
    return this.normalize<Types.Reward>(response)
  }

  async createReward(data: Types.CreateRewardRequest) {
    // Backend expects JSON for creating a reward. Map frontend request to backend shape.
    const payload: any = {
      name: data.title,
      description: data.description,
      pointsCost: data.points_cost,
      rewardType: 'PHYSICAL',
      stock: data.quantity_available || null,
    }

    const response = await this.client.post<any>('/rewards', payload)
    const created = this.normalize<any>(response)

    // If an image was provided, upload it to the dedicated endpoint
    if (data.image && created?.id) {
      const fd = new FormData()
      fd.append('image', data.image)
      await this.client.post(`/rewards/${created.id}/image`, fd, { headers: { 'Content-Type': undefined } })
    }

    return created as Types.Reward
  }

  async updateReward(id: string, data: Types.UpdateRewardRequest) {
    // Map frontend update shape to backend JSON fields
    const payload: any = {}
    if ((data as any).title) payload.name = (data as any).title
    if ((data as any).description) payload.description = (data as any).description
    if ((data as any).points_cost !== undefined) payload.pointsCost = (data as any).points_cost
    if ((data as any).quantity_available !== undefined) payload.stock = (data as any).quantity_available || null

    const response = await this.client.patch<any>(`/rewards/${id}`, payload)
    const updated = this.normalize<any>(response)

    if ((data as any).image) {
      const fd = new FormData()
      fd.append('image', (data as any).image)
      await this.client.post(`/rewards/${id}/image`, fd, { headers: { 'Content-Type': undefined } })
    }

    return updated as Types.Reward
  }

  async deleteReward(id: string) {
    await this.client.delete(`/rewards/${id}`)
  }

  // Redemption endpoints
  async listRedemptions(page = 1, limit = 20, status?: string) {
    const response = await this.client.get<{ data: Types.RedemptionWithDetails[] }>('/redemptions', { params: { page, limit, status } })
    return (response.data as any).data as Types.RedemptionWithDetails[]
  }

  async getRedemption(id: string) {
    const response = await this.client.get<Types.RedemptionWithDetails>(`/redemptions/${id}`)
    return this.normalize<Types.RedemptionWithDetails>(response)
  }

  async createRedemption(data: Types.CreateRedemptionRequest) {
    const payload = { rewardId: Number(data.reward_id) }
    const response = await this.client.post<Types.Redemption>('/redemptions', payload)
    return this.normalize<Types.Redemption>(response)
  }

  async completeRedemption(
    id: string,
    data: Types.CompleteRedemptionRequest,
  ) {
    const payload: any = {}
    if ((data as any).notes !== undefined) payload.notes = (data as any).notes
    const response = await this.client.patch<Types.Redemption>(`/redemptions/${id}/complete`, payload)
    return this.normalize<Types.Redemption>(response)
  }

  // Helper method to extract error message
  static getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error) {
        return error.response.data.error
      }
      if (error.response?.data?.message) {
        return error.response.data.message
      }
      if (error.message) {
        return error.message
      }
    }
    return 'An error occurred'
  }
}

export const apiClient = new ApiClient()
