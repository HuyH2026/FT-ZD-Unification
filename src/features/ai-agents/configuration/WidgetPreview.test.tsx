import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WidgetPreview } from './WidgetPreview'

describe('WidgetPreview', () => {
  it('shows the brand name in the header', () => {
    render(<WidgetPreview brandName="SpaceX support" brandLabel="VIP" tagSummary="Existing Tag 1, Existing Tag 2, +2" />)
    expect(screen.getByText('SpaceX support')).toBeInTheDocument()
  })

  it('renders the composer placeholder and footer', () => {
    render(<WidgetPreview brandName="Member" brandLabel="Member" tagSummary="Existing Tag 1" />)
    expect(screen.getByText('Ask a question…')).toBeInTheDocument()
    expect(screen.getByText(/Built with Zendesk/)).toBeInTheDocument()
  })

  it('shows the filter summary row when the brand has tags', () => {
    render(<WidgetPreview brandName="SpaceX support" brandLabel="VIP" tagSummary="Existing Tag 1, Existing Tag 2, +2" />)
    expect(screen.getByText(/'VIP'/)).toBeInTheDocument()
    expect(screen.getByText('Existing Tag 1, Existing Tag 2, +2')).toBeInTheDocument()
  })

  it('omits the filter row when the brand has no tags', () => {
    render(<WidgetPreview brandName="Partner" brandLabel="Partner" tagSummary="" />)
    expect(screen.queryByText(/for$/)).not.toBeInTheDocument()
  })
})
