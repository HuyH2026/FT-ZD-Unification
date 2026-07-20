import { Link, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { PRIMARY_NAV, SECONDARY_NAV, findNavItemByPath } from '@/app/nav-config'
import { useHoverIntent } from './useHoverIntent'

interface SidebarProps {
  onToggleExpand: () => void
}

function kebabCase(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-')
}

// Flyover positioning constants to match the flex rail layout
const RAIL_TOP_PAD = 12 // py-3
const ITEM_H = 48 // h-12
const SEP_SPACE = 17 // my-2 (8+8) + 1px line

function flyoverTop(label: string): number {
  const p = PRIMARY_NAV.findIndex((i) => i.label === label)
  if (p !== -1) return RAIL_TOP_PAD + p * ITEM_H
  const s = SECONDARY_NAV.findIndex((i) => i.label === label)
  return RAIL_TOP_PAD + PRIMARY_NAV.length * ITEM_H + SEP_SPACE + s * ITEM_H
}

export function Sidebar({ onToggleExpand }: SidebarProps) {
  const { pathname } = useLocation()
  const active = findNavItemByPath(pathname)
  const { activeKey, open, scheduleClose } = useHoverIntent(140)

  const activeItem = PRIMARY_NAV.concat(SECONDARY_NAV).find((item) => activeKey === item.label)
  const hasSubmenu = activeItem && activeItem.submenu.length > 0

  return (
    <div className="relative flex h-full w-16 shrink-0 flex-col bg-white">
      {/* Primary nav items */}
      <div className="flex flex-col items-center gap-0 py-3">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon
          const isActive = active?.label === item.label
          return (
            <Link
              key={item.label}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              onMouseEnter={() => open(item.label)}
              onMouseLeave={scheduleClose}
              className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-nav-active'
                  : 'hover:bg-[rgba(92,105,112,0.08)]'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-white' : 'text-ink hover:text-[#39434B]'}
              />
            </Link>
          )
        })}
      </div>

      {/* Separator */}
      <div className="mx-auto my-2 h-px w-8 bg-[#e8eaec]" />

      {/* Secondary nav items (Organization) */}
      <div className="flex flex-col items-center gap-0">
        {SECONDARY_NAV.map((item) => {
          const Icon = item.icon
          const isActive = active?.label === item.label
          return (
            <Link
              key={item.label}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              onMouseEnter={() => open(item.label)}
              onMouseLeave={scheduleClose}
              className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-nav-active'
                  : 'hover:bg-[rgba(92,105,112,0.08)]'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-white' : 'text-ink hover:text-[#39434B]'}
              />
            </Link>
          )
        })}
      </div>

      {/* Expand toggle button pinned to bottom */}
      <div className="mt-auto flex items-end justify-center pb-3">
        <button
          aria-label="Expand sidebar"
          onClick={onToggleExpand}
          className="flex h-12 w-12 items-center justify-center rounded-lg transition-colors hover:bg-[rgba(92,105,112,0.08)]"
        >
          <ChevronRight size={20} className="text-ink" />
        </button>
      </div>

      {/* Hover flyover menu */}
      <AnimatePresence>
        {activeKey && hasSubmenu && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            onMouseEnter={() => open(activeKey)}
            onMouseLeave={scheduleClose}
            className="absolute left-[63.2px] z-50 w-[226px] overflow-hidden rounded-[8px] border border-[#eae9e8] bg-white pt-[11px] shadow-[0px_16px_24px_0px_rgba(10,13,14,0.16)]"
            style={{
              top: `${flyoverTop(activeKey)}px`,
            }}
          >
            {/* Label (non-interactive, just shows the item label) */}
            <div className="mb-[12px] flex items-center pl-[11px]">
              <div className="w-[146px] text-[14px] font-semibold leading-[20px] tracking-[-0.154px] text-[#0c0c0d]">
                {activeKey}
              </div>
            </div>

            {/* Submenu items */}
            {activeItem.submenu.length > 0 && (
              <div className="flex flex-col gap-[4px] pb-[12px] pl-[7px]">
                {activeItem.submenu.map((subItem) => (
                  <Link
                    key={subItem}
                    to={`${activeItem.path}/${kebabCase(subItem)}`}
                    className="flex items-center rounded-[4px] py-[7px] pl-[24px] pr-[10px] text-left transition-colors hover:bg-[rgba(100,104,100,0.08)]"
                  >
                    <span className="whitespace-nowrap text-[14px] leading-[20px] tracking-[-0.154px] text-ink">
                      {subItem}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
