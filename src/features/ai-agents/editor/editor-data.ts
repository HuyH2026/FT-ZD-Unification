// Icon + color mappings for the editor palette and inline policy chips.
import {
  Code2, GitBranch, FileText, MessageSquare, LayoutGrid, Image as ImageIcon,
  SmilePlus, Paperclip, ListChecks, Layers, Zap, type LucideIcon,
} from 'lucide-react'
import type { StepType, ChipVariant } from '../agent-store'

export const STEP_ICON: Record<StepType, LucideIcon> = {
  options: ListChecks,
  condition: GitBranch,
  form: FileText,
  text: MessageSquare,
  'dynamic-card': LayoutGrid,
  image: ImageIcon,
  csat: SmilePlus,
  attachment: Paperclip,
  code: Code2,
}

// Colored circular badge behind each palette step icon, per Figma. `fg` is the
// glyph color, `bg` the tinted circle.
export const STEP_BADGE: Record<StepType, { fg: string; bg: string }> = {
  options: { fg: '#1f73b7', bg: '#e3f0f9' },
  condition: { fg: '#b8710a', bg: '#ffdfa2' },
  form: { fg: '#724be8', bg: '#ece6fd' },
  text: { fg: '#545767', bg: '#eef0f4' },
  'dynamic-card': { fg: '#0f8a8f', bg: '#dbf1f2' },
  image: { fg: '#0f8a5f', bg: '#dbf3ea' },
  csat: { fg: '#d6337c', bg: '#fce0ee' },
  attachment: { fg: '#1f73b7', bg: '#e3f0f9' },
  code: { fg: '#ffffff', bg: '#2f3130' },
}

// Leading glyph for an inline policy chip, derived from its variant.
export const CHIP_ICON: Record<ChipVariant, LucideIcon> = {
  form: Layers,
  routing: GitBranch,
  event: Zap,
  action: Zap,
  trigger: MessageSquare,
}

// Chip tints per Figma: form = green, routing = purple, event = blue,
// action = filled dark, trigger = neutral.
export const CHIP_STYLE: Record<ChipVariant, { text: string; border: string; bg: string }> = {
  form: { text: '#0f8a5f', border: '#0f8a5f', bg: '#0f8a5f14' },
  routing: { text: '#724be8', border: '#724be8', bg: '#724be814' },
  event: { text: '#1f73b7', border: '#1f73b7', bg: '#1f73b714' },
  action: { text: '#2f3130', border: '#e2e0dd', bg: '#ffffff' },
  trigger: { text: '#8b8e89', border: '#e2e0dd', bg: '#f4f3f1' },
}
