import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SuggestionCard } from './SuggestionCard'
import { TOPIC_SUGGESTIONS } from './suggestions-data'

describe('SuggestionCard', () => {
  const suggestion = TOPIC_SUGGESTIONS[0]

  it('renders the title, pager, all bullets, and CTA', () => {
    render(
      <SuggestionCard suggestion={suggestion} index={0} total={3} onPrev={vi.fn()} onNext={vi.fn()} />,
    )
    expect(screen.getByText('Fix "Create New Ticket" leak')).toBeInTheDocument()
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
    expect(screen.getByText('3,653 unresolved conversations')).toBeInTheDocument()
    expect(screen.getByText('Show me the tickets')).toBeInTheDocument()
  })

  it('fires onPrev / onNext from the pager buttons', async () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()
    render(
      <SuggestionCard suggestion={suggestion} index={0} total={3} onPrev={onPrev} onNext={onNext} />,
    )
    await userEvent.click(screen.getByLabelText('Previous suggestion'))
    await userEvent.click(screen.getByLabelText('Next suggestion'))
    expect(onPrev).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
