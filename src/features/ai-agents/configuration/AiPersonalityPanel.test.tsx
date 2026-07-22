import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiPersonalityPanel } from './AiPersonalityPanel'
import { SEED_BRANDS } from './config-data'

const vip = SEED_BRANDS[0]

function setup(overrides = {}) {
  const props = {
    brand: vip,
    activeSection: 'sentiment',
    onSectionChange: vi.fn(),
    onPersonalityChange: vi.fn(),
    ...overrides,
  }
  render(<AiPersonalityPanel {...props} />)
  return props
}

describe('AiPersonalityPanel', () => {
  it('renders the heading and the three section labels', () => {
    setup()
    expect(screen.getByText('AI Personality')).toBeInTheDocument()
    expect(screen.getByText('General Context')).toBeInTheDocument()
    expect(screen.getByText('Glossary')).toBeInTheDocument()
    expect(screen.getByText('Tone of Voice')).toBeInTheDocument()
  })

  it('fires onPersonalityChange when General Context is typed into', async () => {
    const props = setup()
    await userEvent.type(screen.getByLabelText('General Context'), 'x')
    expect(props.onPersonalityChange).toHaveBeenCalledWith({ generalContext: 'x' })
  })

  it('toggles a tone preset chip on click', async () => {
    const brand = { ...vip, personality: { ...vip.personality, toneUsePresets: true } }
    const props = setup({ brand })
    await userEvent.click(screen.getByRole('button', { name: 'Empathetic' }))
    expect(props.onPersonalityChange).toHaveBeenCalledWith({ tonePresets: ['Empathetic'] })
  })

  it('removes an already-selected preset chip on click', async () => {
    const brand = { ...vip, personality: { ...vip.personality, toneUsePresets: true, tonePresets: ['Empathetic'] } }
    const props = setup({ brand })
    await userEvent.click(screen.getByRole('button', { name: 'Empathetic' }))
    expect(props.onPersonalityChange).toHaveBeenCalledWith({ tonePresets: [] })
  })

  it('forwards rail section clicks', async () => {
    const props = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Brands' }))
    expect(props.onSectionChange).toHaveBeenCalledWith('brands')
  })

  it('disables the preset chips and freeform textarea when their toggles are off', async () => {
    const props = setup() // vip: toneUsePresets=false, toneUseFreeform=false
    const chip = screen.getByRole('button', { name: 'Empathetic' })
    expect(chip).toBeDisabled()
    expect(screen.getByLabelText('Tone of Voice')).toBeDisabled()
    await userEvent.click(chip)
    expect(props.onPersonalityChange).not.toHaveBeenCalled()
  })
})
