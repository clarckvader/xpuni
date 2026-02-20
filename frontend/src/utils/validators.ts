import { z } from 'zod'

// User validators
export const emailSchema = z.string().email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const registerSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  role: z.enum(['STUDENT', 'REVIEWER', 'ADMIN']).optional(),
})

// Activity validators
export const activitySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  points: z.number().min(1, 'Points must be at least 1'),
  category: z.string().min(1, 'Category is required'),
})

// Reward validators
export const rewardSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  points_cost: z.number().min(1, 'Points cost must be at least 1'),
  quantity_available: z.number().min(1, 'Quantity must be at least 1'),
})

// File validators
export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'Only JPEG, PNG, and WebP images are allowed',
  )

export const proofFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
  .refine(
    (file) =>
      ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(
        file.type,
      ),
    'Only JPEG, PNG, WebP, and PDF files are allowed',
  )

// Utility functions
export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}

export const validatePassword = (password: string): boolean => {
  try {
    passwordSchema.parse(password)
    return true
  } catch {
    return false
  }
}

export const getValidationError = (
  schema: z.ZodSchema,
  data: unknown,
): string | null => {
  try {
    schema.parse(data)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Validation failed'
    }
    return 'Validation failed'
  }
}
