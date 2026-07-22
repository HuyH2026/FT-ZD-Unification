// src/features/orchestrator/journey/NodePalette.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NodePalette } from './NodePalette'

describe('NodePalette', () => {
  it('renders the three categories', () => {
    render(<NodePalette onClose={() => {}} />)
    expect(screen.getByText('Channel Agents')).toBeInTheDocument()
    expect(screen.getByText('Logic')).toBeInTheDocument()
    expect(screen.getByText('Triage models')).toBeInTheDocument()
  })

  it('filters cards by search text', () => {
    render(<NodePalette onClose={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'email' } })
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.queryByText('Voice')).toBeNull()
    // an empty category header disappears
    expect(screen.queryByText('Triage models')).toBeNull()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<NodePalette onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close node palette'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sets drag data when a card drag starts', () => {
    render(<NodePalette onClose={() => {}} />)
    const card = screen.getByText('Email').closest('[draggable="true"]') as HTMLElement
    const setData = vi.fn()
    fireEvent.dragStart(card, { dataTransfer: { setData, effectAllowed: '' } })
    expect(setData).toHaveBeenCalledWith('application/journey-node', 'email')
  })
})
