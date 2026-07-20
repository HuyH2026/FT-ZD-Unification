import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { OrgProvider } from '@/app/org-context'
import { OrgSwitcher } from './OrgSwitcher'

function renderSwitcher() {
  return render(
    <MemoryRouter>
      <OrgProvider>
        <OrgSwitcher />
      </OrgProvider>
    </MemoryRouter>,
  )
}

describe('OrgSwitcher', () => {
  it('shows the current org and lists orgs on open', async () => {
    const user = userEvent.setup()
    renderSwitcher()
    expect(screen.getByText('SpaceX')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /switch organization/i }))
    expect(await screen.findByRole('menuitem', { name: /tesla/i })).toBeInTheDocument()
  })

  it('switches the current org on selection', async () => {
    const user = userEvent.setup()
    renderSwitcher()
    // Initially shows SpaceX in the current org display (first span, not in menu yet)
    const allSpaceX = screen.getAllByText('SpaceX')
    expect(allSpaceX).toHaveLength(1)
    expect(allSpaceX[0].tagName).toBe('SPAN')

    await user.click(screen.getByRole('button', { name: /switch organization/i }))
    await user.click(await screen.findByRole('menuitem', { name: /tesla/i }))

    // After switch, the current org display (span) should show Tesla
    const allTesla = await screen.findAllByText('Tesla')
    const currentOrgDisplay = allTesla.find((el) => el.tagName === 'SPAN')
    expect(currentOrgDisplay).toBeInTheDocument()
    expect(currentOrgDisplay?.className).toContain('text-ink')
  })
})
