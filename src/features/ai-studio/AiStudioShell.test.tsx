import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiStudioShell } from './AiStudioShell'

describe('AiStudioShell', () => {
  it('renders its children and the AI Studio title', () => {
    render(
      <AiStudioShell testId="shell-under-test">
        <p>body content</p>
      </AiStudioShell>,
    )
    expect(screen.getByTestId('shell-under-test')).toBeInTheDocument()
    expect(screen.getByText('AI Studio')).toBeInTheDocument()
    expect(screen.getByText('body content')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('What can I help you with today?')).toBeInTheDocument()
  })

  it('fires onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(
      <AiStudioShell onClose={onClose}>
        <p>body</p>
      </AiStudioShell>,
    )
    await userEvent.click(screen.getByLabelText('Close AI Studio'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
