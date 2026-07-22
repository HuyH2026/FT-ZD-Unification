import { test, expect } from '@playwright/test'

// Smoke coverage for the AI Agents → Configuration screen against the running
// app (the real Vite build, not jsdom). Component behaviour is covered by the
// vitest suite; this asserts the page mounts and the key regions render.
test.describe('AI Agents → Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai-agents/configuration')
  })

  test('renders the configuration shell', async ({ page }) => {
    const view = page.getByTestId('view-configuration')
    await expect(view.getByRole('heading', { name: 'Configuration' })).toBeVisible()
    await expect(view.getByRole('button', { name: 'Widget' })).toBeVisible()
    await expect(view.getByRole('heading', { name: 'Branded widget' })).toBeVisible()
  })

  test('brand selection updates the preview header', async ({ page }) => {
    const view = page.getByTestId('view-configuration')
    await expect(view.getByText('SpaceX support').first()).toBeVisible()
    await view.getByRole('button', { name: /Member/ }).click()
    await expect(view.getByRole('textbox', { name: 'Brand name' })).toHaveValue('Member')
  })
})
