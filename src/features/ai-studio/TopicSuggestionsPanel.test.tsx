import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TopicSuggestionsPanel } from './TopicSuggestionsPanel'

describe('TopicSuggestionsPanel', () => {
  it('shows the greeting and the first suggestion', () => {
    render(<TopicSuggestionsPanel />)
    expect(screen.getByTestId('ai-studio-topics-panel')).toBeInTheDocument()
    expect(screen.getByText(/Here's 3 quick wins/)).toBeInTheDocument()
    expect(screen.getByText('Fix "Create New Ticket" leak')).toBeInTheDocument()
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
  })

  it('advances to the next card and wraps around', async () => {
    render(<TopicSuggestionsPanel />)
    const next = screen.getByLabelText('Next suggestion')
    await userEvent.click(next)
    expect(screen.getByText('2 of 3')).toBeInTheDocument()
    expect(screen.getByText('Deflect Billing questions')).toBeInTheDocument()
    await userEvent.click(next)
    expect(screen.getByText('3 of 3')).toBeInTheDocument()
    await userEvent.click(next)
    // wraps back to the first
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
    expect(screen.getByText('Fix "Create New Ticket" leak')).toBeInTheDocument()
  })

  it('wraps backward from the first card to the last', async () => {
    render(<TopicSuggestionsPanel />)
    await userEvent.click(screen.getByLabelText('Previous suggestion'))
    expect(screen.getByText('3 of 3')).toBeInTheDocument()
    expect(screen.getByText('Coach on Account management')).toBeInTheDocument()
  })
})
