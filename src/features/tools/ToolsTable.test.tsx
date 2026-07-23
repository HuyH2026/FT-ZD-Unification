import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ToolsTable } from './ToolsTable'
import { TOOL_ACTIONS } from './tools-data'

describe('ToolsTable', () => {
  it('renders a row for every action with its name and type', () => {
    render(<ToolsTable onOpen={() => {}} />)
    for (const a of TOOL_ACTIONS) {
      expect(screen.getByText(a.name)).toBeInTheDocument()
    }
    expect(screen.getByText('API')).toBeInTheDocument()
    expect(screen.getByText('MCP')).toBeInTheDocument()
    expect(screen.getByText('Browser')).toBeInTheDocument()
  })

  it('shows the static Name (113) header count', () => {
    render(<ToolsTable onOpen={() => {}} />)
    expect(screen.getByText('Name (113)')).toBeInTheDocument()
  })

  it('renders the state badges', () => {
    render(<ToolsTable onOpen={() => {}} />)
    expect(screen.getAllByText('Live')).toHaveLength(2)
    expect(screen.getAllByText('Read only')).toHaveLength(2)
    expect(screen.getByText('Auto-saved')).toBeInTheDocument()
  })

  it('renders "n/a" for rows without agents', () => {
    render(<ToolsTable onOpen={() => {}} />)
    expect(screen.getAllByText('n/a')).toHaveLength(3)
  })

  it('calls onOpen with the row id when a row is clicked', () => {
    const onOpen = vi.fn()
    render(<ToolsTable onOpen={onOpen} />)
    fireEvent.click(screen.getByText('Action name 001'))
    expect(onOpen).toHaveBeenCalledWith('t1')
  })

  it('does not call onOpen when the row checkbox is clicked', () => {
    const onOpen = vi.fn()
    render(<ToolsTable onOpen={onOpen} />)
    const row = screen.getByTestId('tool-row-t1')
    fireEvent.click(within(row).getByTestId('tool-row-checkbox'))
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('does not call onOpen when the row options button is clicked', () => {
    const onOpen = vi.fn()
    render(<ToolsTable onOpen={onOpen} />)
    fireEvent.click(screen.getByLabelText('Action name 001 options'))
    expect(onOpen).not.toHaveBeenCalled()
  })
})
