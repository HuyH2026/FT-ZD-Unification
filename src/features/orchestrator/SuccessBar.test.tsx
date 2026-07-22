import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SuccessBar } from './SuccessBar'

describe('SuccessBar', () => {
  it('renders the success and remainder percentages', () => {
    render(<SuccessBar rate={99} />)
    expect(screen.getByText('99%')).toBeInTheDocument()
    expect(screen.getByText('1%')).toBeInTheDocument()
  })

  it('renders n/a when the rate is null', () => {
    render(<SuccessBar rate={null} />)
    expect(screen.getByText('n/a')).toBeInTheDocument()
  })
})
