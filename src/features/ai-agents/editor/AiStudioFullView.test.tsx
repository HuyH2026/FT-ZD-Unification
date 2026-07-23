import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AiStudioFullView } from './AiStudioFullView'

describe('AiStudioFullView', () => {
  it('renders the plan detail with summary and numbered section', () => {
    render(<AiStudioFullView onClose={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: 'AI Studio — Review plan' })).toBeInTheDocument()
    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.getByText('Update Policy Description')).toBeInTheDocument()
    expect(screen.getByText('Call to Action')).toBeInTheDocument()
  })

  it('Approve swaps to an Approved badge', async () => {
    const user = userEvent.setup()
    render(<AiStudioFullView onClose={vi.fn()} />)
    expect(screen.queryByText('Approved')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('close fires onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<AiStudioFullView onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Close review plan' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
