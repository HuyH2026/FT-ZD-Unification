import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NodeChips } from './NodeChips'

describe('NodeChips', () => {
  it('renders the node label and the extra-count suffix', () => {
    render(<NodeChips label="Sentiment Detection" kind="sentiment" extra={4} />)
    expect(screen.getByText('Sentiment Detection')).toBeInTheDocument()
    expect(screen.getByText('+4')).toBeInTheDocument()
  })

  it('omits the suffix when there are no extra nodes', () => {
    render(<NodeChips label="Event Fired" kind="event" extra={0} />)
    expect(screen.queryByText(/^\+/)).toBeNull()
  })
})
