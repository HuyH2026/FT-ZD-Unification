import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CreateAgentPanel } from './CreateAgentPanel'

describe('CreateAgentPanel', () => {
  it('disables Create until a display name is entered', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<CreateAgentPanel channel="widget" onClose={() => {}} onCreate={onCreate} />)
    const create = screen.getByRole('button', { name: 'Create Agent' })
    expect(create).toBeDisabled()
    await user.type(screen.getByLabelText('Agent display name'), 'Refund helper')
    expect(create).toBeEnabled()
  })

  it('emits the entered fields on Create', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<CreateAgentPanel channel="widget" onClose={() => {}} onCreate={onCreate} />)
    await user.type(screen.getByLabelText('Agent display name'), 'Refund helper')
    await user.type(screen.getByLabelText('Training phrases'), 'refund{Enter}')
    await user.click(screen.getByRole('button', { name: 'Create Agent' }))
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Refund helper', channel: 'widget', trainingPhrases: ['refund'],
    }))
  })

  it('closes on the X button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<CreateAgentPanel channel="widget" onClose={onClose} onCreate={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })
})
