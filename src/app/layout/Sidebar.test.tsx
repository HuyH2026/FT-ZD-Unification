import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Sidebar } from './Sidebar'

function renderSidebar(onToggleExpand = vi.fn()) {
  return render(
    <MemoryRouter>
      <Sidebar onToggleExpand={onToggleExpand} />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  it('renders a link per nav item', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /organization/i })).toBeInTheDocument()
  })

  it('opens a flyover with submenu items on hover', async () => {
    const user = userEvent.setup()
    renderSidebar()
    await user.hover(screen.getByRole('link', { name: /insights/i }))
    expect(await screen.findByText('CX Journey')).toBeInTheDocument()
    expect(screen.getByText('AI Performances')).toBeInTheDocument()
  })

  it('calls onToggleExpand when the expand toggle is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    renderSidebar(onToggle)
    await user.click(screen.getByRole('button', { name: /expand sidebar/i }))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
