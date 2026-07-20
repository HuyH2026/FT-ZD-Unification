import { Link, Outlet, useLocation } from 'react-router'
import { NAV_ITEMS, findNavItemByPath } from '@/app/nav-config'

export function AppLayout() {
  const { pathname } = useLocation()
  const active = findNavItemByPath(pathname)

  return (
    <div className="flex h-screen min-w-[1024px] bg-app-backdrop">
      {/* Minimal nav rail — replaced with full Sidebar in Task 5 */}
      <nav className="flex w-16 shrink-0 flex-col items-center gap-1 py-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active?.label === item.label
          return (
            <Link
              key={item.label}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className="flex h-12 w-12 items-center justify-center rounded-lg"
            >
              <Icon size={20} />
            </Link>
          )
        })}
      </nav>
      <main className="flex-1 overflow-hidden p-2">
        <Outlet />
      </main>
    </div>
  )
}
