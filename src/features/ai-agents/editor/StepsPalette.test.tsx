import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { StepsPalette } from './StepsPalette'

describe('StepsPalette', () => {
  it('lists all step types under a Steps heading', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <StepsPalette onClose={() => {}} />
      </DndProvider>,
    )
    expect(screen.getByText('Steps')).toBeInTheDocument()
    expect(screen.getByText('Condition')).toBeInTheDocument()
    expect(screen.getByText('Code')).toBeInTheDocument()
    expect(screen.getByText('CSAT Survey Trigger Point')).toBeInTheDocument()
  })
})
