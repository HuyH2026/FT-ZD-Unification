# Agent-gaps detail panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking an Agent-gaps table row opens a right-side "Generated Agent" slide-over with Create Agent / Generate Policy / Ticket Sources tabs, driven by per-topic mock data.

**Architecture:** A `GeneratedAgentPanel` slide-over (scrim + right dialog, ~628px) owns tab + selection state and renders one of three tab components. Per-topic content lives in an `AUTOMATION_DETAILS` map in `automation-data.ts`. `AutomationView`'s existing `PolicyTable` rows become clickable and open the panel for the clicked topic. Frontend-only; primary buttons and the assign dropdown are presentational no-ops.

**Tech Stack:** React 19, TypeScript (strict), Vite, Tailwind v4, lucide-react, react-router v7, Vitest + React Testing Library (jsdom).

## Global Constraints

- Path alias `@` → `src/`. Do NOT add `baseUrl` to tsconfig.
- TypeScript strict mode; keep all new code fully typed.
- Do NOT reintroduce `font-['SF_Pro_*']` arbitrary font-family classes — the system SF stack is the default `--font-sans`.
- Prefer semantic token classes (`text-ink`, `text-ink-muted`, `border-surface-border`, `bg-app-backdrop`) where they map; inline genuinely one-off design values (slate `#385075`, blue `#3489db`, the Insights gradient, chip fills `#eaf4fe`/`#fceae7`/`#e6f4f2`) as the existing `StatsBanner` does.
- Icons: `lucide-react` only; no committed Figma raster assets.
- No backend — primary action buttons and the assign dropdown are presentational.
- Verification gates: `npx tsc --noEmit`, `npx vitest run`, `npx vite build`. Lint is a known-broken upstream gate (TS7); do not run it.
- Test conventions: `import { render, screen, within } from '@testing-library/react'`, `import userEvent from '@testing-library/user-event'`, `import { describe, expect, it, vi } from 'vitest'`. Scope screen assertions with `within(getByTestId(...))`.
- Run all commands from the worktree root `/Users/huy.hua/Documents/Unification/.claude/worktrees/cx-journey-automation`.

## File Structure

- `src/features/insights/cx-journey/automation-data.ts` (modify) — add detail types + `AUTOMATION_DETAILS` map.
- `src/features/insights/cx-journey/automation-data.test.ts` (modify) — assert details exist and are well-formed.
- `src/features/insights/cx-journey/CreateAgentTab.tsx` (create) — Create Agent tab body.
- `src/features/insights/cx-journey/GeneratePolicyTab.tsx` (create) — Generate Policy tab body.
- `src/features/insights/cx-journey/TicketSourcesTab.tsx` (create) — Ticket Sources tab body.
- `src/features/insights/cx-journey/GeneratedAgentPanel.tsx` (create) — slide-over container: header, tab bar, body switch, footer, open/close.
- `src/features/insights/cx-journey/GeneratedAgentPanel.test.tsx` (create) — panel behavior tests.
- `src/features/insights/cx-journey/AutomationView.tsx` (modify) — make rows clickable, mount the panel.
- `src/features/insights/cx-journey/AutomationView.test.tsx` (modify) — row-click-opens-panel test.

---

### Task 1: Per-topic detail data model

**Files:**
- Modify: `src/features/insights/cx-journey/automation-data.ts`
- Test: `src/features/insights/cx-journey/automation-data.test.ts`

**Interfaces:**
- Consumes: existing `AUTOMATION_ROWS` (each has a `topic: string`).
- Produces:
  - `type TrainingPhraseRow = { topic: string; coverage: string; savings: string }`
  - `type GeneratedTool = { name: string; kind: string; description: string; input: string; output: string }`
  - `type GeneratedPolicy = { title: string; body: string }`
  - `type TicketSource = { id: string; status: string; channel: string; dateCreated: string; metrics: { label: string; value: string }[]; subject: string; customerRequest: { body: string; timestamp: string }; agentResponse: { body: string; timestamp: string } }`
  - `type GeneratedAgentDetail = { channel: string; summary: string; autoflowSummary: string; stats: { value: string; label: string }[]; trainingPhraseRows: TrainingPhraseRow[]; keyPhrases: string[]; tools: GeneratedTool[]; policy: GeneratedPolicy; tickets: TicketSource[] }`
  - `const AUTOMATION_DETAILS: Record<string, GeneratedAgentDetail>` keyed by `row.topic`, with an entry for every topic in `AUTOMATION_ROWS`.

- [ ] **Step 1: Write the failing test**

Add to `automation-data.test.ts`:

```ts
import { AUTOMATION_DETAILS, AUTOMATION_ROWS } from './automation-data'

describe('AUTOMATION_DETAILS', () => {
  it('has a well-formed detail for every automation row', () => {
    for (const row of AUTOMATION_ROWS) {
      const detail = AUTOMATION_DETAILS[row.topic]
      expect(detail, `missing detail for ${row.topic}`).toBeDefined()
      expect(detail.stats).toHaveLength(3)
      expect(detail.tools.length).toBeGreaterThanOrEqual(1)
      expect(detail.tickets.length).toBeGreaterThanOrEqual(1)
      expect(detail.keyPhrases.length).toBeGreaterThanOrEqual(1)
      expect(detail.trainingPhraseRows.length).toBeGreaterThanOrEqual(1)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/insights/cx-journey/automation-data.test.ts`
Expected: FAIL — `AUTOMATION_DETAILS` is not exported.

- [ ] **Step 3: Add types and data**

Append to `automation-data.ts` (after the existing exports). Use the exact Figma content for "Reactivate account"; author plausible variants for the other two topics.

```ts
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
  channel: string
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
    channel: 'Email',
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
    channel: 'Email',
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
    ],
  },
  'Account Linking and Updating': {
    channel: 'Email',
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/insights/cx-journey/automation-data.test.ts`
Expected: PASS (all tests in file).

- [ ] **Step 5: Commit**

```bash
git add src/features/insights/cx-journey/automation-data.ts src/features/insights/cx-journey/automation-data.test.ts
git commit -m "feat(cx-journey): add per-topic Generated Agent detail data"
```

---

### Task 2: CreateAgentTab component

**Files:**
- Create: `src/features/insights/cx-journey/CreateAgentTab.tsx`
- Test: covered by `GeneratedAgentPanel.test.tsx` in Task 5 (this task has a small standalone render test).

**Interfaces:**
- Consumes: `GeneratedAgentDetail` from `automation-data.ts`.
- Produces: `function CreateAgentTab({ detail, selectedRows, onToggleRow }: { detail: GeneratedAgentDetail; selectedRows: Set<number>; onToggleRow: (i: number) => void }): JSX.Element`. Selection state is owned by the parent so the footer's Create button can read it.

- [ ] **Step 1: Write the failing test**

Create `CreateAgentTab.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CreateAgentTab } from './CreateAgentTab'
import { AUTOMATION_DETAILS } from './automation-data'

describe('CreateAgentTab', () => {
  it('renders summary stats, training-phrase rows, and key phrases', () => {
    render(
      <CreateAgentTab
        detail={AUTOMATION_DETAILS['Reactivate account']}
        selectedRows={new Set()}
        onToggleRow={() => {}}
      />,
    )
    expect(screen.getByText('3,144')).toBeInTheDocument()
    expect(screen.getByText('Refund not received')).toBeInTheDocument()
    expect(screen.getByText('“I want my money back”')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/insights/cx-journey/CreateAgentTab.test.tsx`
Expected: FAIL — cannot find module `./CreateAgentTab`.

- [ ] **Step 3: Write the component**

Create `CreateAgentTab.tsx`:

```tsx
// Create Agent tab body for the Generated Agent panel. Summary gradient card
// (intro + Autoflow summary + 3 stats), a checkbox training-phrase table whose
// selection is owned by the parent, and an italic key-phrases box.
import type { GeneratedAgentDetail } from './automation-data'

export function CreateAgentTab({
  detail,
  selectedRows,
  onToggleRow,
}: {
  detail: GeneratedAgentDetail
  selectedRows: Set<number>
  onToggleRow: (index: number) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <section className="flex flex-col gap-4">
        <p className="text-[12px] font-semibold text-black">Summary</p>
        <div
          className="flex flex-col gap-2.5 rounded-[20px] border border-[#f2f4f7] p-4"
          style={{
            backgroundImage:
              'linear-gradient(145.9deg, rgba(255,179,147,0.15) 0%, rgba(171,213,250,0.15) 50%, rgba(18,166,180,0.15) 100%)',
          }}
        >
          <p className="text-[14px] leading-5 text-[#385075]">{detail.summary}</p>
          <div className="flex flex-col gap-1 text-[#385075]">
            <p className="text-[12px] font-semibold">Autoflow Summary</p>
            <p className="text-[14px] leading-5">{detail.autoflowSummary}</p>
          </div>
          <div className="flex flex-col gap-4">
            {detail.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <p className="text-[22px] font-semibold leading-7 text-[#385075]">{stat.value}</p>
                <p className="text-[12px] font-semibold text-[#385075]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training phrases table */}
      <section className="flex flex-col gap-4">
        <p className="text-[12px] font-semibold text-black">
          Add more training phrases from the Topics below
        </p>
        <div className="overflow-hidden rounded-[20px] border border-[#e4e7f0]">
          <div className="flex items-center border-b border-[#e4e7f0] bg-[#fbfbfb] px-3 py-2 text-[14px] font-semibold text-[#545767]">
            <span className="w-8" />
            <span className="flex-1">Similar topic</span>
            <span className="w-[120px]">Coverage</span>
            <span className="w-[128px]">Savings</span>
          </div>
          {detail.trainingPhraseRows.map((row, i) => (
            <label
              key={row.topic}
              className="flex cursor-pointer items-center border-b border-[#e4e7f0] bg-[#fbfbfb] px-3 py-2 text-[14px] text-black last:border-b-0"
            >
              <span className="w-8">
                <input
                  type="checkbox"
                  aria-label={row.topic}
                  checked={selectedRows.has(i)}
                  onChange={() => onToggleRow(i)}
                  className="size-4"
                />
              </span>
              <span className="flex-1">{row.topic}</span>
              <span className="w-[120px]">{row.coverage}</span>
              <span className="w-[128px]">{row.savings}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Key phrases */}
      <section className="flex flex-col gap-4">
        <p className="text-[12px] font-semibold text-black">
          The workflow will include the following key phrases:
        </p>
        <div className="flex flex-col gap-2 rounded-[20px] bg-[#f9f8f7] p-4">
          {detail.keyPhrases.map((phrase) => (
            <p key={phrase} className="text-[14px] italic text-[#3489db]">
              “{phrase}”
            </p>
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/insights/cx-journey/CreateAgentTab.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/insights/cx-journey/CreateAgentTab.tsx src/features/insights/cx-journey/CreateAgentTab.test.tsx
git commit -m "feat(cx-journey): add CreateAgentTab body"
```

---

### Task 3: GeneratePolicyTab component

**Files:**
- Create: `src/features/insights/cx-journey/GeneratePolicyTab.tsx`
- Test: `src/features/insights/cx-journey/GeneratePolicyTab.test.tsx`

**Interfaces:**
- Consumes: `GeneratedAgentDetail`.
- Produces: `function GeneratePolicyTab({ detail }: { detail: GeneratedAgentDetail }): JSX.Element`. Owns its own local `actionsOpen` collapse state.

- [ ] **Step 1: Write the failing test**

Create `GeneratePolicyTab.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GeneratePolicyTab } from './GeneratePolicyTab'
import { AUTOMATION_DETAILS } from './automation-data'

describe('GeneratePolicyTab', () => {
  it('renders tools and the generated policy title', () => {
    render(<GeneratePolicyTab detail={AUTOMATION_DETAILS['Reactivate account']} />)
    expect(screen.getByText('check_account_status')).toBeInTheDocument()
    expect(screen.getByText('Generated Autoflow policy')).toBeInTheDocument()
  })

  it('collapses the actions section when the toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<GeneratePolicyTab detail={AUTOMATION_DETAILS['Reactivate account']} />)
    expect(screen.getByText('check_account_status')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /toggle generated actions/i }))
    expect(screen.queryByText('check_account_status')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/insights/cx-journey/GeneratePolicyTab.test.tsx`
Expected: FAIL — cannot find module `./GeneratePolicyTab`.

- [ ] **Step 3: Write the component**

Create `GeneratePolicyTab.tsx`:

```tsx
// Generate Policy tab body: a collapsible "Generated Actions (in Tools)" list
// of API tool cards, and a "Generated Autoflow policy" text card. Collapse
// state is local; nothing here talks to a backend.
import { useState } from 'react'
import { ChevronUp, Zap } from 'lucide-react'
import type { GeneratedAgentDetail } from './automation-data'

export function GeneratePolicyTab({ detail }: { detail: GeneratedAgentDetail }) {
  const [actionsOpen, setActionsOpen] = useState(true)
  return (
    <div className="flex flex-col gap-6">
      {/* Generated actions */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-black">Generated Actions (in Tools):</p>
          <button
            type="button"
            aria-label="Toggle generated actions"
            aria-expanded={actionsOpen}
            onClick={() => setActionsOpen((v) => !v)}
            className="rounded p-1 text-ink-muted"
          >
            <ChevronUp
              size={16}
              className={actionsOpen ? '' : 'rotate-180'}
              aria-hidden
            />
          </button>
        </div>
        {actionsOpen && (
          <div className="flex flex-col gap-3">
            {detail.tools.map((tool) => (
              <div
                key={tool.name}
                className="rounded-[20px] border border-[#e4e7f0] bg-white/80 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-2xl bg-[#1472ff]">
                    <Zap size={16} className="text-white" aria-hidden />
                  </span>
                  <p className="flex-1 text-[14px] font-medium text-black">{tool.name}</p>
                  <span className="rounded bg-[#f2f4f7] px-1 py-0.5 text-[12px] text-black">
                    {tool.kind}
                  </span>
                </div>
                <div className="flex flex-col gap-1 pl-10 pt-2">
                  <p className="text-[12px] leading-[18px] text-[#545767]">{tool.description}</p>
                  <p className="text-[12px] text-ink-muted">Input:</p>
                  <p className="font-mono text-[12px] text-black">{tool.input}</p>
                  <p className="text-[12px] text-ink-muted">Output:</p>
                  <p className="font-mono text-[12px] text-black">{tool.output}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Generated policy */}
      <section className="flex flex-col gap-4">
        <p className="text-[12px] font-semibold text-black">Generated Autoflow policy</p>
        <div className="flex flex-col gap-4 rounded-[20px] bg-[#f9f8f7] p-4">
          <p className="text-[22px] leading-7 text-black">{detail.policy.title}</p>
          <p className="whitespace-pre-wrap text-[14px] leading-[22px] text-black">
            {detail.policy.body}
          </p>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/insights/cx-journey/GeneratePolicyTab.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/insights/cx-journey/GeneratePolicyTab.tsx src/features/insights/cx-journey/GeneratePolicyTab.test.tsx
git commit -m "feat(cx-journey): add GeneratePolicyTab body"
```

---

### Task 4: TicketSourcesTab component

**Files:**
- Create: `src/features/insights/cx-journey/TicketSourcesTab.tsx`
- Test: `src/features/insights/cx-journey/TicketSourcesTab.test.tsx`

**Interfaces:**
- Consumes: `GeneratedAgentDetail` (uses `detail.tickets`), and `channelMeta` from `@/lib/channel-meta`.
- Produces: `function TicketSourcesTab({ detail }: { detail: GeneratedAgentDetail }): JSX.Element`. Owns local `index` pager state over `detail.tickets`, wrapping at the ends.

- [ ] **Step 1: Write the failing test**

Create `TicketSourcesTab.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TicketSourcesTab } from './TicketSourcesTab'
import { AUTOMATION_DETAILS } from './automation-data'

describe('TicketSourcesTab', () => {
  it('renders the first ticket id, metrics, and both message blocks', () => {
    render(<TicketSourcesTab detail={AUTOMATION_DETAILS['Reactivate account']} />)
    expect(screen.getByText(/Ticket ID: 1274/)).toBeInTheDocument()
    expect(screen.getByText('Customer request')).toBeInTheDocument()
    expect(screen.getByText('Agent response')).toBeInTheDocument()
  })

  it('advances to the next ticket via the pager (wrapping)', async () => {
    const user = userEvent.setup()
    render(<TicketSourcesTab detail={AUTOMATION_DETAILS['Account Linking and Updating']} />)
    // single-ticket topic wraps back to the same ticket; pager label stays "1 of 1"
    expect(screen.getByText('1 of 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next ticket/i }))
    expect(screen.getByText('1 of 1')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/insights/cx-journey/TicketSourcesTab.test.tsx`
Expected: FAIL — cannot find module `./TicketSourcesTab`.

- [ ] **Step 3: Write the component**

Create `TicketSourcesTab.tsx`:

```tsx
// Ticket Sources tab body: a ticket header (id link, channel chip, status,
// prev/next pager over detail.tickets), a 6-cell metrics grid, and the ticket
// detail thread (customer request + agent response). Pager wraps; presentational.
import { useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { channelMeta } from '@/lib/channel-meta'
import type { GeneratedAgentDetail } from './automation-data'

export function TicketSourcesTab({ detail }: { detail: GeneratedAgentDetail }) {
  const total = detail.tickets.length
  const [index, setIndex] = useState(0)
  const ticket = detail.tickets[index]
  const { display, color, Icon } = channelMeta(ticket.channel)
  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  return (
    <div className="flex flex-col gap-6">
      {/* Ticket header row: id + status + pager */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[16px] text-black underline">Ticket ID: {ticket.id}</span>
          <ExternalLink size={16} className="text-black" aria-hidden />
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#fceae7] px-2 py-0.5 text-[12px] font-semibold text-[#e53112]">
            {ticket.status}
          </span>
          <div className="flex items-center gap-1 text-[12px] text-ink-muted">
            <button type="button" aria-label="Previous ticket" onClick={prev} className="p-1.5">
              <ChevronLeft size={16} aria-hidden />
            </button>
            <span>
              {index + 1} of {total}
            </span>
            <button type="button" aria-label="Next ticket" onClick={next} className="p-1.5">
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* Meta line */}
      <div className="flex flex-col gap-3">
        <p className="text-[12px] font-medium text-[#727583]">
          Date created: <span className="text-black">{ticket.dateCreated}</span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[#727583]">Channel:</span>
          <span
            className="flex items-center gap-1 rounded-full bg-[#eaf4fe] px-2 py-0.5 text-[12px] font-semibold"
            style={{ color }}
          >
            <Icon size={12} aria-hidden />
            {display}
          </span>
        </div>
      </div>

      {/* Metrics grid (6 cells) */}
      <div className="grid grid-cols-3 overflow-hidden rounded-[20px] border border-[#e4e7f0]">
        {ticket.metrics.map((m) => (
          <div key={m.label} className="border-b border-r border-[#e4e7f0] p-4">
            <p className="text-[12px] text-[#545767]">{m.label}</p>
            <p className="pt-2 text-[14px] text-black">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Ticket details */}
      <section className="flex flex-col gap-4">
        <p className="text-[12px] font-semibold text-black">Ticket details</p>
        <div className="flex flex-col gap-4 rounded-2xl bg-[#f9f8f7] p-4">
          <div className="flex items-center justify-between rounded-xl border border-[#e4e7f0] bg-white/70 px-4 py-2">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-black">
              <ArrowLeft size={16} aria-hidden />
              Customer request
            </span>
            <span className="text-[12px] text-[#727583]">{ticket.customerRequest.timestamp}</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-medium text-[#727583]">Subject:</p>
            <p className="text-[14px] text-black">{ticket.subject}</p>
          </div>
          <p className="whitespace-pre-wrap text-[14px] leading-5 text-black">
            {ticket.customerRequest.body}
          </p>
          <div className="flex items-center justify-between rounded-xl border border-[#e4e7f0] bg-white/70 px-4 py-2">
            <span className="flex items-center gap-2 text-[12px] font-semibold text-black">
              <ArrowRight size={16} aria-hidden />
              Agent response
            </span>
            <span className="text-[12px] text-[#727583]">{ticket.agentResponse.timestamp}</span>
          </div>
          <p className="whitespace-pre-wrap text-[14px] leading-5 text-black">
            {ticket.agentResponse.body}
          </p>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/insights/cx-journey/TicketSourcesTab.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/insights/cx-journey/TicketSourcesTab.tsx src/features/insights/cx-journey/TicketSourcesTab.test.tsx
git commit -m "feat(cx-journey): add TicketSourcesTab body"
```

---

### Task 5: GeneratedAgentPanel container

**Files:**
- Create: `src/features/insights/cx-journey/GeneratedAgentPanel.tsx`
- Test: `src/features/insights/cx-journey/GeneratedAgentPanel.test.tsx`

**Interfaces:**
- Consumes: `AUTOMATION_DETAILS`, `GeneratedAgentDetail` from `automation-data.ts`; `CreateAgentTab`, `GeneratePolicyTab`, `TicketSourcesTab`.
- Produces: `function GeneratedAgentPanel({ topic, onClose }: { topic: string; onClose: () => void }): JSX.Element`. Looks up `AUTOMATION_DETAILS[topic]`; owns `activeTab` ('Create Agent' | 'Generate Policy' | 'Ticket Sources') and `selectedRows: Set<number>`; closes on X, scrim click, Escape.

- [ ] **Step 1: Write the failing test**

Create `GeneratedAgentPanel.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GeneratedAgentPanel } from './GeneratedAgentPanel'

const renderPanel = (onClose = vi.fn()) => {
  render(<GeneratedAgentPanel topic="Reactivate account" onClose={onClose} />)
  return { onClose, dialog: within(screen.getByRole('dialog')) }
}

describe('GeneratedAgentPanel', () => {
  it('shows the topic chip and Create Agent tab by default', () => {
    const { dialog } = renderPanel()
    expect(dialog.getByText('Generated Agent')).toBeInTheDocument()
    expect(dialog.getAllByText('Reactivate account').length).toBeGreaterThanOrEqual(1)
    expect(dialog.getByText('3,144')).toBeInTheDocument()
  })

  it('switches to the Generate Policy tab', async () => {
    const user = userEvent.setup()
    const { dialog } = renderPanel()
    await user.click(dialog.getByRole('tab', { name: 'Generate Policy' }))
    expect(dialog.getByText('Generated Autoflow policy')).toBeInTheDocument()
  })

  it('switches to the Ticket Sources tab', async () => {
    const user = userEvent.setup()
    const { dialog } = renderPanel()
    await user.click(dialog.getByRole('tab', { name: 'Ticket Sources' }))
    expect(dialog.getByText(/Ticket ID:/)).toBeInTheDocument()
  })

  it('enables Create once a training-phrase row is checked', async () => {
    const user = userEvent.setup()
    const { dialog } = renderPanel()
    const create = dialog.getByRole('button', { name: 'Create' })
    expect(create).toBeDisabled()
    await user.click(dialog.getByLabelText('Refund not received'))
    expect(create).toBeEnabled()
  })

  it('closes on Escape, scrim click, and the X button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<GeneratedAgentPanel topic="Reactivate account" onClose={onClose} />)
    await user.keyboard('{Escape}')
    await user.click(screen.getByTestId('generated-agent-scrim'))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/insights/cx-journey/GeneratedAgentPanel.test.tsx`
Expected: FAIL — cannot find module `./GeneratedAgentPanel`.

- [ ] **Step 3: Write the component**

Create `GeneratedAgentPanel.tsx`:

```tsx
// Right slide-over for a clicked Agent-gaps row. Header (title + topic chip +
// regenerate), secondary tabs (Create Agent / Generate Policy / Ticket Sources),
// a scrollable body, and a sticky footer whose labels vary by tab. Selection of
// training-phrase rows (Create Agent) enables the footer Create button. Closes
// on X, scrim click, and Escape. Presentational — footer actions are no-ops.
import { useEffect, useState } from 'react'
import { RefreshCw, X, Zap, ChevronDown } from 'lucide-react'
import { AUTOMATION_DETAILS } from './automation-data'
import { CreateAgentTab } from './CreateAgentTab'
import { GeneratePolicyTab } from './GeneratePolicyTab'
import { TicketSourcesTab } from './TicketSourcesTab'

type PanelTab = 'Create Agent' | 'Generate Policy' | 'Ticket Sources'
const TABS: PanelTab[] = ['Create Agent', 'Generate Policy', 'Ticket Sources']

export function GeneratedAgentPanel({
  topic,
  onClose,
}: {
  topic: string
  onClose: () => void
}) {
  const detail = AUTOMATION_DETAILS[topic]
  const [tab, setTab] = useState<PanelTab>('Create Agent')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggleRow = (i: number) =>
    setSelectedRows((prev) => {
      const nextSet = new Set(prev)
      if (nextSet.has(i)) nextSet.delete(i)
      else nextSet.add(i)
      return nextSet
    })

  const isCreateAgent = tab === 'Create Agent'
  const assignLabel = isCreateAgent
    ? 'Assign this topic to an existing Agent'
    : 'Assign this topic to an existing Policy'
  const trailingLabel = isCreateAgent ? 'Create' : 'Create new Policy'
  const createDisabled = isCreateAgent && selectedRows.size === 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        data-testid="generated-agent-scrim"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label="Generated Agent"
        className="relative flex h-full w-[628px] flex-col bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-10 pt-6">
          <p className="text-[22px] text-black">Generated Agent</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 rounded-full bg-[#f5f5f7] px-2 py-1 text-[12px] font-semibold text-[#545767]">
              <Zap size={16} className="text-[#545767]" aria-hidden />
              {topic}
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full border border-surface-border text-ink"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" className="flex items-center border-b border-[#e4e7f0] px-9 pt-4">
          {TABS.map((t) => {
            const active = t === tab
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t)}
                className={
                  'px-4 pb-4 pt-4 text-[14px] ' +
                  (active
                    ? '-mb-px border-b border-[#01567a] text-[#193d50]'
                    : 'text-[#9194a0]')
                }
              >
                {t}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-10 py-6">
          {tab === 'Create Agent' && (
            <CreateAgentTab detail={detail} selectedRows={selectedRows} onToggleRow={toggleRow} />
          )}
          {tab === 'Generate Policy' && <GeneratePolicyTab detail={detail} />}
          {tab === 'Ticket Sources' && <TicketSourcesTab detail={detail} />}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 border-t border-[#e4e7f0] px-10 py-8">
          <button
            type="button"
            className="flex h-9 items-center justify-center gap-1.5 rounded-[20px] bg-black text-[14px] font-semibold text-white"
          >
            <RefreshCw size={16} aria-hidden />
            Create with AutoFlow (recommended)
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-[20px] border border-[#bcbdc5] bg-white py-2.5 pl-4 pr-2.5 text-[14px] text-[#9194a0]"
          >
            {assignLabel}
            <ChevronDown size={20} aria-hidden />
          </button>
          <button
            type="button"
            disabled={createDisabled}
            className="h-[37px] rounded-[20px] bg-[#f2f4f7] text-[14px] font-semibold text-[#a6a9b2] disabled:cursor-not-allowed enabled:bg-black enabled:text-white"
          >
            {trailingLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/insights/cx-journey/GeneratedAgentPanel.test.tsx`
Expected: PASS (all 5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/insights/cx-journey/GeneratedAgentPanel.tsx src/features/insights/cx-journey/GeneratedAgentPanel.test.tsx
git commit -m "feat(cx-journey): add GeneratedAgentPanel slide-over"
```

---

### Task 6: Wire row clicks in AutomationView

**Files:**
- Modify: `src/features/insights/cx-journey/AutomationView.tsx`
- Test: `src/features/insights/cx-journey/AutomationView.test.tsx`

**Interfaces:**
- Consumes: `GeneratedAgentPanel` from `./GeneratedAgentPanel`.
- Produces: no new exports. `AutomationView` gains local `openTopic: string | null` state; `PolicyTable` gains an `onRowClick: (topic: string) => void` prop; rows are clickable (`role="button"`, `tabIndex={0}`, Enter/Space).

- [ ] **Step 1: Write the failing test**

Add to `AutomationView.test.tsx`:

```tsx
it('opens the Generated Agent panel when a row is clicked', async () => {
  const user = userEvent.setup()
  render(<AutomationView />)
  const view = within(screen.getByTestId('view-automation'))
  await user.click(view.getByText('Reactivate account'))
  const dialog = within(screen.getByRole('dialog'))
  expect(dialog.getByText('Generated Agent')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/insights/cx-journey/AutomationView.test.tsx`
Expected: FAIL — no `dialog` role in the document.

- [ ] **Step 3: Modify AutomationView**

In `AutomationView.tsx`:

1. Add imports at the top:

```tsx
import { GeneratedAgentPanel } from './GeneratedAgentPanel'
```

(Keep the existing `useState` import.)

2. Change `PolicyTable` to accept and use an `onRowClick` prop. Replace the `PolicyTable` function signature and its `<tr>` with:

```tsx
function PolicyTable({ onRowClick }: { onRowClick: (topic: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-surface-border">
            {COLS.map((col) => (
              <th key={col} className="px-4 py-3 text-left text-[12px] font-medium text-ink-muted">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AUTOMATION_ROWS.map((row) => (
            <tr
              key={row.topic}
              role="button"
              tabIndex={0}
              onClick={() => onRowClick(row.topic)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onRowClick(row.topic)
                }
              }}
              className="cursor-pointer border-b border-surface-border align-top hover:bg-app-backdrop"
            >
              <td className="px-4 py-6">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-app-backdrop px-2 py-1 text-[13px] text-ink">
                  <Sparkles className="h-3.5 w-3.5 text-ink-muted" />
                  {row.topic}
                </span>
              </td>
              <td className="px-4 py-6 text-[13px] text-ink">
                <p className="line-clamp-3 max-w-[320px]">{row.policy}</p>
              </td>
              <td className="px-4 py-6 text-[13px] text-ink">{row.coverage}</td>
              <td className="px-4 py-6 text-[13px] text-ink">{row.savings}</td>
              <td className="px-4 py-6 text-[13px] text-ink">{row.created}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

3. In the `AutomationView` function, add open-topic state and mount the panel. Replace the existing `AutomationView` body with:

```tsx
export function AutomationView() {
  const [subTab, setSubTab] = useState<AutomationSubTab>('Agent gaps')
  const [openTopic, setOpenTopic] = useState<string | null>(null)
  return (
    <section data-testid="view-automation" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">Automation</h2>
        <SegmentedControl value={subTab} onChange={setSubTab} />
      </div>
      {subTab === 'Agent gaps' ? (
        <>
          <StatsBanner />
          <Toolbar />
          <PolicyTable onRowClick={setOpenTopic} />
        </>
      ) : (
        <div className="flex h-64 items-center justify-center text-[14px] text-ink-muted">
          Coming soon
        </div>
      )}
      {openTopic && (
        <GeneratedAgentPanel topic={openTopic} onClose={() => setOpenTopic(null)} />
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/insights/cx-journey/AutomationView.test.tsx`
Expected: PASS (existing tests + the new one).

- [ ] **Step 5: Commit**

```bash
git add src/features/insights/cx-journey/AutomationView.tsx src/features/insights/cx-journey/AutomationView.test.tsx
git commit -m "feat(cx-journey): open Generated Agent panel on Agent-gaps row click"
```

---

### Task 7: Full verification gates

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: all test files pass (baseline was 72 files / 357 tests; this adds files and tests — 0 failures).

- [ ] **Step 3: Build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Commit any incidental fixes**

If steps 1-3 surfaced fixes, commit them:

```bash
git add -A
git commit -m "fix(cx-journey): resolve typecheck/build issues in detail panel"
```

If nothing changed, skip this step.

---

## Self-Review notes

- **Spec coverage:** container (Task 5), three tabs (Tasks 2-4), per-topic data (Task 1), row-click open (Task 6), footer variants (Task 5 footer), close affordances (Task 5), pager/collapse/checkbox interactions (Tasks 3-5), tests (each task + Task 7). All spec sections map to a task.
- **Type consistency:** `GeneratedAgentDetail` and its member types are defined once in Task 1 and consumed unchanged by Tasks 2-5. `onToggleRow`/`selectedRows` names match between `CreateAgentTab` (Task 2) and `GeneratedAgentPanel` (Task 5). `onRowClick` matches between `PolicyTable` and `AutomationView` (Task 6).
- **No placeholders:** every code step shows complete code; every run step shows an exact command and expected result.
