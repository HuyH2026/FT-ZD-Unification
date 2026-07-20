import type { LucideIcon } from 'lucide-react'

export type Channel = string

export type Org = {
  id: string
  name: string
  channels: Channel[]
}

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
  submenu: string[]
}
