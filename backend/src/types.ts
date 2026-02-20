import { Request } from 'express';

export type Role = 'ADMIN' | 'REVIEWER' | 'STUDENT';
export type ActivityStatus = 'ACTIVE' | 'INACTIVE';
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RewardType = 'PHYSICAL' | 'GRADE_BONUS';
export type RedemptionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface JwtPayload {
  id: number;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
