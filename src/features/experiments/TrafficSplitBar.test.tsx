import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrafficSplitBar } from './TrafficSplitBar'

describe('TrafficSplitBar', () => {
  it('renders a percentage label per split segment', () => {
    render(<TrafficSplitBar splits={[50, 30, 20]} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })
})
