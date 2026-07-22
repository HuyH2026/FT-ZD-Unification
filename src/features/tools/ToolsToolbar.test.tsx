import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToolsToolbar } from './ToolsToolbar'

describe('ToolsToolbar', () => {
  it('renders the search placeholder and action buttons', () => {
    render(<ToolsToolbar />)
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter by' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import action' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create new...' })).toBeInTheDocument()
  })
})
