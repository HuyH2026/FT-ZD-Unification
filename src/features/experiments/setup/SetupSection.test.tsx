import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SetupSection } from './SetupSection'

describe('SetupSection', () => {
  it('renders title, subtitle, and children by default', () => {
    render(
      <SetupSection icon={<span>i</span>} title="A/B Test detail" subtitle="Define it.">
        <p>Body content</p>
      </SetupSection>,
    )
    expect(screen.getByText('A/B Test detail')).toBeInTheDocument()
    expect(screen.getByText('Define it.')).toBeInTheDocument()
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('collapses and expands children via the toggle', () => {
    render(
      <SetupSection icon={<span>i</span>} title="Section" subtitle="Sub">
        <p>Body content</p>
      </SetupSection>,
    )
    const toggle = screen.getByRole('button', { name: /section/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Body content')).toBeNull()
  })
})
