import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the human-readable label for each status', () => {
    const { rerender } = render(<StatusBadge status="not-started" />)
    expect(screen.getByText('Not started')).toBeInTheDocument()
    rerender(<StatusBadge status="running" />)
    expect(screen.getByText('Running')).toBeInTheDocument()
    rerender(<StatusBadge status="completed" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
    rerender(<StatusBadge status="canceled" />)
    expect(screen.getByText('Canceled')).toBeInTheDocument()
  })
})
