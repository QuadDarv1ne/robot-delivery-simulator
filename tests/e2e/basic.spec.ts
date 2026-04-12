import { test, expect } from '@playwright/test'

test.describe('Robot Delivery Simulator E2E', () => {
  test('home page loads correctly', async ({ page }) => {
    await page.goto('/')
    
    // Page should load and show the title
    await expect(page).toHaveTitle(/Robot Delivery Simulator/)
    await expect(page.getByText('Robot Delivery Simulator')).toBeVisible()
  })

  test('health check endpoint works', async ({ request }) => {
    const response = await request.get('/api/health')
    
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)
    
    const body = await response.json()
    expect(body.status).toBeDefined()
  })

  test('login form is accessible', async ({ page }) => {
    await page.goto('/')
    
    // Look for login button or form
    const loginButton = page.getByRole('button', { name: /войти|login/i })
    if (await loginButton.isVisible()) {
      await loginButton.click()
      await expect(page.getByText('Вход')).toBeVisible()
    }
  })

  test('API docs are available', async ({ request }) => {
    const response = await request.get('/api/docs')
    expect(response.ok()).toBeTruthy()
  })

  test('scenarios API is accessible', async ({ request }) => {
    const response = await request.get('/api/scenarios')
    
    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)
    
    const body = await response.json()
    expect(body).toHaveProperty('scenarios')
    expect(Array.isArray(body.scenarios)).toBe(true)
  })

  test('algorithms API is accessible', async ({ request }) => {
    const response = await request.get('/api/algorithms')
    
    // May return 401 if not authenticated
    expect(response.status()).toBeGreaterThanOrEqual(200)
    expect(response.status()).toBeLessThan(500)
  })
})
