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

export type TrainingPhraseRow = { topic: string; coverage: string; savings: string }

export type GeneratedTool = {
  name: string
  kind: string
  description: string
  input: string
  output: string
}

export type GeneratedPolicy = { title: string; body: string }

export type TicketSource = {
  id: string
  status: string
  channel: string
  dateCreated: string
  metrics: { label: string; value: string }[]
  subject: string
  customerRequest: { body: string; timestamp: string }
  agentResponse: { body: string; timestamp: string }
}

export type GeneratedAgentDetail = {
  summary: string
  autoflowSummary: string
  stats: { value: string; label: string }[]
  trainingPhraseRows: TrainingPhraseRow[]
  keyPhrases: string[]
  tools: GeneratedTool[]
  policy: GeneratedPolicy
  tickets: TicketSource[]
}

const SUMMARY_INTRO =
  "Based on your chats, we have identified gaps in your agents. We recommend creating this agent using the new policy generated from the agents' responses. By implementing this agent, you could achieve annual savings:"

const reactivateTicket: TicketSource = {
  id: '1274',
  status: 'Closed',
  channel: 'Email',
  dateCreated: 'Jul 17, 2026, 6:47pm',
  metrics: [
    { label: 'First contact resolution', value: 'Yes' },
    { label: 'First resolution time', value: '0.2 hrs' },
    { label: 'Full resolution time', value: '0.2 hrs' },
    { label: 'Sentiment', value: '🙂' },
    { label: 'Average reply time', value: '0.2 hrs' },
    { label: 'Agent replies', value: '1' },
  ],
  subject: 'Refund request',
  customerRequest: {
    body: 'Why was I charged [MONEY_1] for a FREE 2 week trial?!?!?\nI demand my money back immediately!\n\n[NAME_1].',
    timestamp: 'Jul 17, 2023, 6:47pm',
  },
  agentResponse: {
    body: 'Hello again, Sunny!\n\nYour refund for the custom workout plan is being processed.\n\nCheers!\n\nRichard\nAddon Services Support',
    timestamp: 'Jul 17, 2023, 6:47pm',
  },
}

export const AUTOMATION_DETAILS: Record<string, GeneratedAgentDetail> = {
  'Reactivate account': {
    summary: SUMMARY_INTRO,
    autoflowSummary:
      'Acknowledge the reactivation request, verify account info and deactivation reason, follow steps based on cause (inactivity, security, or violation), reactivate if eligible, confirm access, advise on security, and offer further help.',
    stats: [
      { value: '3,144', label: 'Reduction of Widget non-deflections / yr.' },
      { value: '5,588', label: 'Ticket coverage / yr.' },
      { value: '$83,820', label: 'Potential savings / yr.' },
    ],
    trainingPhraseRows: [
      { topic: 'Refund not received', coverage: '4538 tix', savings: '$24,780' },
      { topic: 'Dispute on refund', coverage: '2345 tix', savings: '$10,370' },
      { topic: 'Wants refund on one year of subscription fees', coverage: '2100 tix', savings: '$8,230' },
    ],
    keyPhrases: [
      'I want my money back',
      'can I still return after 30 days',
      'when I will get my refund back',
      'how long does it take to refund',
    ],
    tools: [
      {
        name: 'check_account_status',
        kind: 'API',
        description:
          "Look up the customer's account and return its current status along with the reason it was deactivated (e.g. inactivity, security, terms-of-service violation). Used to decide whether the account can be reactivated and what follow-up steps are required.",
        input: 'Email, username',
        output: 'Address, City, ZipCode, State, Country',
      },
      {
        name: 'update_activation_status',
        kind: 'API',
        description:
          "Reactivate the customer's account once eligibility has been confirmed via check_account_status. Returns whether the reactivation succeeded so the agent can confirm with the customer and advise them to log in and update security settings.",
        input: 'Account id, activation status',
        output: 'success, updated status',
      },
    ],
    policy: {
      title: 'Refund request',
      body:
        'General Inquiry about Refund request:\n"Notion\'s Plus Plan is free for higher education students and teachers using their school email addresses. Want more details? Check out Notion for Education. Any other questions on this?"\n\nIssues using gift cards for refunds:\n  1. "Confirm your Notion account\'s email is your school email."\n  2. "Ensure your workspace is single-member."\n  3. "On a paid plan? First, downgrade here."\n  4. "Then, go to Settings & Members → Plans and click Get free education plan."\n  5. "Follow these steps and let me know if you need more help!"\n\nCollect feedback, after providing an answer:\n"Did that help solve your issue? Please give us feedback! Or is there something else you need assistance with?"\n\nIf further Assistance is needed:\n"Handoff" for unresolved issues or if the user requests to connect with the support team.',
    },
    tickets: [reactivateTicket],
  },
  'Account Lock Issues': {
    summary: SUMMARY_INTRO,
    autoflowSummary:
      'Confirm the lockout, verify identity, identify the lock cause (failed logins, suspicious activity, or policy hold), guide the customer through unlock or reset, confirm restored access, and recommend enabling two-factor authentication.',
    stats: [
      { value: '1,820', label: 'Reduction of Widget non-deflections / yr.' },
      { value: '2,960', label: 'Ticket coverage / yr.' },
      { value: '$44,400', label: 'Potential savings / yr.' },
    ],
    trainingPhraseRows: [
      { topic: 'Locked out of account', coverage: '1820 tix', savings: '$12,300' },
      { topic: 'Too many failed logins', coverage: '760 tix', savings: '$5,100' },
      { topic: 'Suspicious activity hold', coverage: '380 tix', savings: '$2,400' },
    ],
    keyPhrases: [
      "I can't log in",
      'my account is locked',
      'why was my account suspended',
      'how do I unlock my account',
    ],
    tools: [
      {
        name: 'check_lock_reason',
        kind: 'API',
        description:
          'Return why an account is locked (failed logins, suspicious activity, or a policy hold) so the agent can choose the correct unlock path and explain it to the customer.',
        input: 'Email, username',
        output: 'lock reason, locked since',
      },
      {
        name: 'unlock_account',
        kind: 'API',
        description:
          'Unlock the account after identity has been verified. Returns whether the unlock succeeded so the agent can confirm access and prompt the customer to reset credentials.',
        input: 'Account id',
        output: 'success, unlocked at',
      },
    ],
    policy: {
      title: 'Account lock',
      body:
        'General Inquiry about a locked account:\n"For your security we lock accounts after unusual activity. I can help you regain access right now."\n\nSteps to unlock:\n  1. "Confirm the email address on the account."\n  2. "Verify the one-time code we just sent."\n  3. "Once verified, I\'ll unlock the account."\n  4. "Please reset your password and enable two-factor authentication."\n\nIf further Assistance is needed:\n"Handoff" for unresolved issues or if the user requests to connect with the support team.',
    },
    tickets: [
      {
        id: '1288',
        status: 'Closed',
        channel: 'Email',
        dateCreated: 'Jul 15, 2026, 2:10pm',
        metrics: [
          { label: 'First contact resolution', value: 'Yes' },
          { label: 'First resolution time', value: '0.4 hrs' },
          { label: 'Full resolution time', value: '0.6 hrs' },
          { label: 'Sentiment', value: '😐' },
          { label: 'Average reply time', value: '0.3 hrs' },
          { label: 'Agent replies', value: '2' },
        ],
        subject: 'Locked out of account',
        customerRequest: {
          body: "I've been locked out after a few wrong passwords and I need to get back in today.",
          timestamp: 'Jul 15, 2026, 2:10pm',
        },
        agentResponse: {
          body: "Hi [NAME_1], I've verified your identity and unlocked the account. Please reset your password and turn on two-factor authentication.\n\nBest,\nSupport",
          timestamp: 'Jul 15, 2026, 2:22pm',
        },
      },
      {
        id: '1291',
        status: 'Closed',
        channel: 'Email',
        dateCreated: 'Jul 14, 2026, 9:35am',
        metrics: [
          { label: 'First contact resolution', value: 'Yes' },
          { label: 'First resolution time', value: '0.3 hrs' },
          { label: 'Full resolution time', value: '0.5 hrs' },
          { label: 'Sentiment', value: '🙂' },
          { label: 'Average reply time', value: '0.25 hrs' },
          { label: 'Agent replies', value: '2' },
        ],
        subject: 'Suspicious login lockout',
        customerRequest: {
          body: "My account was locked due to 'suspicious activity' but it was just me traveling. How do I get back in?",
          timestamp: 'Jul 14, 2026, 9:35am',
        },
        agentResponse: {
          body: "Hi [NAME_1], I've confirmed your identity and the travel location. Your account is now unlocked. Please update your password and consider enabling two-factor authentication for added security when traveling.\n\nRegards,\nSupport",
          timestamp: 'Jul 14, 2026, 9:50am',
        },
      },
    ],
  },
  'Account Linking and Updating': {
    summary: SUMMARY_INTRO,
    autoflowSummary:
      'Understand which accounts the customer wants to link or update, verify ownership of each, perform the link or profile update, confirm the change, and surface any conflicts that need manual review.',
    stats: [
      { value: '9,540', label: 'Reduction of Widget non-deflections / yr.' },
      { value: '31,916', label: 'Ticket coverage / yr.' },
      { value: '$95,748', label: 'Potential savings / yr.' },
    ],
    trainingPhraseRows: [
      { topic: 'Link a second account', coverage: '9540 tix', savings: '$52,400' },
      { topic: 'Update billing email', coverage: '6120 tix', savings: '$28,900' },
      { topic: 'Merge duplicate accounts', coverage: '3110 tix', savings: '$14,400' },
    ],
    keyPhrases: [
      'how do I link my accounts',
      'change my email on file',
      'I have two accounts',
      'update my profile details',
    ],
    tools: [
      {
        name: 'lookup_linked_accounts',
        kind: 'API',
        description:
          'Return the accounts currently linked to a customer and any pending link requests, so the agent can decide whether a new link or a merge is required.',
        input: 'Email, username',
        output: 'linked accounts, pending requests',
      },
      {
        name: 'link_or_update_account',
        kind: 'API',
        description:
          'Link a second account or update profile fields after ownership is verified. Returns the applied change so the agent can confirm it with the customer.',
        input: 'Account id, target id, fields',
        output: 'success, applied change',
      },
    ],
    policy: {
      title: 'Account linking and updating',
      body:
        'General Inquiry about linking or updating an account:\n"I can help you link accounts or update your details. First, let\'s make sure everything is verified."\n\nSteps:\n  1. "Confirm the primary account email."\n  2. "Confirm the account you want to link or the field you want to update."\n  3. "Verify ownership of both accounts."\n  4. "Apply the link or update and confirm the result."\n\nIf further Assistance is needed:\n"Handoff" for unresolved conflicts or if the user requests to connect with the support team.',
    },
    tickets: [
      {
        id: '1301',
        status: 'Closed',
        channel: 'Email',
        dateCreated: 'Jul 12, 2026, 11:03am',
        metrics: [
          { label: 'First contact resolution', value: 'No' },
          { label: 'First resolution time', value: '1.1 hrs' },
          { label: 'Full resolution time', value: '3.4 hrs' },
          { label: 'Sentiment', value: '🙂' },
          { label: 'Average reply time', value: '0.7 hrs' },
          { label: 'Agent replies', value: '3' },
        ],
        subject: 'Link a second account',
        customerRequest: {
          body: 'I have a personal and a work account and I want them linked so I can switch between them.',
          timestamp: 'Jul 12, 2026, 11:03am',
        },
        agentResponse: {
          body: "Hi [NAME_1], I've verified both accounts and linked them. You can now switch from your profile menu.\n\nThanks,\nSupport",
          timestamp: 'Jul 12, 2026, 2:29pm',
        },
      },
    ],
  },
}
