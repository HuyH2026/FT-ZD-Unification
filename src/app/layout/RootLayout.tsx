import { Outlet } from 'react-router'
import { OrgProvider } from '@/app/org-context'

// Pathless root layout: owns the single OrgProvider so org state is shared by
// both the app shell (AppLayout) and the full-page create-org flow, which are
// sibling routes. Renders a bare Outlet — no chrome of its own.
export function RootLayout() {
  return (
    <OrgProvider>
      <Outlet />
    </OrgProvider>
  )
}
