# AI Personality panel (Configuration → Sentiment section)

**Date:** 2026-07-21
**Status:** Approved (design)
**Area:** `src/features/ai-agents/configuration/`
**Figma:** Config_02 — node `768:40758` (file `LMPNsX1T3nwkueIRUCDktm`)

## Summary

On the AI Agents → Configuration (Widget) screen, the right-column panel currently
always shows the "Branded widget" form. The far-right icon rail lets the user pick a
customization section, but only `brands` has real content — other sections just
highlight and keep the Brands form.

This work makes the **heart icon** (rail section `sentiment`) swap the right panel to a
new **"AI Personality"** form. AI Personality values are stored **per-brand**, so
switching VIP / Member / Partner shows that brand's own values. Scope is Sentiment
only — every other non-`brands` rail section keeps its current behavior (unchanged).

Frontend-only, no backend — consistent with the rest of the Configuration screen.

## The AI Personality form (from Figma)

Header: **"AI Personality"** (same position/style as "Branded widget").

Intro paragraph (grey-800, 14px):
> General AI Instructions define the AI's overall tone and behavior. Use them to set the
> voice, preferred terminology, formatting standards, and how the AI should respond to
> different user types.

Then three field groups, each separated by a hairline divider (`border-grey-200`-ish
`#e4e7f0`), matching the existing panel's divider treatment:

### 1. General Context
- Label **General Context** (14px semibold black) + trailing info icon.
- Helper (12px `#727583`): "What should the AI know about your company and customers?"
- Multiline textarea. Placeholder (grey `#9194a0`, multi-line):
  ```
  Example:
  We sell products to both buyers and sellers.
  Buyer Persona: Focused on product details, pricing, shipping, and support.
  Seller Persona: Focused on inventory, sales tools, and account features.
  ```
- Footnote (12px grey-500): "Keep it under 100 words".

### 2. Glossary
- Label **Glossary** + info icon.
- Helper: "What key terms from the glossary should the AI know?"
- Textarea. Placeholder:
  ```
  Example:
  "NPF" for product feature
  "PF" stand for Paid Feature
  "FT" stands for Fee Trial
  ```
- Footnote: "Keep it under 100 words".

### 3. Tone of Voice
- Label **Tone of Voice** + info icon.
- Helper: "What is your company's style, and how should the AI communicate?"
- **Two checkboxes** (Figma placeholders read "Label"; inferring meaningful labels):
  - `toneUseFreeform` — **"Describe tone in your own words"** — gates the textarea.
  - `toneUsePresets` — **"Choose from presets"** — gates the preset chips.
- Textarea. Placeholder:
  ```
  Example:
  Formal and professional tone.
  Casual and friendly tone.
  Technical and actionable tone when giving advice.
  Use a numerical format to break down complex information for clarity.
  ```
  Footnote: "Keep it under 100 words".
- **Preset chips** (pill buttons, toggle selected/unselected):
  `Empathetic, Friendly, Professional, Straightforward, Humorous, Formal`.
  Selected chips get a darker border (`#d2d3d8`); unselected use the lighter `#e4e7f0`
  — matching the Figma option-button styles.

The gating behavior for the two checkboxes: when unchecked, the corresponding control
(textarea / chips) is visually de-emphasized but still rendered. Keep it simple — a
`disabled`/dimmed treatment, not conditional removal, to avoid layout jump. (If a
cleaner approach emerges during implementation, dimming is the floor requirement.)

## Data model

Extend `Brand` in `config-data.ts` with a `personality` field:

```ts
export type Personality = {
  generalContext: string
  glossary: string
  toneFreeform: string
  toneUseFreeform: boolean
  toneUsePresets: boolean
  tonePresets: string[]   // subset of TONE_PRESET_OPTIONS
}

export type Brand = {
  // ...existing fields...
  personality: Personality
}
```

Seed each of the three `SEED_BRANDS` with an empty default personality
(`emptyPersonality()` helper or inline literal): empty strings, both checkboxes
`false`, no presets. Add module constants:

```ts
export const TONE_PRESET_OPTIONS = [
  'Empathetic', 'Friendly', 'Professional', 'Straightforward', 'Humorous', 'Formal',
] as const
```

Plus section copy (labels, helpers, placeholders, footnotes) as constants so the panel
stays presentational and the strings are testable.

## Components

### `SectionRail.tsx` (new — extracted)
The far-right 64px icon rail currently lives inline in `BrandedWidgetPanel`. Extract it
verbatim into a shared `SectionRail` component (`brands`/`sentiment`/… buttons, active
highlight, trailing divider). Both panels render the identical rail — the rail is what
swaps the panels, so it must not be duplicated. Props: `{ activeSection, onSectionChange }`.

### `BrandedWidgetPanel.tsx` (edit)
Replace its inline rail with `<SectionRail .../>`. No other behavior change.

### `AiPersonalityPanel.tsx` (new)
Same outer shell as `BrandedWidgetPanel` (`w-[484px]`, rounded-24, glass bg, form area +
`<SectionRail/>`). Renders the three field groups above. Presentational: all edits bubble
up via a single `onPersonalityChange(patch: Partial<Personality>)` handler. Props:
`{ brand, activeSection, onSectionChange, onPersonalityChange }`.

Textareas use the existing input styling idiom (`border-grey-400`, rounded-lg, white bg).
Info icon: Garden `info-stroke` glyph via `GardenIcon`, consistent with the screen.

### `ConfigurationView.tsx` (edit)
- Add `updatePersonality(patch: Partial<Personality>)` next to `updateSelected`, updating
  `selected.personality`.
- In the right column, choose the panel by `activeSection`:
  - `sentiment` → `<AiPersonalityPanel/>`
  - else → `<BrandedWidgetPanel/>` (i.e. `brands` and all other sections keep current
    behavior — Sentiment-only scope).

## Testing

- **`config-data.test.ts`** — extend: assert each seed brand has a `personality` with the
  expected default shape; assert `TONE_PRESET_OPTIONS` contents.
- **`AiPersonalityPanel.test.tsx`** (new) — render with a brand; assert header
  "AI Personality" and the three section labels present; typing in General Context calls
  `onPersonalityChange`; clicking a preset chip toggles it (calls handler with updated
  `tonePresets`).
- **`ConfigurationView.test.tsx`** — extend: clicking the heart (Sentiment) rail button
  swaps the panel to "AI Personality"; the Brands rail button swaps back; switching the
  selected brand while on Sentiment shows that brand's personality values.

## Out of scope

- Other rail sections (`links`, `license`, `mood`, `announce`, and the trailing group)
  remain as they are today.
- Word-count enforcement / validation of the "under 100 words" footnote (decorative).
- Any persistence beyond in-memory React state.
- The center preview column and channel tabs are unchanged.
```