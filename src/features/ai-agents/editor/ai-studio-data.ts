// Canned AI Studio content for the policy-rewrite flow (transcribed from the
// Figma frames). Frontend-only mock — there is no model call. The greeting is a
// fixed string because Date.now()/new Date() are unavailable in this runtime and
// the design frame is a fixed "Good evening".

export const AI_STUDIO_GREETING = 'Good evening, Sunny! 👋'

// The two suggestion bubbles shown in the initial panel state.
export const AI_STUDIO_SUGGESTIONS = [
  'Refine this intent',
  'Improve this policy to improve deflection',
]

// The prompt pre-filled by the primary suggestion bubble / used as the seeded
// composer value in the initial state.
export const AI_STUDIO_REWRITE_PROMPT = 'Help me rewrite this policy to improve deflection'

// The assistant's analysis reply after the user asks to rewrite the policy.
export const AI_STUDIO_ANALYSIS = {
  thinkingLabel: 'Thinking complete',
  paragraphs: [
    'Deflection issue: this flow needs a rewrite to close gaps causing drop-off.',
    'Customers are likely abandoning or escalating mid-flow due to unhandled errors, missing confirmations, and unclear next steps — fixing these gaps should reduce drop-off and improve deflection.',
  ],
  dropOffTitle: 'Current drop off rate:',
  dropOff: [
    { channel: 'Widget', rate: '43%' },
    { channel: 'Voice', rate: '37%' },
  ],
  closing: 'Here is the Improved policy plan to fix the dropoff issue.',
}

// The improvement-plan card summary shown in the chat, and the "Review plan"
// full-view content.
export const AI_STUDIO_PLAN = {
  emoji: '💖',
  title: 'Improvement plan',
  channel: 'Widget',
  agentName: 'Service Cancellation',
  reviewLabel: 'Review plan',
  // Left-pane intro reasoning shown in the full view.
  intro:
    "This is more than a tweak — it's a wholesale redesign (handoff-only → multi-path resolution with three new tools and a CV). The right shape is the create-autoflow build pattern applied to the existing intent: rewrite the policy, attach new tools, add the loss-amount CV.",
  summary: {
    title: 'Summary',
    bullets: [
      'Fixes early PII collection, ignored blacklist logic, and unhandled branches',
      'Triages first, only collects email when needed',
      'Silent handoff for blacklisted users; KB answers for setup and claims',
    ],
    note: 'Approving plan will create a new agent in draft mode',
  },
  // Numbered plan sections on the right pane.
  sections: [
    {
      number: '01',
      title: 'Update Policy Description',
      body: 'Replace the current policy with a tightened version that fixes the structural problems (PII collected before intent, branches with no instructions, blacklist field fetched but ignored, redundant name field). The new policy triages first, only collects email when account-specific data is actually needed, blocks blacklisted users via silent handoff, and answers Setup / Claim questions from the knowledge base instead of leaving the LLM to improvise.',
      newPolicy: {
        heading: 'New policy:',
        blocks: [
          {
            label: 'Call to Action',
            text: 'Help the customer with their cashback question. There are three categories: missing cashback (account-specific, requires lookup), cashback setup (general how-to), and cashback claims (general how-to). Triage first, then act.',
          },
          {
            label: 'Context',
            text: 'CashWise customers earn cashback on qualifying purchases. The Get_Account_Cash_back_Info action looks up a customer by email and returns their cashback records plus a blacklisted flag. Blacklisted accounts must never receive cashback assistance through the bot.',
          },
        ],
      },
    },
  ],
}
