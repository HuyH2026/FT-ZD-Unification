import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AutomationTable } from './AutomationTable'
import { AUTOMATIONS } from './orchestrator-data'

describe('AutomationTable', () => {
  it('renders a row per automation with its name and run count', () => {
    render(<AutomationTable automations={AUTOMATIONS} isOn={(a) => a.on} onToggle={() => {}} />)
    for (const a of AUTOMATIONS) {
      expect(screen.getByText(a.name)).toBeInTheDocument()
    }
    expect(screen.getAllByText('200')).toHaveLength(AUTOMATIONS.length)
  })

  it('reflects on/off state via aria-checked', () => {
    render(<AutomationTable automations={AUTOMATIONS} isOn={(a) => a.on} onToggle={() => {}} />)
    expect(screen.getByLabelText('Activate Call users with issues')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Activate Refund request')).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onToggle with the row id when a switch is clicked', () => {
    const onToggle = vi.fn()
    render(<AutomationTable automations={AUTOMATIONS} isOn={(a) => a.on} onToggle={onToggle} />)
    fireEvent.click(screen.getByLabelText('Activate Refund request'))
    expect(onToggle).toHaveBeenCalledWith('a2')
  })

  it('calls onOpen with the automation id when a row is clicked', () => {
    const onOpen = vi.fn()
    render(<AutomationTable automations={AUTOMATIONS} isOn={(a) => a.on} onToggle={() => {}} onOpen={onOpen} />)
    fireEvent.click(screen.getByText('Call users with issues'))
    expect(onOpen).toHaveBeenCalledWith('a1')
  })

  it('does not call onOpen when the toggle is clicked', () => {
    const onOpen = vi.fn()
    render(<AutomationTable automations={AUTOMATIONS} isOn={(a) => a.on} onToggle={() => {}} onOpen={onOpen} />)
    fireEvent.click(screen.getByLabelText('Activate Call users with issues'))
    expect(onOpen).not.toHaveBeenCalled()
  })
})
