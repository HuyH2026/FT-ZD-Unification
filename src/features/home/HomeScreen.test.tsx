import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from './HomeScreen'

describe('HomeScreen', () => {
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
})
