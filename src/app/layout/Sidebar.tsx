import { Link, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { PanelLeft } from 'lucide-react'
import { PRIMARY_NAV, SECONDARY_NAV, findNavItemByPath } from '@/app/nav-config'
import type { NavItem } from '@/types'
import { useHoverIntent } from './useHoverIntent'

interface SidebarProps {
  onToggleExpand: () => void
}

function kebabCase(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-')
}

// A single collapsed-rail entry: a 56×48 row (the hover/hit target) wrapping a
// 32×32 pill that carries the active/hover background — matching the Figma spec,
// where the pill is centered with margin rather than filling the rail.
function NavRailItem({
  item,
  isActive,
  onOpen,
  onScheduleClose,
}: {
  item: NavItem
  isActive: boolean
  onOpen: (label: string) => void
  onScheduleClose: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      to={item.path}
      aria-current={isActive ? 'page' : undefined}
      aria-label={item.label}
      onMouseEnter={() => onOpen(item.label)}
      onMouseLeave={onScheduleClose}
      className="group flex h-12 w-14 items-center justify-center"
    >
      <span
        className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
          isActive ? 'bg-nav-active' : 'group-hover:bg-[rgba(92,105,112,0.08)]'
        }`}
      >
        <Icon
          size={20}
          className={isActive ? 'text-white' : 'text-ink group-hover:text-[#39434B]'}
        />
      </span>
    </Link>
  )
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

  return (
    <div className="relative flex h-full w-14 shrink-0 flex-col">
      {/* Primary nav items */}
      <div className="flex flex-col items-center gap-0 py-3">
        {PRIMARY_NAV.map((item) => (
          <NavRailItem
            key={item.label}
            item={item}
            isActive={active?.label === item.label}
            onOpen={open}
            onScheduleClose={scheduleClose}
          />
        ))}
      </div>

      {/* Separator */}
      <div className="mx-auto my-2 h-px w-8 bg-[#e8eaec]" />

      {/* Secondary nav items (Organization) */}
      <div className="flex flex-col items-center gap-0">
        {SECONDARY_NAV.map((item) => (
          <NavRailItem
            key={item.label}
            item={item}
            isActive={active?.label === item.label}
            onOpen={open}
            onScheduleClose={scheduleClose}
          />
        ))}
      </div>

      {/* Expand toggle button pinned to bottom */}
      <div className="mt-auto flex items-end justify-center pb-3">
        <button
          aria-label="Expand sidebar"
          onClick={onToggleExpand}
          className="flex size-8 items-center justify-center rounded-full bg-white transition-colors hover:bg-[#f5f6f7]"
        >
          <PanelLeft size={16} className="text-ink" />
        </button>
      </div>

      {/* Hover flyover menu — shown for every hovered item; the label always
          renders, and the submenu list only when the item has one. */}
      <AnimatePresence>
        {activeKey && activeItem && (
          <motion.div
            data-testid="nav-flyover"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            onMouseEnter={() => open(activeKey)}
            onMouseLeave={scheduleClose}
            className={`absolute left-14 z-50 w-[226px] overflow-hidden rounded-[8px] border border-grey-200 bg-white pt-[11px] shadow-[0px_16px_24px_0px_rgba(10,13,14,0.16)] ${
              activeItem.submenu.length > 0 ? 'pb-0' : 'pb-[11px]'
            }`}
            style={{
              top: `${flyoverTop(activeKey)}px`,
            }}
          >
            {/* Label — links to the item itself */}
            <Link
              to={activeItem.path}
              className={`flex items-center pl-[11px] ${
                activeItem.submenu.length > 0 ? 'mb-3' : 'mb-0'
              }`}
            >
              <div className="w-[146px] text-[14px] font-semibold leading-[20px] tracking-[-0.154px] text-grey-1200">
                {activeKey}
              </div>
            </Link>

            {/* Submenu items */}
            {activeItem.submenu.length > 0 && (
              <div className="flex flex-col gap-1 pb-3 pl-[7px]">
                {activeItem.submenu.map((subItem) => (
                  <Link
                    key={subItem}
                    to={`${activeItem.path}/${kebabCase(subItem)}`}
                    className="flex items-center rounded-[4px] py-[7px] pl-6 pr-2.5 text-left transition-colors hover:bg-[rgba(100,104,100,0.08)]"
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
