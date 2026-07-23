import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricStrip } from './MetricStrip'
import { METRICS } from './experiments-data'

describe('MetricStrip', () => {
  it('renders every metric label and value', () => {
    render(<MetricStrip metrics={METRICS} />)
    expect(screen.getByText('Total Tests')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('55,987')).toBeInTheDocument()
    expect(screen.getByText('41,312')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('4.1')).toBeInTheDocument()
  })
})
