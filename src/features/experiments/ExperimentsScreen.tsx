import { Outlet } from 'react-router'

export function ExperimentsScreen() {
  return (
    <div data-testid="screen-experiments" className="h-full overflow-y-auto rounded-[26px] bg-white">
      <Outlet />
    </div>
  )
}
