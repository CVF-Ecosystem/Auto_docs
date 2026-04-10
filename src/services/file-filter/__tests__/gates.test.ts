/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  gate1_extension,
  gate2_filesize,
  gate3_mimetype,
  gate4_integrity,
  gate5_classify,
} from '../gates'
import { MAX_FILE_SIZE_BYTES } from '../types'

const { mockPdfParse } = vi.hoisted(() => ({ mockPdfParse: vi.fn() }))

vi.mock('file-type', () => ({ fileTypeFromBuffer: vi.fn() }))
vi.mock('mammoth', () => ({ default: { extractRawText: vi.fn() } }))
vi.mock('xlsx', () => ({ read: vi.fn() }))
vi.mock('pdf-parse', () => ({ default: mockPdfParse }))

import { fileTypeFromBuffer } from 'file-type'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

afterEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Gate 1 — Extension whitelist
// ---------------------------------------------------------------------------
describe('gate1_extension', () => {
  it.each(['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt', '.png', '.jpg', '.jpeg', '.webp'])(
    'allows %s',
    (ext) => {
      expect(gate1_extension(`file${ext}`).ok).toBe(true)
    }
  )

  it.each(['.exe', '.js', '.zip', '.bat', '.sh'])(
    'rejects %s',
    (ext) => {
      const result = gate1_extension(`file${ext}`)
      expect(result.ok).toBe(false)
      expect(result.error).toBeTruthy()
    }
  )

  it('rejects files with no extension', () => {
    expect(gate1_extension('noextension').ok).toBe(false)
  })

  it('is case-insensitive (.PDF, .DOCX)', () => {
    expect(gate1_extension('document.PDF').ok).toBe(true)
    expect(gate1_extension('document.DOCX').ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Gate 2 — File size
// ---------------------------------------------------------------------------
describe('gate2_filesize', () => {
  it('allows empty buffer', () => {
    expect(gate2_filesize(Buffer.alloc(0)).ok).toBe(true)
  })

  it('allows buffer exactly at the limit', () => {
    expect(gate2_filesize(Buffer.alloc(MAX_FILE_SIZE_BYTES)).ok).toBe(true)
  })

  it('rejects buffer one byte over the limit', () => {
    const result = gate2_filesize(Buffer.alloc(MAX_FILE_SIZE_BYTES + 1))
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/too large/i)
  })

  it('includes size info in error message', () => {
    const bigBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024 * 1024)
    const result = gate2_filesize(bigBuffer)
    expect(result.error).toMatch(/MB/)
  })
})

// ---------------------------------------------------------------------------
// Gate 3 — MIME type via magic bytes
// ---------------------------------------------------------------------------
describe('gate3_mimetype', () => {
  const buf = Buffer.from('data')

  it('passes .txt regardless of detected MIME', async () => {
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' } as any)
    const result = await gate3_mimetype(buf, '.txt')
    expect(result.ok).toBe(true)
  })

  it('skips MIME check for .csv', async () => {
    const result = await gate3_mimetype(buf, '.csv')
    expect(result.ok).toBe(true)
  })

  it('accepts .docx when detected as ZIP (Office format)', async () => {
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({ mime: 'application/zip', ext: 'zip' } as any)
    const result = await gate3_mimetype(buf, '.docx')
    expect(result.ok).toBe(true)
  })

  it('accepts .docx when detected as correct OOXML MIME', async () => {
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ext: 'docx',
    } as any)
    const result = await gate3_mimetype(buf, '.docx')
    expect(result.ok).toBe(true)
  })

  it('accepts .xlsx when detected as ZIP', async () => {
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({ mime: 'application/zip', ext: 'zip' } as any)
    expect((await gate3_mimetype(buf, '.xlsx')).ok).toBe(true)
  })

  it('accepts .pdf with correct MIME', async () => {
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({ mime: 'application/pdf', ext: 'pdf' } as any)
    expect((await gate3_mimetype(buf, '.pdf')).ok).toBe(true)
  })

  it('rejects .pdf with wrong MIME (image/jpeg)', async () => {
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' } as any)
    const result = await gate3_mimetype(buf, '.pdf')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/mismatch/i)
  })

  it('rejects undetectable file type for non-text extensions', async () => {
    vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined)
    const result = await gate3_mimetype(buf, '.png')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/Unable to detect/i)
  })

  it('accepts .png with correct MIME', async () => {
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({ mime: 'image/png', ext: 'png' } as any)
    expect((await gate3_mimetype(buf, '.png')).ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Gate 4 — Integrity check
// ---------------------------------------------------------------------------
describe('gate4_integrity', () => {
  const buf = Buffer.from('data')

  it('passes .docx when mammoth succeeds', async () => {
    vi.mocked(mammoth.extractRawText).mockResolvedValue({ value: 'text', messages: [] })
    expect((await gate4_integrity(buf, '.docx')).ok).toBe(true)
  })

  it('rejects .docx when mammoth throws (corrupted)', async () => {
    vi.mocked(mammoth.extractRawText).mockRejectedValue(new Error('Invalid DOCX'))
    const result = await gate4_integrity(buf, '.docx')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/corrupted/i)
  })

  it('passes .xlsx when XLSX.read succeeds', async () => {
    vi.mocked(XLSX.read).mockReturnValue({} as any)
    expect((await gate4_integrity(buf, '.xlsx')).ok).toBe(true)
  })

  it('rejects .xlsx when XLSX.read throws', async () => {
    vi.mocked(XLSX.read).mockImplementation(() => { throw new Error('Corrupt XLSX') })
    const result = await gate4_integrity(buf, '.xlsx')
    expect(result.ok).toBe(false)
  })

  it('passes .xls when XLSX.read succeeds', async () => {
    vi.mocked(XLSX.read).mockReturnValue({} as any)
    expect((await gate4_integrity(buf, '.xls')).ok).toBe(true)
  })

  it('passes .pdf when pdf-parse succeeds', async () => {
    mockPdfParse.mockResolvedValue({ text: 'content', numpages: 1 })
    expect((await gate4_integrity(buf, '.pdf')).ok).toBe(true)
  })

  it('rejects .pdf when pdf-parse throws (corrupted)', async () => {
    mockPdfParse.mockRejectedValue(new Error('Invalid PDF'))
    const result = await gate4_integrity(buf, '.pdf')
    expect(result.ok).toBe(false)
  })

  it.each(['.txt', '.csv'])('passes %s (plain text integrity always ok)', async (ext) => {
    expect((await gate4_integrity(Buffer.from('hello world'), ext)).ok).toBe(true)
  })

  it.each(['.png', '.jpg', '.jpeg', '.webp'])('passes %s (images validated in OCR layer)', async (ext) => {
    expect((await gate4_integrity(buf, ext)).ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Gate 5 — Classification
// ---------------------------------------------------------------------------
describe('gate5_classify', () => {
  const buf = Buffer.from('data')

  it.each(['.png', '.jpg', '.jpeg', '.webp'])('classifies %s as image', async (ext) => {
    const result = await gate5_classify(ext, buf)
    expect(result.ok).toBe(true)
    expect(result.category).toBe('image')
  })

  it.each(['.docx', '.xlsx', '.xls', '.csv', '.txt'])(
    'classifies %s as text-extractable',
    async (ext) => {
      const result = await gate5_classify(ext, buf)
      expect(result.ok).toBe(true)
      expect(result.category).toBe('text-extractable')
    }
  )

  it('classifies .pdf with substantial text as pdf-text', async () => {
    const longText = 'A'.repeat(100)
    mockPdfParse.mockResolvedValue({ text: longText, numpages: 1 })
    const result = await gate5_classify('.pdf', buf)
    expect(result.ok).toBe(true)
    expect(result.category).toBe('pdf-text')
  })

  it('classifies .pdf with minimal text (< 50 chars) as pdf-scan', async () => {
    mockPdfParse.mockResolvedValue({ text: '  tiny  ', numpages: 1 })
    const result = await gate5_classify('.pdf', buf)
    expect(result.ok).toBe(true)
    expect(result.category).toBe('pdf-scan')
  })

  it('classifies empty .pdf text as pdf-scan', async () => {
    mockPdfParse.mockResolvedValue({ text: '', numpages: 1 })
    const result = await gate5_classify('.pdf', buf)
    expect(result.category).toBe('pdf-scan')
  })

  it('returns error for unknown extension', async () => {
    const result = await gate5_classify('.unknown', buf)
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/classify/i)
  })
})
