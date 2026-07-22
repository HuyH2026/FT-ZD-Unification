// Mock data for the CX Journey → Automation → Agent gaps view. All values are
// illustrative (no backend); numbers/text match the Figma design where legible.
import { BookOpen, PiggyBank, Sparkles, type LucideIcon } from 'lucide-react'

export type AutomationSubTab = 'Agent gaps' | 'Knowledge gaps' | 'Realized impact'

export const AUTOMATION_SUBTABS: { label: AutomationSubTab; icon: LucideIcon }[] = [
  { label: 'Agent gaps', icon: Sparkles },
  { label: 'Knowledge gaps', icon: BookOpen },
  { label: 'Realized impact', icon: PiggyBank },
]

export type AutomationStat = { value: string; label: string }

export const AUTOMATION_INTRO = 'By automating these topics with agents, you could annually achieve:'

export const AUTOMATION_STATS: AutomationStat[] = [
  { value: '6,908', label: 'Potential ticket coverage' },
  { value: '228,821 hrs', label: 'Potential full resolution time decrease' },
  { value: '$229,860', label: 'Potential savings' },
]

export type AutomationRow = {
  topic: string
  policy: string
  coverage: string
  savings: string
  created: string
}

export const AUTOMATION_ROWS: AutomationRow[] = [
  {
    topic: 'Reactivate account',
    policy:
      "Experiencing a delay in receiving your withdrawal from Upwork can be frustrating, especially when you're counting on those funds to arrive on time.",
    coverage: '5,588',
    savings: '2,500',
    created: 'Jan 4, 2024 9:25 AM',
  },
  {
    topic: 'Account Lock Issues',
    policy:
      'General Inquiry about Refund request: - Response: "Notion\'s Plus Plan is free for higher education students and teachers using an eligible academic email address.',
    coverage: '2,960',
    savings: '2,500',
    created: 'Jan 4, 2024 9:25 AM',
  },
  {
    topic: 'Account Linking and Updating',
    policy:
      "When you're navigating the waters of freelance work on platforms like Upwork, understanding how to manage your funds, especially when it comes to withdrawals, is essential.",
    coverage: '31,916',
    savings: '2,500',
    created: 'Jan 4, 2024 9:25 AM',
  },
]
