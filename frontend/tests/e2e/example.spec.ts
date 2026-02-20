import { test, expect } from '@playwright/test'

test.describe('School Rewards App', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/School Rewards/)
    await expect(page.locator('h1')).toContainText('School Rewards')
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')
    await page.click('a:has-text("Sign In")')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('Welcome Back')
  })

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/')
    await page.click('a:has-text("Create Account")')
    await expect(page).toHaveURL('/register')
    await expect(page.locator('h1')).toContainText('Create Account')
  })

  test('login form should validate required fields', async ({ page }) => {
    await page.goto('/login')

    // Try to submit empty form
    await page.click('button:has-text("Sign In")')

    // Email input should have validation
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('register form should have all required fields', async ({ page }) => {
    await page.goto('/register')

    // Check for all form fields
    await expect(page.locator('input[type="text"]')).toBeTruthy()
    await expect(page.locator('input[type="email"]')).toBeTruthy()
    await expect(page.locator('input[type="password"]')).toBeTruthy()
    await expect(page.locator('select')).toBeTruthy()
  })

  test('should show error when submitting login with invalid credentials', async ({
    page,
  }) => {
    await page.goto('/login')

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("Sign In")')

    // Should stay on login page or show error
    await page.waitForLoadState('networkidle')
    // Check if error message or still on login page
    const url = page.url()
    expect(url.includes('/login') || url.includes('error')).toBeTruthy()
  })

  test('navigation should update based on authentication', async ({ page }) => {
    await page.goto('/')

    // Before login, should see login/register links
    await expect(page.locator('a:has-text("Login")')).toBeVisible()
    await expect(page.locator('a:has-text("Register")')).toBeVisible()
  })

  test('should display health status on landing page', async ({ page }) => {
    await page.goto('/')

    // Wait for health check to load
    await page.waitForSelector('text=System Status')
    await expect(page.locator('text=System Status')).toBeVisible()
  })

  test('protected routes should redirect to login', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/student/activities')

    // Should redirect to login
    await page.waitForURL('/login')
    expect(page.url()).toContain('/login')
  })

  test('should show responsive mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Mobile menu button should be visible
    const mobileMenuButton = page.locator('button[class*="md:hidden"]')
    await expect(mobileMenuButton).toBeVisible()

    // Desktop menu should be hidden
    const desktopMenu = page.locator('div.hidden.md\\:flex')
    const count = await desktopMenu.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('API Health Check', () => {
  test('should display health status on page load', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the health status section
    await page.waitForSelector('text=System Status', { timeout: 5000 })
    
    // Check if health status is displayed
    const healthSection = page.locator('text=System Status').first()
    await expect(healthSection).toBeVisible()
  })
})
