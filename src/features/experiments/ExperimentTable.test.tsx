import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExperimentTable } from './ExperimentTable'
import { EXPERIMENTS } from './experiments-data'

describe('ExperimentTable', () => {
  it('renders column headers and a row per experiment', () => {
    render(<ExperimentTable experiments={EXPERIMENTS} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Traffic split')).toBeInTheDocument()
    expect(screen.getByText('Abandoned Cart Recovery')).toBeInTheDocument()
    expect(screen.getByText('Guided Troubleshoot Flow')).toBeInTheDocument()
    // Status badge label present
    expect(screen.getByText('Running')).toBeInTheDocument()
  })
})
