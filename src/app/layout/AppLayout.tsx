import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { findNavItemByPath } from '@/app/nav-config'
import { Sidebar } from './Sidebar'
import { ExpandedSidebar } from './ExpandedSidebar'
import { TopBar } from './TopBar'
import { TopicSuggestionsPanel } from '@/features/ai-studio/TopicSuggestionsPanel'

export function AppLayout() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAiStudio, setShowAiStudio] = useState(false)
  const location = useLocation()

  const active = findNavItemByPath(location.pathname)
  const activeLabel = active?.label ?? 'Home'

  const aiStudioPanel = showAiStudio ? (
    <div className="ml-2">
      <TopicSuggestionsPanel onClose={() => setShowAiStudio(false)} />
    </div>
  ) : null

  return (
    <div className="flex flex-col h-screen min-w-[1024px] bg-app-backdrop">
      <TopBar onToggleAiStudio={() => setShowAiStudio((s) => !s)} isAiStudioOpen={showAiStudio} />
      {isExpanded ? (
        <div className="flex flex-1 min-h-0 ml-2 mb-2 mr-2 rounded-[26px] border border-white bg-white/60">
          <ExpandedSidebar activeLabel={activeLabel} onCollapse={() => setIsExpanded(false)} />
          <main className="flex-1 overflow-hidden rounded-[26px]">
            <Outlet />
          </main>
          {aiStudioPanel}
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 ml-2 mb-2 mr-2 rounded-[26px] border border-white bg-white/60">
          <Sidebar onToggleExpand={() => setIsExpanded(true)} />
          <main className="flex-1 overflow-hidden rounded-[26px]">
            <Outlet />
          </main>
          {aiStudioPanel}
        </div>
      )}
    </div>
  )
}
