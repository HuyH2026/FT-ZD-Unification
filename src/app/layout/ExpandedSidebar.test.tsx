import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ExpandedSidebar } from './ExpandedSidebar'

describe('ExpandedSidebar', () => {
  it('renders labels for all nav items', () => {
    render(
      <MemoryRouter>
        <ExpandedSidebar activeLabel="Home" onCollapse={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /^Home$/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Insights$/ })).toBeInTheDocument()
  })

  it('calls onCollapse when the collapse toggle is clicked', async () => {
    const user = userEvent.setup()
    const onCollapse = vi.fn()
    render(
      <MemoryRouter>
        <ExpandedSidebar activeLabel="Home" onCollapse={onCollapse} />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(onCollapse).toHaveBeenCalledOnce()
  })

  it('highlights submenu based on URL pathname', () => {
    // When at /insights/ai-performances, AI Performances should be selected
    render(
      <MemoryRouter initialEntries={['/insights/ai-performances']}>
        <ExpandedSidebar activeLabel="Insights" onCollapse={vi.fn()} />
      </MemoryRouter>,
    )
    const aiPerformancesLink = screen.getByRole('link', { name: /ai performances/i })
    expect(aiPerformancesLink).toBeInTheDocument()
    // Selected links have the dark background class and white text
    expect(aiPerformancesLink.className).toContain('bg-[#2f3130]')

    // CX Journey should NOT be selected
    const cxJourneyLink = screen.getByRole('link', { name: /cx journey/i })
    expect(cxJourneyLink.className).not.toContain('bg-[#2f3130]')
  })
})
