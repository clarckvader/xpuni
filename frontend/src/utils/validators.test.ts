import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  getValidationError,
  loginSchema,
  registerSchema,
} from './validators'

describe('Email Validation', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true)
  })

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('user@')).toBe(false)
    expect(validateEmail('user@domain')).toBe(false)
  })
})

describe('Password Validation', () => {
  it('should accept passwords with 6+ characters', () => {
    expect(validatePassword('password123')).toBe(true)
    expect(validatePassword('abc123')).toBe(true)
  })

  it('should reject passwords with less than 6 characters', () => {
    expect(validatePassword('pass')).toBe(false)
    expect(validatePassword('12345')).toBe(false)
  })
})

describe('Login Schema', () => {
  it('should validate correct login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid login data', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })
})

describe('Register Schema', () => {
  it('should validate correct registration data', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'John Doe',
      password: 'password123',
      role: 'STUDENT',
    })
    expect(result.success).toBe(true)
  })

  it('should reject short names', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      name: 'J',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })
})

describe('getValidationError', () => {
  it('should return null for valid data', () => {
    const error = getValidationError(loginSchema, {
      email: 'user@example.com',
      password: 'password123',
    })
    expect(error).toBeNull()
  })

  it('should return error message for invalid data', () => {
    const error = getValidationError(loginSchema, {
      email: 'invalid-email',
      password: 'short',
    })
    expect(error).toBeTruthy()
    expect(typeof error).toBe('string')
  })
})
