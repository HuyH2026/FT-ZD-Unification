import {
  Home, BarChart3, Bot, BookOpen, Wrench, FlaskConical,
  Workflow, Plug, ScrollText, Settings, Building2,
} from 'lucide-react'
import type { NavItem } from '@/types'

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', icon: Home, submenu: [] },
  { label: 'Insights', path: '/insights', icon: BarChart3, submenu: ['CX Journey', 'AI Performances'] },
  { label: 'AI Agents', path: '/ai-agents', icon: Bot, submenu: ['Agent Builder', 'Configuration', 'QA'] },
  { label: 'Knowledge', path: '/knowledge', icon: BookOpen, submenu: ['Insights', 'Contents', 'Coaching'] },
  { label: 'Tools', path: '/tools', icon: Wrench, submenu: [] },
  { label: 'Experiments', path: '/experiments', icon: FlaskConical, submenu: ['A/B Test', 'Test Suite', 'Simulations'] },
  { label: 'Orchestrator', path: '/orchestrator', icon: Workflow, submenu: [] },
  { label: 'Integrations', path: '/integrations', icon: Plug, submenu: [] },
  { label: 'Log', path: '/log', icon: ScrollText, submenu: [] },
  { label: 'Settings', path: '/settings', icon: Settings, submenu: ['Account', 'Security'] },
  { label: 'Organization', path: '/organization', icon: Building2, submenu: [] },
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
