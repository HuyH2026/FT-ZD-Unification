import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WidgetPreview } from './WidgetPreview'

describe('WidgetPreview', () => {
  it('shows the brand name in the header', () => {
    render(<WidgetPreview brandName="SpaceX support" />)
    expect(screen.getByText('SpaceX support')).toBeInTheDocument()
  })

  it('renders the composer placeholder and footer', () => {
    render(<WidgetPreview brandName="Member" />)
    expect(screen.getByText('Ask a question…')).toBeInTheDocument()
    expect(screen.getByText(/Built with Zendesk/)).toBeInTheDocument()
  })
})
