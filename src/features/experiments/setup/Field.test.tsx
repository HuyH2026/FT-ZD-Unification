import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TextField, TextArea, SelectField } from './Field'

describe('Field primitives', () => {
  it('TextField shows label and value, fires onChange', () => {
    const onChange = vi.fn()
    render(<TextField label="Test name" value="Hello" onChange={onChange} />)
    expect(screen.getByText('Test name')).toBeInTheDocument()
    const input = screen.getByDisplayValue('Hello')
    fireEvent.change(input, { target: { value: 'World' } })
    expect(onChange).toHaveBeenCalledWith('World')
  })

  it('TextArea shows label and value, fires onChange', () => {
    const onChange = vi.fn()
    render(<TextArea label="Description" value="Body" onChange={onChange} />)
    expect(screen.getByText('Description')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('Body'), { target: { value: 'New' } })
    expect(onChange).toHaveBeenCalledWith('New')
  })

  it('SelectField renders label and value text', () => {
    render(<SelectField label="Channel" value="Widget" />)
    expect(screen.getByText('Channel')).toBeInTheDocument()
    expect(screen.getByText('Widget')).toBeInTheDocument()
  })
})
