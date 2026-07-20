import { describe, it, expect } from 'vitest'
import { NAV_ITEMS, PRIMARY_NAV, SECONDARY_NAV, findNavItemByPath } from './nav-config'

describe('nav-config', () => {
  it('lists all nav items in order with correct paths', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      'Home', 'Insights', 'AI Agents', 'Knowledge', 'Tools',
      'Experiments', 'Orchestrator', 'Integrations', 'Log', 'Settings', 'Organization',
    ])
    expect(NAV_ITEMS.find((i) => i.label === 'Home')?.path).toBe('/')
    expect(NAV_ITEMS.find((i) => i.label === 'AI Agents')?.path).toBe('/ai-agents')
  })

  it('splits primary (10) and secondary (Organization) groups', () => {
    expect(PRIMARY_NAV).toHaveLength(10)
    expect(SECONDARY_NAV.map((i) => i.label)).toEqual(['Organization'])
  })

  it('carries submenus where the design defines them', () => {
    expect(NAV_ITEMS.find((i) => i.label === 'Insights')?.submenu).toEqual([
      'CX Journey', 'AI Performances',
    ])
    expect(NAV_ITEMS.find((i) => i.label === 'Tools')?.submenu).toEqual([])
  })

  it('resolves the active item from a pathname, including nested routes', () => {
    expect(findNavItemByPath('/')?.label).toBe('Home')
    expect(findNavItemByPath('/insights')?.label).toBe('Insights')
    expect(findNavItemByPath('/insights/ai-performances')?.label).toBe('Insights')
    expect(findNavItemByPath('/nope')).toBeUndefined()
  })
})
