import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="flex h-screen min-w-[1024px] bg-app-backdrop">
      <Sidebar isExpanded={isExpanded} onToggleExpand={() => setIsExpanded((v) => !v)} />
      <main className="flex-1 overflow-hidden p-2">
        <Outlet />
      </main>
    </div>
  )
}
