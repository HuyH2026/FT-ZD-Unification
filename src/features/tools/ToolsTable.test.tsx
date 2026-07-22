import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToolsTable } from './ToolsTable'
import { TOOL_ACTIONS } from './tools-data'

describe('ToolsTable', () => {
  it('renders a row for every action with its name and type', () => {
    render(<ToolsTable />)
    for (const a of TOOL_ACTIONS) {
      expect(screen.getByText(a.name)).toBeInTheDocument()
    }
    // Type "API" appears once (row 001).
    expect(screen.getByText('API')).toBeInTheDocument()
    expect(screen.getByText('MCP')).toBeInTheDocument()
    expect(screen.getByText('Browser')).toBeInTheDocument()
  })

  it('shows the static Name (113) header count', () => {
    render(<ToolsTable />)
    expect(screen.getByText('Name (113)')).toBeInTheDocument()
  })

  it('renders the state badges', () => {
    render(<ToolsTable />)
    expect(screen.getAllByText('Live')).toHaveLength(2)
    expect(screen.getAllByText('Read only')).toHaveLength(2)
    expect(screen.getByText('Auto-saved')).toBeInTheDocument()
  })

  it('renders "n/a" for rows without agents', () => {
    render(<ToolsTable />)
    // Rows 003, 004, 005 have no agents.
    expect(screen.getAllByText('n/a')).toHaveLength(3)
  })
})
