import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogScreen } from './LogScreen'
import { AUDIT_ENTRIES, ERROR_ENTRIES } from './log-data'

describe('LogScreen', () => {
  it('renders the Log title and the Audit tab by default', () => {
    render(<LogScreen />)
    const el = screen.getByTestId('screen-log')
    expect(within(el).getByRole('heading', { name: 'Log' })).toBeInTheDocument()
    expect(within(el).getByRole('tab', { name: 'Audit' })).toHaveAttribute('aria-selected', 'true')
    expect(within(el).getByText('See the history of changes made within this account.')).toBeInTheDocument()
    expect(within(el).getByText('User email')).toBeInTheDocument()
  })

  it('switches to the Error tab and shows the error table', async () => {
    const user = userEvent.setup()
    render(<LogScreen />)
    const el = screen.getByTestId('screen-log')
    await user.click(within(el).getByRole('tab', { name: 'Error' }))
    expect(within(el).getByRole('tab', { name: 'Error' })).toHaveAttribute('aria-selected', 'true')
    expect(within(el).queryByText('User email')).toBeNull()
    expect(within(el).getByText('Errors overview')).toBeInTheDocument()
    expect(within(el).getByText('Error Message')).toBeInTheDocument()
  })

  it('renders every audit row by default', () => {
    render(<LogScreen />)
    const el = screen.getByTestId('screen-log')
    for (const entry of AUDIT_ENTRIES) {
      expect(within(el).getByTestId(`audit-row-${entry.id}`)).toBeInTheDocument()
    }
  })

  it('renders every error row with a severity badge after switching to Error', async () => {
    const user = userEvent.setup()
    render(<LogScreen />)
    const el = screen.getByTestId('screen-log')
    await user.click(within(el).getByRole('tab', { name: 'Error' }))
    for (const entry of ERROR_ENTRIES) {
      const row = within(el).getByTestId(`error-row-${entry.id}`)
      expect(row).toBeInTheDocument()
      // the severity badge label renders inside its row
      expect(within(row).getByText(entry.severity)).toBeInTheDocument()
    }
  })
})
