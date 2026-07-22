import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { PanelLeft } from 'lucide-react'
import { PRIMARY_NAV, SECONDARY_NAV } from '@/app/nav-config'

type ExpandedSidebarProps = {
  activeLabel: string
  onCollapse: () => void
}

function kebab(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-')
}

export function ExpandedSidebar({ activeLabel, onCollapse }: ExpandedSidebarProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [hoveredSub, setHoveredSub] = useState<string | null>(null)
  const { pathname } = useLocation()

  const renderSection = (items: typeof PRIMARY_NAV, startTop: number) => {
    const activeIdx = items.findIndex((item) => item.label === activeLabel)
    const activeItem = activeIdx >= 0 ? items[activeIdx] : null
    const activeSub = activeItem?.submenu || []
    const hasSub = activeSub.length > 0
    const submenuHeight = hasSub ? activeSub.length * 34 + (activeSub.length - 1) * 4 : 0
    const shift = hasSub ? submenuHeight - 2 : 0

    const topFor = (i: number) => startTop + i * 50 + (hasSub && i > activeIdx ? shift : 0)

    return items.map((item, i) => {
      const top = topFor(i)
      const isActive = item.label === activeLabel
      const isHovered = hoveredRow === item.label && !isActive
      const activeWithSub = isActive && item.submenu.length > 0
      const activeNoSub = isActive && item.submenu.length === 0

      const iconFill = activeNoSub ? '#ffffff' : isHovered ? '#404241' : '#2F3130'
      const textColor = activeNoSub ? '#ffffff' : isHovered ? '#404241' : '#0c0c0d'
      const IconComponent = item.icon

      return (
        <div key={item.label}>
          {/* Active-with-submenu pill (light, rounded-8, wraps the submenu) */}
          {activeWithSub && (
            <div
              className="absolute left-[8px] w-[219px] bg-grey-200 rounded-[8px] z-0"
              style={{ top: top - 7, height: 51 + submenuHeight }}
            />
          )}

          {/* Active-no-submenu pill (dark, rounded-4, wraps the 34px row) */}
          {activeNoSub && (
            <div
              className="absolute left-[8px] w-[219px] h-[34px] bg-ink rounded-[4px] z-0"
              style={{ top }}
            />
          )}

          {/* Hover pill for non-active rows */}
          {isHovered && (
            <div
              className="absolute left-[8px] w-[219px] h-[34px] bg-[#d9d9d9] rounded-[4px] z-0"
              style={{ top }}
            />
          )}

          {/* Header row */}
          <Link
            to={item.path}
            onMouseEnter={() => setHoveredRow(item.label)}
            onMouseLeave={() => setHoveredRow((prev) => (prev === item.label ? null : prev))}
            className="absolute left-[16px] w-[210px] h-[34px] flex items-center gap-2 z-10 no-underline"
            style={{ top }}
            title={item.label}
            aria-label={item.label}
          >
            <IconComponent size={14} color={iconFill} className="shrink-0" />
            <span
              className="font-semibold text-[14px] tracking-[-0.154px] leading-[20px] whitespace-nowrap w-[146px]"
              style={{ color: textColor }}
            >
              {item.label}
            </span>
          </Link>

          {/* Inline submenu for the active item */}
          {activeWithSub && (
            <div
              className="absolute left-[16px] flex flex-col gap-1 z-10"
              style={{ top: top + 32 }}
            >
              {activeSub.map((subItem) => {
                const subPath = `${item.path}/${kebab(subItem)}`
                const selected = pathname === subPath || (pathname === item.path && subItem === activeSub[0])
                const subHovered = hoveredSub === `${item.label}:${subItem}` && !selected
                return (
                  <Link
                    key={subItem}
                    to={subPath}
                    onMouseEnter={() => setHoveredSub(`${item.label}:${subItem}`)}
                    onMouseLeave={() =>
                      setHoveredSub((prev) => (prev === `${item.label}:${subItem}` ? null : prev))
                    }
                    className={`flex items-center pl-6 pr-2.5 py-[7px] rounded-[4px] w-[203px] no-underline transition-colors ${
                      selected
                        ? 'bg-ink'
                        : subHovered
                        ? 'bg-[rgba(100,104,100,0.08)]'
                        : ''
                    }`}
                  >
                    <span
                      className="text-[14px] tracking-[-0.154px] leading-[20px] whitespace-nowrap"
                      style={{ color: selected ? '#ffffff' : subHovered ? '#404241' : '#2f3130' }}
                    >
                      {subItem}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    })
  }

  // Calculate separator position (after PRIMARY_NAV, accounting for active submenu)
  const primaryActiveIdx = PRIMARY_NAV.findIndex((item) => item.label === activeLabel)
  const primaryActiveItem = primaryActiveIdx >= 0 ? PRIMARY_NAV[primaryActiveIdx] : null
  const primaryActiveSub = primaryActiveItem?.submenu || []
  const primaryHasSub = primaryActiveSub.length > 0
  const primarySubmenuHeight = primaryHasSub ? primaryActiveSub.length * 34 + (primaryActiveSub.length - 1) * 4 : 0
  const primaryShift = primaryHasSub ? primarySubmenuHeight - 2 : 0

  const separatorTop = 22 + PRIMARY_NAV.length * 50 + primaryShift
  const secondaryStartTop = separatorTop + 28

  return (
    <div className="relative h-full w-[234px] shrink-0 overflow-hidden">
      {/* PRIMARY NAV */}
      {renderSection(PRIMARY_NAV, 22)}

      {/* Separator */}
      <div
        className="absolute left-[16px] w-[203px] h-px bg-[#d9d7d5]"
        style={{ top: separatorTop }}
      />

      {/* SECONDARY NAV */}
      {renderSection(SECONDARY_NAV, secondaryStartTop)}

      {/* Collapse toggle, bottom-left, aligned under the icon column */}
      <button
        onClick={onCollapse}
        aria-label="Collapse sidebar"
        className="absolute left-[16px] bottom-[12px] flex size-8 items-center justify-center rounded-full bg-white transition-colors hover:bg-[#f5f6f7]"
      >
        <PanelLeft size={16} className="text-ink" />
      </button>
    </div>
  )
}
