import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ToolsHistoryTable } from './ToolsHistoryTable'
import { TOOL_ACTIONS } from './tools-data'

describe('ToolsHistoryTable', () => {
  it('renders a row for every run, showing the linked action name', () => {
    render(<ToolsHistoryTable />)
    const table = screen.getByTestId('tools-history-table')
    expect(within(table).getByText(TOOL_ACTIONS[0].name)).toBeInTheDocument()
    expect(within(table).getByText(TOOL_ACTIONS[1].name)).toBeInTheDocument()
    expect(within(table).getByText(TOOL_ACTIONS[2].name)).toBeInTheDocument()
    expect(within(table).getByText(TOOL_ACTIONS[3].name)).toBeInTheDocument()
    expect(within(table).getByText(TOOL_ACTIONS[4].name)).toBeInTheDocument()
  })

  it('shows the static Run (113) header count', () => {
    render(<ToolsHistoryTable />)
    expect(screen.getByText('Run (113)')).toBeInTheDocument()
  })

  it('renders all three status badges with the expected counts', () => {
    render(<ToolsHistoryTable />)
    expect(screen.getAllByText('In progress')).toHaveLength(2)
    expect(screen.getAllByText('Completed')).toHaveLength(2)
    expect(screen.getAllByText('Failed')).toHaveLength(1)
  })

  it('renders channel pill labels', () => {
    render(<ToolsHistoryTable />)
    expect(screen.getAllByText('Slack')).toHaveLength(2)
    expect(screen.getByText('Outbound Voice')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Widget')).toBeInTheDocument()
  })

  it('renders "n/a" for runs with a null conversation id', () => {
    render(<ToolsHistoryTable />)
    expect(screen.getAllByText('n/a')).toHaveLength(2)
  })
})
