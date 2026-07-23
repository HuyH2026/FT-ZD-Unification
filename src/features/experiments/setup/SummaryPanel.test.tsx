import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SummaryPanel } from './SummaryPanel'

describe('SummaryPanel', () => {
  it('renders summary heading, both variant titles, recommendation, and Apply', () => {
    render(<SummaryPanel />)
    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument()
    expect(screen.getByText('Manual login')).toBeInTheDocument()
    expect(screen.getByText('Fully automated login assistance')).toBeInTheDocument()
    expect(screen.getByText('Recommendations')).toBeInTheDocument()
    expect(screen.getByText('Test duration: 2 weeks')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
  })
})
