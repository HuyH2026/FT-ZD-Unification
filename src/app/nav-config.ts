import {
  HomeIcon, InsightsIcon, AiAgentsIcon, KnowledgeIcon, ToolsIcon, ExperimentsIcon,
  OrchestratorIcon, IntegrationsIcon, LogIcon, SettingsIcon, OrganizationIcon,
} from '@/components/nav-icons'
import type { NavItem } from '@/types'

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', icon: HomeIcon, submenu: [] },
  { label: 'Insights', path: '/insights', icon: InsightsIcon, submenu: ['CX Journey', 'AI Performances'] },
  { label: 'AI Agents', path: '/ai-agents', icon: AiAgentsIcon, submenu: ['Agent Builder', 'Configuration', 'QA'] },
  { label: 'Knowledge', path: '/knowledge', icon: KnowledgeIcon, submenu: ['Insights', 'Contents', 'Coaching'] },
  { label: 'Tools', path: '/tools', icon: ToolsIcon, submenu: [] },
  { label: 'Experiments', path: '/experiments', icon: ExperimentsIcon, submenu: ['A/B Test', 'Test Suite', 'Simulations'] },
  { label: 'Orchestrator', path: '/orchestrator', icon: OrchestratorIcon, submenu: [] },
  { label: 'Integrations', path: '/integrations', icon: IntegrationsIcon, submenu: [] },
  { label: 'Log', path: '/log', icon: LogIcon, submenu: [] },
  { label: 'Settings', path: '/settings', icon: SettingsIcon, submenu: ['Account', 'Security'] },
  { label: 'Organization', path: '/organization', icon: OrganizationIcon, submenu: [] },
]

export const PRIMARY_NAV = NAV_ITEMS.slice(0, 10)
export const SECONDARY_NAV = NAV_ITEMS.slice(10)

export function findNavItemByPath(pathname: string): NavItem | undefined {
  const exact = NAV_ITEMS.find((i) => i.path === pathname)
  if (exact) return exact
  // Longest non-root path that prefixes the pathname (handles nested routes).
  return NAV_ITEMS
    .filter((i) => i.path !== '/' && pathname.startsWith(i.path + '/'))
    .sort((a, b) => b.path.length - a.path.length)[0]
}
