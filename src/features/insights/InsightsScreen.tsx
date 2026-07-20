import { Outlet } from 'react-router'

export function InsightsScreen() {
  return (
    <div data-testid="screen-insights" className="h-full rounded-[26px] bg-white">
      <Outlet />
    </div>
  )
}
