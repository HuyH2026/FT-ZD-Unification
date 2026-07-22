// Mock data + types for the AI Agents → Configuration (Widget) screen.
// Frontend-only; no backend. Values mirror the Figma design (frame Config_01).
import type { LucideIcon } from 'lucide-react'
import { Users, Link2, Heart, BadgeCheck, Smile, Megaphone, Code2, Globe, MessageSquare } from 'lucide-react'

export type ChannelTab = { id: 'widget' | 'voice' | 'webcall' | 'headless'; label: string }

export const CHANNEL_TABS: ChannelTab[] = [
  { id: 'widget', label: 'Widget' },
  { id: 'voice', label: 'Voice' },
  { id: 'webcall', label: 'Web Call' },
  { id: 'headless', label: 'Headless' },
]

// A brand a customer can configure a widget for. `swatch` is the list dot color;
// `name` is the editable brand name shown in the preview header + panel input.
export type Brand = {
  id: string
  name: string
  swatch: string
  tags: string[]
  isDefault: boolean
  enabled: boolean
}

export const SEED_BRANDS: Brand[] = [
  { id: 'vip', name: 'SpaceX support', swatch: '#e0559a', tags: ['Existing Tag 1', 'Existing Tag 2', 'Existing Tag 3', 'Existing Tag 4'], isDefault: true, enabled: true },
  { id: 'member', name: 'Member', swatch: '#4f8bf0', tags: ['Existing Tag 1'], isDefault: false, enabled: true },
  { id: 'partner', name: 'Partner', swatch: '#a06cf0', tags: [], isDefault: false, enabled: false },
]

// The list shows a short label (VIP / Member / Partner); the editable `name`
// drives the preview header + panel input (they are intentionally decoupled).
export const BRAND_LIST_LABELS: Record<string, string> = { vip: 'VIP', member: 'Member', partner: 'Partner' }

// Right-edge customization rail. Only 'brands' has designed panel content; the
// rest highlight on click but do not swap the panel in this phase. Sections from
// 'code' onward form a trailing group rendered below a divider.
export type RailSection = { id: string; icon: LucideIcon; label: string }

export const RAIL_SECTIONS: RailSection[] = [
  { id: 'brands', icon: Users, label: 'Brands' },
  { id: 'links', icon: Link2, label: 'Links' },
  { id: 'sentiment', icon: Heart, label: 'Sentiment' },
  { id: 'license', icon: BadgeCheck, label: 'License' },
  { id: 'mood', icon: Smile, label: 'Mood' },
  { id: 'announce', icon: Megaphone, label: 'Announcements' },
  { id: 'code', icon: Code2, label: 'Code' },
  { id: 'locale', icon: Globe, label: 'Locale' },
  { id: 'messages', icon: MessageSquare, label: 'Messages' },
]

// First section id in the trailing group (a divider is rendered before it).
export const RAIL_TRAILING_START = 'code'

// Suggested tags for the (decorative) "Assign tags" dropdown.
export const SUGGESTED_TAGS = ['Existing Tag 1', 'Existing Tag 2', 'Existing Tag 3', 'Existing Tag 4']
