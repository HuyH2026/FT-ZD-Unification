// Right slide-over create form for a new agent. Fields: Universal Brand toggle,
// Tags, display name, "triggered when" description, and training phrases.
// Create is disabled until a display name is entered. Presentational — the
// parent owns creation + navigation.
import { useState } from 'react'
import { X, Plus, ChevronDown } from 'lucide-react'
import type { ChannelKey } from './agent-builder-data'
import type { CreateAgentFields } from './agent-store'

export function CreateAgentPanel({
  channel, onClose, onCreate,
}: {
  channel: ChannelKey
  onClose: () => void
  onCreate: (fields: CreateAgentFields) => void
}) {
  const [universalBrand, setUniversalBrand] = useState(false)
  const [name, setName] = useState('')
  const [triggeredWhen, setTriggeredWhen] = useState('')
  const [phrases, setPhrases] = useState<string[]>([])
  const [draft, setDraft] = useState('')

  const addPhrase = () => {
    const v = draft.trim()
    if (!v || phrases.includes(v)) return
    setPhrases((p) => [...p, v])
    setDraft('')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div role="dialog" aria-label="Create Agent" className="relative flex h-full w-[480px] flex-col overflow-y-auto bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-start justify-between">
          <h1 className="text-[28px] font-semibold text-ink">Create Agent</h1>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full border border-surface-border p-2 text-ink"><X size={18} aria-hidden /></button>
        </div>

        {/* Universal Brand */}
        <div className="mb-6">
          <button
            type="button" role="switch" aria-checked={universalBrand} aria-label="Universal Brand"
            onClick={() => setUniversalBrand((v) => !v)}
            className="mb-1 inline-flex items-center gap-2 rounded-full px-2 py-1 text-[13px] font-medium"
            style={{ backgroundColor: universalBrand ? '#0f8a5f' : '#c9c7c3', color: '#fff' }}
          >
            {universalBrand ? 'On' : 'Off'}
          </button>
          <span className="ml-2 text-[15px] text-ink">Universal Brand is {universalBrand ? 'on' : 'off'}</span>
          <p className="mt-1 text-[13px] text-ink-muted">The agent will be shared across all brands, including existing ones and any added in the future.</p>
        </div>

        {/* Tags */}
        <label className="mb-2 block text-[16px] font-semibold text-ink">Tags (optional)</label>
        <p className="mb-2 text-[13px] text-ink-muted">Agents can be shared across brands or user segments and will only be triggered for the specified brand. If no brand is assigned, the agent will be visible to all segments.</p>
        <button type="button" className="mb-6 flex w-full items-center justify-between rounded-lg border border-surface-border px-3 py-2.5 text-[14px] text-ink-muted">
          Assign tags <ChevronDown size={16} aria-hidden />
        </button>

        {/* Display name */}
        <label htmlFor="agent-name" className="mb-2 block text-[16px] font-semibold text-ink">Agent display name</label>
        <p className="mb-2 text-[13px] text-ink-muted">Display names are used by the model to better understand the agent and may be shown to your customer for confirmation. Ensure accuracy by using descriptive names that reflect the expected outcome, such as "Error Uploading Tax Return" rather than "Return Errors".</p>
        <input
          id="agent-name" aria-label="Agent display name" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Give a name to this agent"
          className="mb-6 w-full rounded-lg border border-surface-border px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted"
        />

        {/* More information */}
        <label htmlFor="agent-trigger" className="mb-2 block text-[16px] font-semibold text-ink">More information (Recommended)</label>
        <p className="mb-2 text-[13px] text-ink-muted">Briefly describe your customer's action or query to help predict accurate responses.</p>
        <p className="mb-2 text-[14px] text-ink">This agent is triggered when...</p>
        <textarea
          id="agent-trigger" aria-label="This agent is triggered when" value={triggeredWhen} onChange={(e) => setTriggeredWhen(e.target.value)}
          rows={3} placeholder="describe your customer's action or query."
          className="mb-6 w-full rounded-lg border border-surface-border px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted"
        />

        {/* Training phrases */}
        <label htmlFor="agent-phrase" className="mb-2 block text-[16px] font-semibold text-ink">Training phrases</label>
        <p className="mb-2 text-[13px] text-ink-muted">Input training phrases for questions that your customers would ask.</p>
        {phrases.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {phrases.map((p) => (
              <span key={p} className="rounded-md border border-surface-border px-2 py-0.5 text-[13px] text-ink">{p}</span>
            ))}
          </div>
        )}
        <div className="mb-8 flex items-center gap-2">
          <input
            id="agent-phrase" aria-label="Training phrases" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPhrase() } }}
            placeholder="Type a training phrase and press 'Enter'"
            className="flex-1 rounded-lg border border-surface-border px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-muted"
          />
          <button type="button" aria-label="Add training phrase" onClick={addPhrase} className="text-ink-muted"><Plus size={18} aria-hidden /></button>
        </div>

        <button
          type="button" disabled={name.trim().length === 0}
          onClick={() => onCreate({ name: name.trim(), channel, universalBrand, tags: [], triggeredWhen, trainingPhrases: phrases })}
          className="mt-auto w-full rounded-full bg-ink px-4 py-3 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#f0eeec] disabled:text-ink-muted"
        >
          Create Agent
        </button>
      </div>
    </div>
  )
}
