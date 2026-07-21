export type Channel = string

export type Org = {
  id: string
  name: string
  channels: Channel[]
}

export type NavIconProps = {
  size?: number
  className?: string
  color?: string
}

export type NavIcon = (props: NavIconProps) => React.JSX.Element

export type NavItem = {
  label: string
  path: string
  icon: NavIcon
  submenu: string[]
}
