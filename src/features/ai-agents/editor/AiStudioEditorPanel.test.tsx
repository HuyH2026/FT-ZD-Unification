import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AiStudioEditorPanel } from './AiStudioEditorPanel'

function renderPanel() {
  const onClose = vi.fn()
  const onReview = vi.fn()
  render(<AiStudioEditorPanel onClose={onClose} onReview={onReview} />)
  return { onClose, onReview }
}

describe('AiStudioEditorPanel', () => {
  it('starts with the greeting and suggestion bubbles', () => {
    renderPanel()
    expect(screen.getByText('Good evening, Sunny! 👋')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refine this intent' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Improve this policy to improve deflection' }),
    ).toBeInTheDocument()
  })

  it('a suggestion fills the composer with the rewrite prompt', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(screen.getByRole('button', { name: 'Improve this policy to improve deflection' }))
    expect(screen.getByDisplayValue('Help me rewrite this policy to improve deflection')).toBeInTheDocument()
  })

  it('submitting a prompt shows the user bubble and the analysis + plan card', async () => {
    const user = userEvent.setup()
    renderPanel()
    const input = screen.getByPlaceholderText('What can I help you with today?')
    await user.type(input, 'Help me rewrite this policy to improve deflection{Enter}')

    // User message echoed, greeting gone.
    expect(screen.getByText('Help me rewrite this policy to improve deflection')).toBeInTheDocument()
    expect(screen.queryByText('Good evening, Sunny! 👋')).not.toBeInTheDocument()
    // Canned analysis + plan card.
    expect(screen.getByText('Current drop off rate:')).toBeInTheDocument()
    expect(screen.getByText('Widget: 43%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review plan' })).toBeInTheDocument()
  })

  it('Review plan fires onReview', async () => {
    const user = userEvent.setup()
    const { onReview } = renderPanel()
    const input = screen.getByPlaceholderText('What can I help you with today?')
    await user.type(input, 'rewrite it{Enter}')
    await user.click(screen.getByRole('button', { name: 'Review plan' }))
    expect(onReview).toHaveBeenCalledTimes(1)
  })

  it('close fires onClose', async () => {
    const user = userEvent.setup()
    const { onClose } = renderPanel()
    await user.click(screen.getByLabelText('Close AI Studio'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
