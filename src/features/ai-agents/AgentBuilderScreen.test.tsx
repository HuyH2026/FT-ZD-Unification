import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { AgentBuilderScreen } from './AgentBuilderScreen'

// Mock useNavigate since these tests render the component bare (no router).
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Clear localStorage before and after each test for deterministic store state.
beforeEach(() => {
  window.localStorage?.clear()
})
afterEach(() => {
  window.localStorage?.clear()
})

function surface(): HTMLElement {
  return screen.getByTestId('view-agent-builder')
}

// Row presence is asserted via each row's toggle, whose accessible name
// ("Activate <agent name>") is unique — agent names also appear verbatim in the
// Type column (e.g. "Knowledge Retrieval", "Fallback"), so a bare text query on
// the name would match two cells.
describe('AgentBuilderScreen', () => {
  it('renders the Widget channel by default', () => {
    render(<AgentBuilderScreen />)
    const view = within(surface())
    expect(view.getByText('Agent Builder')).toBeInTheDocument()
    expect(view.getByText('Total Chats')).toBeInTheDocument()
    expect(view.getByText('21,590')).toBeInTheDocument()
    expect(view.getByRole('switch', { name: 'Activate Knowledge Retrieval' })).toBeInTheDocument()
  })

  it('switches channels, changing the headline metric and rows', async () => {
    const user = userEvent.setup()
    render(<AgentBuilderScreen />)
    const view = within(surface())
    await user.click(view.getByRole('tab', { name: 'Voice' }))
    expect(view.getByText('8,120')).toBeInTheDocument()
    expect(view.queryByText('21,590')).not.toBeInTheDocument()
    expect(view.getByRole('switch', { name: 'Activate Call routing' })).toBeInTheDocument()
    // Widget's agents are gone.
    expect(view.queryByRole('switch', { name: 'Activate Knowledge Retrieval' })).not.toBeInTheDocument()
  })

  it('filters to only On agents under the Active agents tab', async () => {
    const user = userEvent.setup()
    render(<AgentBuilderScreen />)
    const view = within(surface())
    // Widget: Service cancellation is Off by default.
    await user.click(view.getByRole('tab', { name: 'Active agents' }))
    expect(view.getByRole('switch', { name: 'Activate Knowledge Retrieval' })).toBeInTheDocument()
    expect(view.queryByRole('switch', { name: 'Activate Service cancellation' })).not.toBeInTheDocument()
  })

  it('moves a row out of Active when toggled off', async () => {
    const user = userEvent.setup()
    render(<AgentBuilderScreen />)
    const view = within(surface())
    // Turn Knowledge Retrieval off (on the All tab), then check the Active tab.
    await user.click(view.getByRole('switch', { name: 'Activate Knowledge Retrieval' }))
    await user.click(view.getByRole('tab', { name: 'Active agents' }))
    expect(view.queryByRole('switch', { name: 'Activate Knowledge Retrieval' })).not.toBeInTheDocument()
    // Fallback (also On) is still present.
    expect(view.getByRole('switch', { name: 'Activate Fallback' })).toBeInTheDocument()
  })

  it('shows only subagents under the Active subagents tab', async () => {
    const user = userEvent.setup()
    render(<AgentBuilderScreen />)
    const view = within(surface())
    await user.click(view.getByRole('tab', { name: 'Active subagents' }))
    // Widget: only Service cancellation is a subagent.
    expect(view.getByRole('switch', { name: 'Activate Service cancellation' })).toBeInTheDocument()
    expect(view.queryByRole('switch', { name: 'Activate Knowledge Retrieval' })).not.toBeInTheDocument()
  })

  it('selects a row and deletes it after confirming', async () => {
    const user = userEvent.setup()
    render(<AgentBuilderScreen />)
    const view = within(surface())
    expect(view.getByRole('switch', { name: 'Activate Service cancellation' })).toBeInTheDocument()

    // Select the row; the action bar appears.
    await user.click(view.getByRole('checkbox', { name: 'Select Service cancellation' }))
    expect(view.getByText('1 selected')).toBeInTheDocument()

    // Delete opens the confirm dialog; row still present until confirmed.
    await user.click(view.getByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('alertdialog')
    expect(within(dialog).getByText('Delete 1 agent?')).toBeInTheDocument()
    expect(view.getByRole('switch', { name: 'Activate Service cancellation' })).toBeInTheDocument()

    // Confirm removes the row and clears the bar.
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))
    expect(view.queryByRole('switch', { name: 'Activate Service cancellation' })).not.toBeInTheDocument()
    expect(view.queryByText('1 selected')).not.toBeInTheDocument()
  })

  it('cancelling the confirm dialog keeps the row', async () => {
    const user = userEvent.setup()
    render(<AgentBuilderScreen />)
    const view = within(surface())
    await user.click(view.getByRole('checkbox', { name: 'Select Service cancellation' }))
    await user.click(view.getByRole('button', { name: 'Delete' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))
    expect(view.getByRole('switch', { name: 'Activate Service cancellation' })).toBeInTheDocument()
    // Selection is preserved on cancel.
    expect(view.getByText('1 selected')).toBeInTheDocument()
  })

  it('select-all toggles every visible row and clears on channel switch', async () => {
    const user = userEvent.setup()
    render(<AgentBuilderScreen />)
    const view = within(surface())
    await user.click(view.getByRole('checkbox', { name: 'Select all agents' }))
    // Widget seeds three agents.
    expect(view.getByText('3 selected')).toBeInTheDocument()
    // Switching channel resets selection.
    await user.click(view.getByRole('tab', { name: 'Voice' }))
    expect(view.queryByText(/selected$/)).not.toBeInTheDocument()
  })
})

