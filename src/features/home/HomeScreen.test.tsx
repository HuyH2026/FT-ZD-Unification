import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HomeScreen } from './HomeScreen'

describe('HomeScreen', () => {
  it('renders a full-height white content surface', () => {
    render(<HomeScreen />)
    const surface = screen.getByTestId('screen-home')
    expect(surface).toBeInTheDocument()
    expect(surface.className).toMatch(/rounded-\[26px\]/)
  })
})
