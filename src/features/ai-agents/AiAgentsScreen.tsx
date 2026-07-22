import { Outlet } from 'react-router'

export function AiAgentsScreen() {
  return (
    <div data-testid="screen-ai-agents" className="h-full rounded-[26px] bg-white">
      <Outlet />
    </div>
  )
}
