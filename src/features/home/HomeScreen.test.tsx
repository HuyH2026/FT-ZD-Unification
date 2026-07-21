import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from './HomeScreen'

const STORAGE_KEY = 'home-dashboard-layout-v2'

// Install a minimal in-memory localStorage seeded with `stored`, so we can
// exercise loadLayout (jsdom does not provide localStorage by default).
function stubStorage(stored: string) {
  const map = new Map<string, string>([[STORAGE_KEY, stored]])
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  })
}

describe('HomeScreen', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders the dashboard surface with a greeting', () => {
    render(<HomeScreen />)
    const surface = screen.getByTestId('screen-home')
    expect(surface).toBeInTheDocument()
    expect(surface.className).toMatch(/rounded-\[26px\]/)
    expect(screen.getByText(/good morning, alex/i)).toBeInTheDocument()
  })

  it('renders default widgets', () => {
    render(<HomeScreen />)
    expect(screen.getByText('Overall agent health')).toBeInTheDocument()
    expect(screen.getByText('Needs your approval')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('switches data when toggling to the Organization level', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    // Platform health label is "Healthy"; Organization is "Good".
    expect(screen.getByText('Healthy')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^organization$/i }))
    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.queryByText('Healthy')).not.toBeInTheDocument()
  })

  it('enters edit mode via Customize', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    await user.click(screen.getByRole('button', { name: /customize/i }))
    expect(screen.getByText(/customize your dashboard/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add widget/i })).toBeInTheDocument()
  })

  it('ignores a crafted layout referencing prototype keys and falls back to defaults', () => {
    // "toString" is on Object.prototype; a naive `in WIDGETS` check would accept
    // it and crash on render. Validation must reject it and use DEFAULT_LAYOUT.
    stubStorage(JSON.stringify({ left: ['toString'], right: [] }))
    render(<HomeScreen />)
    // Renders the default widgets, no crash.
    expect(screen.getByText('Overall agent health')).toBeInTheDocument()
    expect(screen.getByText('Needs your approval')).toBeInTheDocument()
  })

  it('dedupes a stored layout with duplicate widget ids', () => {
    stubStorage(JSON.stringify({ left: ['health', 'health'], right: ['qa'] }))
    render(<HomeScreen />)
    // The duplicate is collapsed to a single instance (one heading, not two).
    expect(screen.getAllByText('Overall agent health')).toHaveLength(1)
    expect(screen.getByText('QA coverage')).toBeInTheDocument()
  })
})
