import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigurationView } from './ConfigurationView'

const view = () => within(screen.getByTestId('view-configuration'))

describe('ConfigurationView', () => {
  it('renders the title, all four tabs, three brands, and the panel', () => {
    render(<ConfigurationView />)
    const v = view()
    expect(v.getByText('Configuration')).toBeInTheDocument()
    for (const t of ['Widget', 'Voice', 'Web Call', 'Headless']) expect(v.getByText(t)).toBeInTheDocument()
    expect(v.getByText('VIP')).toBeInTheDocument()
    expect(v.getByText('Member')).toBeInTheDocument()
    expect(v.getByText('Partner')).toBeInTheDocument()
    expect(v.getByText('Branded widget')).toBeInTheDocument()
  })

  it('updates the panel + preview when a different brand is selected', async () => {
    render(<ConfigurationView />)
    const v = view()
    expect(v.getByDisplayValue('SpaceX support')).toBeInTheDocument()
    await userEvent.click(v.getByRole('button', { name: /Member/ }))
    expect(v.getByDisplayValue('Member')).toBeInTheDocument()
  })

  it('shows a coming-soon body for non-Widget tabs', async () => {
    render(<ConfigurationView />)
    const v = view()
    await userEvent.click(v.getByText('Voice'))
    expect(v.getByText('Coming soon')).toBeInTheDocument()
    expect(v.queryByText('Branded widget')).not.toBeInTheDocument()
  })

  it('marks the active tab with aria-current', async () => {
    render(<ConfigurationView />)
    const v = view()
    expect(v.getByRole('button', { name: /Widget/ })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(v.getByText('Voice'))
    expect(v.getByRole('button', { name: /Voice/ })).toHaveAttribute('aria-current', 'page')
  })

  it('flips the enabled toggle when clicked', async () => {
    render(<ConfigurationView />)
    const v = view()
    const sw = v.getByRole('switch')
    expect(sw).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'false')
  })

  it('swaps to AI Personality when the Sentiment rail icon is clicked, and back', async () => {
    render(<ConfigurationView />)
    const v = view()
    expect(v.getByText('Branded widget')).toBeInTheDocument()
    await userEvent.click(v.getByRole('button', { name: 'Sentiment' }))
    expect(v.getByText('AI Personality')).toBeInTheDocument()
    expect(v.queryByText('Branded widget')).not.toBeInTheDocument()
    await userEvent.click(v.getByRole('button', { name: 'Brands' }))
    expect(v.getByText('Branded widget')).toBeInTheDocument()
  })

  it('shows per-brand personality values on the AI Personality panel', async () => {
    render(<ConfigurationView />)
    const v = view()
    await userEvent.click(v.getByRole('button', { name: 'Sentiment' }))
    const ctx = v.getByLabelText('General Context')
    await userEvent.type(ctx, 'VIP context')
    expect(v.getByLabelText('General Context')).toHaveValue('VIP context')
    // Switch to Member: their General Context is still empty.
    await userEvent.click(v.getByRole('button', { name: /Member/ }))
    expect(v.getByLabelText('General Context')).toHaveValue('')
  })
})
