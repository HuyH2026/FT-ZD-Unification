import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricStrip } from './MetricStrip'
import { METRICS } from './orchestrator-data'

describe('MetricStrip', () => {
  it('renders every metric card label and value', () => {
    render(<MetricStrip metrics={METRICS} />)
    for (const m of METRICS) {
      expect(screen.getByText(m.label)).toBeInTheDocument()
      expect(screen.getByText(m.value)).toBeInTheDocument()
    }
  })

  it('renders the success-rate delta pill', () => {
    render(<MetricStrip metrics={METRICS} />)
    expect(screen.getByText('10%')).toBeInTheDocument()
  })

  it('renders the conversations-triggered secondary figure', () => {
    render(<MetricStrip metrics={METRICS} />)
    expect(screen.getByText('80%')).toBeInTheDocument()
  })
})
