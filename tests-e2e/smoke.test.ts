import { test, expect } from '@playwright/test'

test.describe('Robot Delivery Simulator', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check if the page title is present
    await expect(page).toHaveTitle(/Robot.*Simulator/i)
    
    // Check for main heading or simulator content
    const heading = page.locator('h1, [role="heading"]')
    await expect(heading.first()).toBeVisible()
  })

  test('should display login form for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    
    // Look for login form elements
    const loginForm = page.locator('form, [data-testid="login-form"]')
    await expect(loginForm.first()).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to leaderboard page', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load and find the leaderboard tab
    const leaderboardTab = page.locator('[role="tab"]:has-text("Рейтинг"), [data-testid="leaderboard-tab"]')
    await leaderboardTab.first().click({ timeout: 10000 })
    
    // Check if leaderboard content is visible
    const leaderboardContent = page.locator('[data-testid="leaderboard"]')
    await expect(leaderboardContent.first()).toBeVisible()
  })
})
