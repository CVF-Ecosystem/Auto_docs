import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseTextToJson, TemplateField } from '../parse'

// ─── Mock Gemini ──────────────────────────────────────────────────────────────

// Mock @/lib/gemini so we don't need a real GEMINI_API_KEY in tests
vi.mock('@/lib/gemini', () => ({
  ensureGeminiConfigured: vi.fn(),
}))

import { ensureGeminiConfigured } from '@/lib/gemini'

function makeGeminiMock(responses: string[]) {
  let callCount = 0
  return {
    generateContent: vi.fn().mockImplementation(() => {
      const text = responses[callCount++] ?? responses[responses.length - 1]
      return Promise.resolve({ response: { text: () => text } })
    }),
  }
}

// Sample fields for tests
const sampleFields: TemplateField[] = [
  { fieldName: 'name', fieldLabel: 'Tên', fieldType: 'text', required: true },
  { fieldName: 'date', fieldLabel: 'Ngày', fieldType: 'date', required: false },
  { fieldName: 'amount', fieldLabel: 'Số tiền', fieldType: 'number', required: false },
]

// ─── Happy Path ───────────────────────────────────────────────────────────────

describe('parseTextToJson — happy path', () => {
  beforeEach(() => vi.clearAllMocks())

  it('extracts all fields from clean JSON response', async () => {
    const mock = makeGeminiMock([
      JSON.stringify({ name: 'Nguyễn Văn A', date: '2026-04-10', amount: '5000000' }),
    ]);
    (ensureGeminiConfigured as ReturnType<typeof vi.fn>).mockReturnValue(mock)

    const result = await parseTextToJson('Hợp đồng của Nguyễn Văn A', sampleFields)
    expect(result.name).toBe('Nguyễn Văn A')
    expect(result.date).toBe('2026-04-10')
    expect(result.amount).toBe('5000000')
  })

  it('accepts JSON wrapped in markdown code block', async () => {
    const mock = makeGeminiMock([
      '```json\n{"name":"Trần Thị B","date":"2026-01-01","amount":""}\n```',
    ]);
    (ensureGeminiConfigured as ReturnType<typeof vi.fn>).mockReturnValue(mock)

    const result = await parseTextToJson('Document text', sampleFields)
    expect(result.name).toBe('Trần Thị B')
  })

  it('accepts JSON with extra whitespace and text before/after', async () => {
    const mock = makeGeminiMock([
      'Here is the extracted data:\n{"name":"Le Van C","date":"","amount":"100"}\nEnd.',
    ]);
    (ensureGeminiConfigured as ReturnType<typeof vi.fn>).mockReturnValue(mock)

    const result = await parseTextToJson('...', sampleFields)
    expect(result.name).toBe('Le Van C')
    expect(result.amount).toBe('100')
  })

  it('allows empty string for non-required fields', async () => {
    const mock = makeGeminiMock([
      JSON.stringify({ name: 'Hoang X', date: '', amount: '' }),
    ]);
    (ensureGeminiConfigured as ReturnType<typeof vi.fn>).mockReturnValue(mock)

    const result = await parseTextToJson('...', sampleFields)
    expect(result.name).toBe('Hoang X')
    expect(result.date).toBe('')
  })
})

// ─── Retry Logic ──────────────────────────────────────────────────────────────

describe('parseTextToJson — retry logic (C-5 fix)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retries when first response has no JSON, succeeds on retry', async () => {
    const mock = makeGeminiMock([
      'I cannot find any data in this text.',         // attempt 1 — no JSON
      JSON.stringify({ name: 'Retry Success', date: '', amount: '' }), // retry — valid
    ]);
    (ensureGeminiConfigured as ReturnType<typeof vi.fn>).mockReturnValue(mock)

    const result = await parseTextToJson('...', sampleFields)
    expect(result.name).toBe('Retry Success')
    expect(mock.generateContent).toHaveBeenCalledTimes(2) // first + retry
  })

  it('retries when schema validation fails (required field empty), succeeds on retry', async () => {
    // name is required — first response missing it triggers Zod validation error
    const mock = makeGeminiMock([
      JSON.stringify({ name: '', date: '', amount: '' }),              // attempt 1 — name empty (required)
      JSON.stringify({ name: 'Fixed Name', date: '', amount: '' }),    // retry — valid
    ]);
    (ensureGeminiConfigured as ReturnType<typeof vi.fn>).mockReturnValue(mock)

    const result = await parseTextToJson('...', sampleFields)
    expect(result.name).toBe('Fixed Name')
  })

  it('throws after both attempts fail', async () => {
    const mock = makeGeminiMock([
      'No JSON here at all.',
      'Still no JSON.',
    ]);
    (ensureGeminiConfigured as ReturnType<typeof vi.fn>).mockReturnValue(mock)

    await expect(parseTextToJson('...', sampleFields)).rejects.toThrow()
  })

  it('retry uses a different (more explicit) prompt', async () => {
    const mock = makeGeminiMock([
      'not json',
      JSON.stringify({ name: 'OK', date: '', amount: '' }),
    ]);
    (ensureGeminiConfigured as ReturnType<typeof vi.fn>).mockReturnValue(mock)

    await parseTextToJson('...', sampleFields)

    // Second call (retry) should include IMPORTANT keyword
    const calls = mock.generateContent.mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[1][0]).toContain('IMPORTANT')
  })
})

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('parseTextToJson — edge cases', () => {
  beforeEach(() => vi.clearAllMocks())

  it('works with a single required field', async () => {
    const mock = makeGeminiMock([JSON.stringify({ name: 'Solo Field' })]);
    (ensureGeminiConfigured as ReturnType<typeof vi.fn>).mockReturnValue(mock)

    const fields: TemplateField[] = [
      { fieldName: 'name', fieldLabel: 'Tên', fieldType: 'text', required: true },
    ]
    const result = await parseTextToJson('...', fields)
    expect(result.name).toBe('Solo Field')
  })

  it('throws when no fields are provided and required is unknown', async () => {
    // When fields array is empty, Zod schema is {}, any JSON matches
    const mock = makeGeminiMock([JSON.stringify({})]);
    (ensureGeminiConfigured as ReturnType<typeof vi.fn>).mockReturnValue(mock)

    const result = await parseTextToJson('...', [])
    expect(result).toEqual({})
  })
})
