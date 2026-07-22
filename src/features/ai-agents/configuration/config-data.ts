// Mock data + types for the AI Agents → Configuration (Widget) screen.
// Frontend-only; no backend. Values mirror the Figma design (frame Config_01).
import type { GardenIconName } from '@/components/garden-icon'

// `color` is the per-channel brand tint of the tab's icon (from Figma); it stays
// applied whether or not the tab is active. No design token — brand-specific.
export type ChannelTab = { id: 'widget' | 'voice' | 'webcall' | 'headless'; label: string; color: string }

export const CHANNEL_TABS: ChannelTab[] = [
  { id: 'widget', label: 'Widget', color: '#e05c34' },
  { id: 'voice', label: 'Voice', color: '#be297b' },
  { id: 'webcall', label: 'Web Call', color: '#7c1d79' },
  { id: 'headless', label: 'Headless', color: '#2f99b3' },
]

// Per-brand AI Personality config (the Sentiment rail section). Freeform text +
// optional preset tone chips. Both `toneUse*` flags gate their control in the UI.
export type Personality = {
  generalContext: string
  glossary: string
  toneFreeform: string
  toneUseFreeform: boolean
  toneUsePresets: boolean
  tonePresets: string[]
}

export function emptyPersonality(): Personality {
  return {
    generalContext: '',
    glossary: '',
    toneFreeform: '',
    toneUseFreeform: false,
    toneUsePresets: false,
    tonePresets: [],
  }
}

// A brand a customer can configure a widget for. `swatch` is the list dot color;
// `name` is the editable brand name shown in the preview header + panel input.
export type Brand = {
  id: string
  name: string
  swatch: string
  tags: string[]
  isDefault: boolean
  enabled: boolean
  personality: Personality
}

export const SEED_BRANDS: Brand[] = [
  { id: 'vip', name: 'SpaceX support', swatch: '#e0559a', tags: ['Existing Tag 1', 'Existing Tag 2', 'Existing Tag 3', 'Existing Tag 4'], isDefault: true, enabled: true, personality: emptyPersonality() },
  { id: 'member', name: 'Member', swatch: '#4f8bf0', tags: ['Existing Tag 1'], isDefault: false, enabled: true, personality: emptyPersonality() },
  { id: 'partner', name: 'Partner', swatch: '#a06cf0', tags: [], isDefault: false, enabled: false, personality: emptyPersonality() },
]

// The list shows a short label (VIP / Member / Partner); the editable `name`
// drives the preview header + panel input (they are intentionally decoupled).
export const BRAND_LIST_LABELS: Record<string, string> = { vip: 'VIP', member: 'Member', partner: 'Partner' }

// Right-edge customization rail. Only 'brands' has designed panel content; the
// rest highlight on click but do not swap the panel in this phase. Sections from
// 'code' onward form a trailing group rendered below a divider.
export type RailSection = { id: string; icon: GardenIconName; label: string }

export const RAIL_SECTIONS: RailSection[] = [
  { id: 'brands', icon: 'user-group-stroke', label: 'Brands' },
  { id: 'links', icon: 'link-stroke', label: 'Links' },
  { id: 'sentiment', icon: 'heart-stroke', label: 'Sentiment' },
  { id: 'license', icon: 'credit-card-stroke', label: 'License' },
  { id: 'mood', icon: 'smiley-stroke', label: 'Mood' },
  { id: 'announce', icon: 'megaphone-stroke', label: 'Announcements' },
  { id: 'code', icon: 'markup-stroke', label: 'Code' },
  { id: 'appearance', icon: 'lightbulb-stroke', label: 'Appearance' },
  { id: 'install', icon: 'download-stroke', label: 'Install' },
  { id: 'messages', icon: 'speech-bubble-lightning-stroke', label: 'Messages' },
  { id: 'more', icon: 'overflow-stroke', label: 'More' },
]

// First section id in the trailing group (a divider is rendered before it).
export const RAIL_TRAILING_START = 'code'

// Suggested tags for the (decorative) "Assign tags" dropdown.
export const SUGGESTED_TAGS = ['Existing Tag 1', 'Existing Tag 2', 'Existing Tag 3', 'Existing Tag 4']

// Compact summary of a brand's tags for the filter row above the preview
// (e.g. ['A','B','C','D'] → "A, B, +2"). Empty when the brand has no tags.
export function summarizeTags(tags: string[]): string {
  if (tags.length === 0) return ''
  if (tags.length <= 2) return tags.join(', ')
  return `${tags.slice(0, 2).join(', ')}, +${tags.length - 2}`
}

// Tone presets shown as toggle chips in the AI Personality panel.
export const TONE_PRESET_OPTIONS = [
  'Empathetic', 'Friendly', 'Professional', 'Straightforward', 'Humorous', 'Formal',
] as const

// Static copy for the AI Personality panel's three sections (mirrors Figma Config_02).
export const AI_PERSONALITY_COPY = {
  intro:
    "General AI Instructions define the AI's overall tone and behavior. Use them to set the voice, preferred terminology, formatting standards, and how the AI should respond to different user types.",
  generalContext: {
    label: 'General Context',
    helper: 'What should the AI know about your company and customers?',
    placeholder:
      'Example:\nWe sell products to both buyers and sellers.\nBuyer Persona: Focused on product details, pricing, shipping, and support.\nSeller Persona: Focused on inventory, sales tools, and account features.',
    footnote: 'Keep it under 100 words',
  },
  glossary: {
    label: 'Glossary',
    helper: 'What key terms from the glossary should the AI know?',
    placeholder:
      'Example:\n"NPF" for product feature\n"PF" stand for Paid Feature\n"FT" stands for Fee Trial',
    footnote: 'Keep it under 100 words',
  },
  tone: {
    label: 'Tone of Voice',
    helper: "What is your company's style, and how should the AI communicate?",
    freeformCheckboxLabel: 'Describe tone in your own words',
    presetsCheckboxLabel: 'Choose from presets',
    placeholder:
      'Example:\nFormal and professional tone.\nCasual and friendly tone.\nTechnical and actionable tone when giving advice.\nUse a numerical format to break down complex information for clarity.',
    footnote: 'Keep it under 100 words',
  },
} as const
