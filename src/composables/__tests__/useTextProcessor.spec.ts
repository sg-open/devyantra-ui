import { describe, it, expect } from 'vitest'
import { useTextProcessor } from '../useTextProcessor'

describe('useTextProcessor formatText', () => {
  it('surfaces a JSON syntax error for truncated JSON instead of echoing it', async () => {
    const { formatText } = useTextProcessor()
    const result = await formatText('{"a":1,')

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.formatted).toBe(null)
  })

  it('surfaces a JSON error for array-like broken input', async () => {
    const { formatText } = useTextProcessor()
    const result = await formatText('[1, 2,')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('still beautifies valid JSON', async () => {
    const { formatText } = useTextProcessor()
    const result = await formatText('{"a":1}')
    expect(result.success).toBe(true)
    expect(result.formatted).toBe('{\n  "a": 1\n}')
  })

  it('still echoes genuine plain text unchanged', async () => {
    const { formatText } = useTextProcessor()
    const result = await formatText('just a sentence, nothing else')
    expect(result.success).toBe(true)
    expect(result.formatted).toBe('just a sentence, nothing else')
  })
})
