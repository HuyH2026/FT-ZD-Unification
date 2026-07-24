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

// ── Headless tab ────────────────────────────────────────────────────────────
// Frontend-only mock content for the AI Agents → Configuration → Headless tab.
// Mirrors Figma frames 225-6282 (tab) and 145-75243 (instruction content).

export const HEADLESS_INTRO =
  'Run your agent with a direct API key, or layer on the A2A protocol so other agents can discover and call it. Both modes use the same key. A2A adds a public agent card and a message endpoint on top.'

export const A2A_HEADING = 'A2A ( Agent to Agent)'

export const A2A_DESCRIPTION =
  'An open standard that lets AI agents from any vendor talk to your headless agent. Forethought publishes an agent card and message endpoint for you. Point any A2A client at them to start an authenticated support conversation. Your CX team stays in full control of the policies and Autoflows behind it.'

export const A2A_AGENT_CARD_URL =
  'https://app.forethought.ai/solve/a2a/acme/.well-known/agent-card.json'
export const A2A_MESSAGE_ENDPOINT = 'https://app.forethought.ai/solve/a2a/acme/v1/message'

// The masked API-key display (shown until the eye toggle reveals the real value).
export const API_KEY_MASK = '••••••••••••••'

export type HeadlessStep = {
  n: string
  title: string
  body: string
  code: string
  codeCaption?: string
}

const BEARER = 'Authorization: Bearer ft_a2a_live_9b3f7c21d8a64e05'

export const HEADLESS_STEPS: HeadlessStep[] = [
  {
    n: '01',
    title: 'Add Forethought as an A2A agent',
    body: 'In your A2A client, register a new agent using your Agent Card URL. The client reads the card and discovers the skill, endpoint, and auth automatically, no manual config.',
    code: `# Agent Card URL\n${A2A_AGENT_CARD_URL}`,
  },
  {
    n: '02',
    title: 'Authenticate with your API key',
    body: 'Send your A2A API key as a Bearer token on every request.',
    code: BEARER,
  },
  {
    n: '03',
    title: "Pass the end-user's identity",
    body: "Include the customer's signed token so Solve treats the conversation as authenticated and can act on their account.",
    code: BEARER,
  },
  {
    n: '04',
    title: 'Send a message',
    body: "POST a JSON-RPC message/send to your message endpoint. Forethought replies with a task and the agent's answer; reuse the returned task id for follow-up turns.",
    code: `POST ${A2A_MESSAGE_ENDPOINT}
{
  "jsonrpc": "2.0", "id": "1", "method": "message/send",
  "params": { "message": {
    "role": "user", "messageId": "m-1",
    "parts": [{ "kind": "text", "text": "Where is my refund for order 12345?" }]
  }}
}`,
  },
]

// Deterministic mock API keys (no Date.now/Math.random — see org-context seq).
let keySeq = 0
function keyFrom(n: number): string {
  // Pad a counter-derived hex to a stable, key-looking suffix.
  const suffix = (0x9b3f7c21d8a64e05n + BigInt(n) * 0x1_0000_1111n).toString(16).slice(0, 16)
  return `ft_a2a_live_${suffix}`
}
export function seedApiKey(): string {
  return keyFrom(0)
}
export function nextApiKey(): string {
  return keyFrom(++keySeq)
}
