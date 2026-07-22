import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from './HomeScreen'

const STORAGE_KEY = 'home-dashboard-layout-v2'

// All widget titles, used for order-capturing helper.
const WIDGET_TITLES = [
  'Overall agent health',
  'Test coverage',
  'Knowledge gaps',
  'Needs your approval',
  'Notifications',
  'Cost & usage',
  'Recent activity',
  'Top intents',
  'Improved policies',
  'New knowledge content',
]

// Captures the current ordered list of widget-card headings from the DOM.
function widgetOrder(): string[] {
  // Widget titles render in <p> tags with specific styling; collect them in DOM order.
  return Array.from(document.querySelectorAll('p'))
    .map((el) => el.textContent ?? '')
    .filter((t) => WIDGET_TITLES.includes(t))
}

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

  it('shows the new knowledge content widget with coverage and items', () => {
    render(<HomeScreen />)
    expect(screen.getByText('New knowledge content')).toBeInTheDocument()
    expect(screen.getByText(/12,470 tickets covered/i)).toBeInTheDocument()
    expect(screen.getByText(/how to convert a traditional ira to a roth ira/i)).toBeInTheDocument()
  })

  it('shows newly generated test playlists in the test coverage widget', () => {
    render(<HomeScreen />)
    expect(screen.getByText(/newly generated playlists/i)).toBeInTheDocument()
    expect(screen.getByText('Regression test')).toBeInTheDocument()
    expect(screen.getByText('Tone of Voice test')).toBeInTheDocument()
  })

  it('shows the knowledge gaps hero stats', () => {
    render(<HomeScreen />)
    expect(screen.getByText('58')).toBeInTheDocument()
    expect(screen.getByText(/articles generated for identified gaps/i)).toBeInTheDocument()
    expect(screen.getByText('11,004')).toBeInTheDocument()
    expect(screen.getByText(/potential ticket coverage/i)).toBeInTheDocument()
  })

  it('renders the platform-level data (no org-level toggle)', () => {
    render(<HomeScreen />)
    // Home is always platform-level; the health state reads "Good".
    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^organization$/i })).not.toBeInTheDocument()
  })

  it('shows the AI short summary in the agent health card', () => {
    render(<HomeScreen />)
    expect(screen.getByText('AI summary')).toBeInTheDocument()
    expect(screen.getByText(/no action needed right now/i)).toBeInTheDocument()
  })

  // The channel filter lives in the agent-health card; scope queries to it.
  function healthCard(): HTMLElement {
    const title = screen.getByText('Overall agent health')
    const card = title.closest('div.rounded-2xl')
    if (!card) throw new Error('agent-health card not found')
    return card as HTMLElement
  }

  it('defaults to all four channels selected with the platform score', () => {
    render(<HomeScreen />)
    const card = within(healthCard())
    const boxes = card.getAllByRole('checkbox')
    expect(boxes).toHaveLength(4)
    expect(boxes.every((b) => b.getAttribute('aria-checked') === 'true')).toBe(true)
    expect(card.getByText('94')).toBeInTheDocument()
    // No "Filtered" caption when everything is selected.
    expect(card.queryByText(/^Filtered/)).not.toBeInTheDocument()
  })

  it('re-scopes the card to a single channel', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    const card = within(healthCard())
    // Uncheck all but Voice.
    await user.click(card.getByRole('checkbox', { name: /messaging/i }))
    await user.click(card.getByRole('checkbox', { name: /email/i }))
    await user.click(card.getByRole('checkbox', { name: /headless/i }))
    expect(card.getByText('82')).toBeInTheDocument()       // voice score
    // Scoped caption ("Filtered · Voice"). Narrower than /^Filtered/: the
    // aggregated AI summary for this subset also starts with "Filtered to…",
    // so a plain /^Filtered/ match is ambiguous within the card.
    expect(card.getByText(/^Filtered ·/)).toBeInTheDocument()
  })

  it('does not allow unchecking the last channel', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    const card = within(healthCard())
    await user.click(card.getByRole('checkbox', { name: /messaging/i }))
    await user.click(card.getByRole('checkbox', { name: /email/i }))
    await user.click(card.getByRole('checkbox', { name: /headless/i }))
    const voice = card.getByRole('checkbox', { name: /voice/i })
    expect(voice.getAttribute('aria-checked')).toBe('true')
    await user.click(voice) // no-op: last remaining channel
    expect(voice.getAttribute('aria-checked')).toBe('true')
  })

  // Finds a metric tile by its visible label (tiles are hoverable regions, not
  // buttons — the breakdown floats in a popover on hover/focus).
  function metricTile(label: string): HTMLElement {
    const labelEl = screen.getByText(label)
    // The tile is the nearest ancestor with the relative-positioned popover host.
    const tile = labelEl.closest('div.relative')
    if (!tile) throw new Error(`tile for "${label}" not found`)
    return tile as HTMLElement
  }

  it('reveals the resolution rate per-channel breakdown on hover', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    // Breakdown is hidden until hover.
    expect(screen.queryByText(/resolution rate by channel/i)).not.toBeInTheDocument()
    const tile = metricTile('Resolution rate')
    await user.hover(tile)
    // Scoped to the tile: the new channel-filter pills also render "Messaging"
    // etc. at the card level, so a page-wide query would be ambiguous.
    const popover = within(tile)
    expect(popover.getByText(/resolution rate by channel/i)).toBeInTheDocument()
    for (const family of ['Messaging', 'Email', 'Voice', 'Headless']) {
      expect(popover.getByText(family)).toBeInTheDocument()
    }
    // Unhovering hides it again.
    await user.unhover(tile)
    expect(screen.queryByText(/resolution rate by channel/i)).not.toBeInTheDocument()
  })

  it('reveals a per-channel breakdown for every health metric on hover', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    for (const [label, heading] of [
      ['CSAT', /csat by channel/i],
      ['Escalations', /escalations by channel/i],
      ['Avg handle time', /avg handle time by channel/i],
    ] as const) {
      const tile = metricTile(label)
      await user.hover(tile)
      // Scoped to the tile — see note above on the channel-filter pills.
      const popover = within(tile)
      expect(popover.getByText(heading)).toBeInTheDocument()
      expect(popover.getByText('Messaging')).toBeInTheDocument()
      await user.unhover(tile)
    }
  })

  it('shows a finished A/B test approval with the winning variant', () => {
    render(<HomeScreen />)
    expect(screen.getByText(/a\/b test finished/i)).toBeInTheDocument()
    expect(screen.getByText('Winner')).toBeInTheDocument()
    // Approve CTA publishes the declared winner.
    expect(screen.getByRole('button', { name: /publish variant a/i })).toBeInTheDocument()
  })

  it('renders a self-improving plan approval as an embedded Slack message', () => {
    render(<HomeScreen />)
    expect(screen.getByText(/sunny created a self-improving plan/i)).toBeInTheDocument()
    // Origin is shown as a forwarded Slack message: channel + quoted text.
    expect(screen.getByText(/via slack #support-ai/i)).toBeInTheDocument()
    expect(screen.getByText(/resolution keeps stalling there/i)).toBeInTheDocument()
    // The redundant "Name · Role" footer is suppressed when the Slack block shows.
    expect(screen.queryByText(/sunny kong · support lead/i)).not.toBeInTheDocument()
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
    expect(screen.getByText('Test coverage')).toBeInTheDocument()
  })

  it('opens the generate panel from the header', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    expect(screen.queryByTestId('generate-home-panel')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /generate/i }))
    expect(screen.getByTestId('generate-home-panel')).toBeInTheDocument()
  })

  it('generates a preview and applies it to the dashboard', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    const before = widgetOrder()
    await user.click(screen.getByRole('button', { name: /generate/i }))
    const panel = screen.getByTestId('generate-home-panel')
    // Answer Q1 + Q2 to enable generation.
    await user.click(within(panel).getByRole('button', { name: /quality lead/i }))
    await user.click(within(panel).getByRole('button', { name: /quality & testing/i }))
    await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
    // Preview badge appears and Apply is offered.
    expect(screen.getByText(/preview/i)).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: /^apply$/i }))
    // Panel closes; dashboard still renders widgets.
    expect(screen.queryByTestId('generate-home-panel')).not.toBeInTheDocument()
    const after = widgetOrder()
    expect(after.length).toBeGreaterThan(0) // Sanity check: widgets rendered
    expect(after).not.toEqual(before) // Order changed — proves Apply committed the new layout
  })

  it('discards a preview without changing the saved dashboard', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    const before = widgetOrder()
    await user.click(screen.getByRole('button', { name: /generate/i }))
    const panel = screen.getByTestId('generate-home-panel')
    await user.click(within(panel).getByRole('button', { name: /executive/i }))
    await user.click(within(panel).getByRole('button', { name: /cost & usage/i }))
    await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
    await user.click(within(panel).getByRole('button', { name: /discard/i }))
    expect(screen.queryByTestId('generate-home-panel')).not.toBeInTheDocument()
    const after = widgetOrder()
    expect(after.length).toBeGreaterThan(0) // Sanity check: widgets rendered
    expect(after).toEqual(before) // Order unchanged — proves Discard is lossless
  })

  it('hides Customize while a generate preview is active', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    // Customize is available before previewing.
    expect(screen.getByRole('button', { name: /customize/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /generate/i }))
    const panel = screen.getByTestId('generate-home-panel')
    await user.click(within(panel).getByRole('button', { name: /quality lead/i }))
    await user.click(within(panel).getByRole('button', { name: /quality & testing/i }))
    await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
    // Preview active → Customize must be gone (prevents editing the real layout under a preview).
    expect(screen.queryByRole('button', { name: /customize/i })).not.toBeInTheDocument()
  })
})

// The brand breakdown lives in the Top intents card; scope queries to it.
function intentsCard(): HTMLElement {
  const title = screen.getByText('Top intents')
  const card = title.closest('div.rounded-2xl')
  if (!card) throw new Error('Top intents card not found')
  return card as HTMLElement
}

describe('Top intents brand breakdown', () => {
  afterEach(() => vi.unstubAllGlobals())

  // DEFAULT_LAYOUT doesn't include the `intents` widget (it's an
  // add-on card, not shown out of the box) — seed a stored layout that
  // includes it so these accordion tests can find the card.
  beforeEach(() => {
    stubStorage(JSON.stringify({ left: ['intents'], right: [] }))
  })

  it('renders every intent collapsed by default', () => {
    render(<HomeScreen />)
    const card = within(intentsCard())
    // No tier labels visible until a row is expanded.
    expect(card.queryByText('VIP')).not.toBeInTheDocument()
    expect(card.queryByText('Vendor')).not.toBeInTheDocument()
    // Every intent row is a collapsed toggle.
    const rows = card.getAllByRole('button', { expanded: false })
    expect(rows.length).toBeGreaterThanOrEqual(4)
  })

  it('expands an intent to reveal its VIP/Premium/Vendor breakdown', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    const card = within(intentsCard())
    await user.click(card.getByRole('button', { name: /order status/i }))
    expect(card.getByText('VIP')).toBeInTheDocument()
    expect(card.getByText('Premium')).toBeInTheDocument()
    expect(card.getByText('Vendor')).toBeInTheDocument()
    // Order status → Vendor is 60% · 2,520 tickets.
    expect(card.getByText(/60% · 2,520 tickets/)).toBeInTheDocument()
    expect(card.getByRole('button', { name: /order status/i })).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps only one intent open at a time (accordion)', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    const card = within(intentsCard())
    await user.click(card.getByRole('button', { name: /order status/i }))
    await user.click(card.getByRole('button', { name: /refund request/i }))
    expect(card.getByRole('button', { name: /order status/i })).toHaveAttribute('aria-expanded', 'false')
    expect(card.getByRole('button', { name: /refund request/i })).toHaveAttribute('aria-expanded', 'true')
    // Exactly one panel open.
    expect(card.getAllByRole('button', { expanded: true })).toHaveLength(1)
  })
})

describe('HomeScreen — dashboard views', () => {
  it('shows the view switcher with the Default view', () => {
    render(<HomeScreen />)
    const switcher = screen.getByTestId('view-switcher')
    expect(switcher).toHaveTextContent('Default')
  })

  it('generating and applying creates a new active view named for the role', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    await user.click(screen.getByRole('button', { name: /generate/i }))
    const panel = screen.getByTestId('generate-home-panel')
    await user.click(within(panel).getByRole('button', { name: /ops lead/i }))
    await user.click(within(panel).getByRole('button', { name: /resolution & health/i }))
    await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
    await user.click(within(panel).getByRole('button', { name: /^apply$/i }))
    // The new view is active and appears in the switcher.
    expect(screen.getByTestId('view-switcher')).toHaveTextContent('Ops lead')
  })

  it('switches back to the Default view from the switcher', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    // Create + apply an Ops view first.
    await user.click(screen.getByRole('button', { name: /generate/i }))
    const panel = screen.getByTestId('generate-home-panel')
    await user.click(within(panel).getByRole('button', { name: /ops lead/i }))
    await user.click(within(panel).getByRole('button', { name: /resolution & health/i }))
    await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
    await user.click(within(panel).getByRole('button', { name: /^apply$/i }))
    // Open switcher and pick Default.
    await user.click(within(screen.getByTestId('view-switcher')).getByRole('button', { name: /ops lead/i }))
    await user.click(screen.getByRole('button', { name: /^Default$/ }))
    expect(screen.getByTestId('view-switcher')).toHaveTextContent('Default')
  })

  it('the built-in Default view has no delete control', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    await user.click(within(screen.getByTestId('view-switcher')).getByRole('button', { name: /default/i }))
    expect(screen.queryByRole('button', { name: /delete default/i })).not.toBeInTheDocument()
  })

  it('generating with the Product manager role creates a PM view that renders the PM dashboard', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    await user.click(screen.getByRole('button', { name: /generate/i }))
    const panel = screen.getByTestId('generate-home-panel')
    await user.click(within(panel).getByRole('button', { name: /product manager/i }))
    // PM needs no focus area — generate is enabled immediately.
    await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
    await user.click(within(panel).getByRole('button', { name: /^apply$/i }))
    // The PM dashboard surface is now shown, and the switcher names it.
    expect(screen.getByTestId('screen-pm')).toBeInTheDocument()
    expect(screen.getByTestId('view-switcher')).toHaveTextContent('Product manager')
    expect(within(screen.getByTestId('screen-pm')).getByText('ARR at risk')).toBeInTheDocument()
  })

  it('switching from a PM view back to Default restores the grid dashboard', async () => {
    const user = userEvent.setup()
    render(<HomeScreen />)
    await user.click(screen.getByRole('button', { name: /generate/i }))
    const panel = screen.getByTestId('generate-home-panel')
    await user.click(within(panel).getByRole('button', { name: /product manager/i }))
    await user.click(within(panel).getByRole('button', { name: /generate my home/i }))
    await user.click(within(panel).getByRole('button', { name: /^apply$/i }))
    expect(screen.getByTestId('screen-pm')).toBeInTheDocument()
    // Switch back to Default.
    await user.click(within(screen.getByTestId('view-switcher')).getByRole('button', { name: /product manager/i }))
    await user.click(screen.getByRole('button', { name: /^Default$/ }))
    expect(screen.queryByTestId('screen-pm')).not.toBeInTheDocument()
    expect(screen.getByText('Overall agent health')).toBeInTheDocument()
  })
})
