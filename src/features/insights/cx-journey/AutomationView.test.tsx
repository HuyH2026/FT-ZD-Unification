import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AutomationView } from './AutomationView'

describe('AutomationView', () => {
  it('renders the three headline stats and all mock rows under Agent gaps', () => {
    render(<AutomationView />)
    const view = within(screen.getByTestId('view-automation'))
    expect(view.getByText('6,908')).toBeInTheDocument()
    expect(view.getByText('$229,860')).toBeInTheDocument()
    expect(view.getByText('Reactivate account')).toBeInTheDocument()
    expect(view.getByText('Account Linking and Updating')).toBeInTheDocument()
  })

  it('shows an empty state when a non-built sub-tab is selected', async () => {
    const user = userEvent.setup()
    render(<AutomationView />)
    const view = within(screen.getByTestId('view-automation'))
    await user.click(view.getByRole('tab', { name: /Knowledge gaps/ }))
    expect(view.queryByText('Reactivate account')).not.toBeInTheDocument()
    expect(view.getByText(/Coming soon/i)).toBeInTheDocument()
  })
})
