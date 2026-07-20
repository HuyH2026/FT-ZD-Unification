import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { OrgProvider } from '@/app/org-context'
import { OrganizationScreen } from './OrganizationScreen'

function renderScreen() {
  return render(
    <MemoryRouter>
      <OrgProvider>
        <OrganizationScreen />
      </OrgProvider>
    </MemoryRouter>,
  )
}

describe('OrganizationScreen', () => {
  it('renders the title and a Create new action', () => {
    renderScreen()
    expect(screen.getByRole('heading', { name: /organization/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create new/i })).toBeInTheDocument()
  })

  it('lists seeded orgs with channel chips', () => {
    renderScreen()
    expect(screen.getByText('SpaceX')).toBeInTheDocument()
    expect(screen.getByText('Tesla')).toBeInTheDocument()
    // SpaceX has 4 channels -> 3 chips + "+1"
    expect(screen.getByText('+1')).toBeInTheDocument()
  })
})
