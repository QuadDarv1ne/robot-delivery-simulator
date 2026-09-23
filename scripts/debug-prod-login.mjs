// Отладочный скрипт: логин на проде и сбор ошибок консоли/страницы
import { chromium } from 'playwright-core'

const BASE = process.env.DEBUG_URL || 'https://robot-delivery-simulator.vercel.app'
const EMAIL = process.env.DEBUG_EMAIL || 'demo@test.ru'
const PASSWORD = process.env.DEBUG_PASSWORD || 'demo123'

const launchOpts = {
  headless: true,
  executablePath: process.env.CHROMIUM_PATH,
}

const browser = await chromium.launch(launchOpts)
const page = await browser.newPage()

const errors = []
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') {
    errors.push(`[console.${msg.type()}] ${msg.text()}`)
  }
})
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`))
page.on('requestfailed', (req) => errors.push(`[requestfailed] ${req.method()} ${req.url()} :: ${req.failure()?.errorText}`))
page.on('response', async (res) => {
  if (res.url().includes('/api/')) {
    let body = ''
    try { body = (await res.text()).slice(0, 200) } catch { body = '<no body>' }
    console.log(`[api] ${res.request().method()} ${new URL(res.url()).pathname} -> ${res.status()} ${body}`)
  }
})

console.log('Открываем', BASE)
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90000 }).catch((e) => console.log('goto:', e.message))

// Ждём форму логина
const emailInput = page.locator('input[type="email"], input[name="email"]').first()
await emailInput.waitFor({ state: 'visible', timeout: 30000 }).catch(() => console.log('email input не найден'))
console.log('Заголовок страницы:', await page.title())
console.log('Видимые тексты:', (await page.locator('body').innerText().catch(() => '')).slice(0, 300).replace(/\n/g, ' | '))

if (await emailInput.isVisible().catch(() => false)) {
  await emailInput.fill(EMAIL)
  await page.locator('input[type="password"]').first().fill(PASSWORD)
  // Клик строго по submit-кнопке формы логина (не по табу)
  await page.locator('form:has(input[type="email"]) button[type="submit"]').first().click()
  console.log('Клик по кнопке входа выполнен')
}

// Ждём 20 сек — что происходит после логина
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(2000)
  const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 200).replace(/\n/g, ' | ')
  console.log(`t+${(i + 1) * 2}s: url=${page.url()}  text="${bodyText}"`)
}

console.log('\n=== ОШИБКИ ===')
errors.slice(0, 50).forEach((e) => console.log(e))
if (!errors.length) console.log('(нет ошибок)')

await browser.close()
