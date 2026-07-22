import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { BlockCanvas } from './BlockCanvas'
import type { CanvasBlock } from '../agent-store'

const blocks: CanvasBlock[] = [
  { id: 'b1', stepType: 'condition', title: 'Untitled classic block 01' },
]

describe('BlockCanvas', () => {
  it('renders existing block cards', () => {
    render(
      <DndProvider backend={HTML5Backend}>
        <BlockCanvas blocks={blocks} onChange={() => {}} />
      </DndProvider>,
    )
    expect(screen.getByText('Untitled classic block 01')).toBeInTheDocument()
  })

  it('removes a block and emits the new list', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DndProvider backend={HTML5Backend}>
        <BlockCanvas blocks={blocks} onChange={onChange} />
      </DndProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Remove Untitled classic block 01' }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
