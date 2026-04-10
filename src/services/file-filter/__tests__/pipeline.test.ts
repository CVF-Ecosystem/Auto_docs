import { describe, it, expect, vi, afterEach } from 'vitest'
import { runFileFilterPipeline } from '../index'
import * as gates from '../gates'

afterEach(() => {
  vi.restoreAllMocks()
})

const passingGates = () => {
  vi.spyOn(gates, 'gate1_extension').mockReturnValue({ ok: true })
  vi.spyOn(gates, 'gate2_filesize').mockReturnValue({ ok: true })
  vi.spyOn(gates, 'gate3_mimetype').mockResolvedValue({ ok: true })
  vi.spyOn(gates, 'gate4_integrity').mockResolvedValue({ ok: true })
  vi.spyOn(gates, 'gate5_classify').mockResolvedValue({ ok: true, category: 'text-extractable' })
}

describe('runFileFilterPipeline', () => {
  it('returns ok=true with category when all gates pass', async () => {
    passingGates()
    const result = await runFileFilterPipeline(Buffer.from('data'), 'test.txt')
    expect(result.ok).toBe(true)
    expect(result.category).toBe('text-extractable')
  })

  it('stops at gate 1 and returns error when extension is rejected', async () => {
    vi.spyOn(gates, 'gate1_extension').mockReturnValue({ ok: false, error: 'bad extension' })
    const gate2Spy = vi.spyOn(gates, 'gate2_filesize')
    const gate3Spy = vi.spyOn(gates, 'gate3_mimetype')

    const result = await runFileFilterPipeline(Buffer.from('data'), 'malware.exe')

    expect(result.ok).toBe(false)
    expect(result.error).toBe('bad extension')
    expect(gate2Spy).not.toHaveBeenCalled()
    expect(gate3Spy).not.toHaveBeenCalled()
  })

  it('stops at gate 2 and returns error when file is too large', async () => {
    vi.spyOn(gates, 'gate1_extension').mockReturnValue({ ok: true })
    vi.spyOn(gates, 'gate2_filesize').mockReturnValue({ ok: false, error: 'file too large' })
    const gate3Spy = vi.spyOn(gates, 'gate3_mimetype')
    const gate4Spy = vi.spyOn(gates, 'gate4_integrity')

    const result = await runFileFilterPipeline(Buffer.alloc(1), 'big.pdf')

    expect(result.ok).toBe(false)
    expect(result.error).toBe('file too large')
    expect(gate3Spy).not.toHaveBeenCalled()
    expect(gate4Spy).not.toHaveBeenCalled()
  })

  it('stops at gate 3 and returns error on MIME mismatch', async () => {
    vi.spyOn(gates, 'gate1_extension').mockReturnValue({ ok: true })
    vi.spyOn(gates, 'gate2_filesize').mockReturnValue({ ok: true })
    vi.spyOn(gates, 'gate3_mimetype').mockResolvedValue({ ok: false, error: 'MIME mismatch' })
    const gate4Spy = vi.spyOn(gates, 'gate4_integrity')
    const gate5Spy = vi.spyOn(gates, 'gate5_classify')

    const result = await runFileFilterPipeline(Buffer.from('data'), 'fake.pdf')

    expect(result.ok).toBe(false)
    expect(result.error).toBe('MIME mismatch')
    expect(gate4Spy).not.toHaveBeenCalled()
    expect(gate5Spy).not.toHaveBeenCalled()
  })

  it('stops at gate 4 and returns error on corrupted file', async () => {
    vi.spyOn(gates, 'gate1_extension').mockReturnValue({ ok: true })
    vi.spyOn(gates, 'gate2_filesize').mockReturnValue({ ok: true })
    vi.spyOn(gates, 'gate3_mimetype').mockResolvedValue({ ok: true })
    vi.spyOn(gates, 'gate4_integrity').mockResolvedValue({ ok: false, error: 'corrupted' })
    const gate5Spy = vi.spyOn(gates, 'gate5_classify')

    const result = await runFileFilterPipeline(Buffer.from('data'), 'corrupt.docx')

    expect(result.ok).toBe(false)
    expect(result.error).toBe('corrupted')
    expect(gate5Spy).not.toHaveBeenCalled()
  })

  it('stops at gate 5 and returns error on classification failure', async () => {
    vi.spyOn(gates, 'gate1_extension').mockReturnValue({ ok: true })
    vi.spyOn(gates, 'gate2_filesize').mockReturnValue({ ok: true })
    vi.spyOn(gates, 'gate3_mimetype').mockResolvedValue({ ok: true })
    vi.spyOn(gates, 'gate4_integrity').mockResolvedValue({ ok: true })
    vi.spyOn(gates, 'gate5_classify').mockResolvedValue({ ok: false, error: 'cannot classify' })

    const result = await runFileFilterPipeline(Buffer.from('data'), 'test.pdf')

    expect(result.ok).toBe(false)
    expect(result.error).toBe('cannot classify')
  })

  it('passes correct buffer and filename to gates', async () => {
    passingGates()
    const buf = Buffer.from('hello')
    await runFileFilterPipeline(buf, 'document.txt')

    expect(gates.gate1_extension).toHaveBeenCalledWith('document.txt')
    expect(gates.gate2_filesize).toHaveBeenCalledWith(buf)
    expect(gates.gate3_mimetype).toHaveBeenCalledWith(buf, '.txt')
    expect(gates.gate4_integrity).toHaveBeenCalledWith(buf, '.txt')
    expect(gates.gate5_classify).toHaveBeenCalledWith('.txt', buf)
  })

  it('propagates category from gate 5 when pipeline passes', async () => {
    vi.spyOn(gates, 'gate1_extension').mockReturnValue({ ok: true })
    vi.spyOn(gates, 'gate2_filesize').mockReturnValue({ ok: true })
    vi.spyOn(gates, 'gate3_mimetype').mockResolvedValue({ ok: true })
    vi.spyOn(gates, 'gate4_integrity').mockResolvedValue({ ok: true })
    vi.spyOn(gates, 'gate5_classify').mockResolvedValue({ ok: true, category: 'pdf-scan' })

    const result = await runFileFilterPipeline(Buffer.from('data'), 'scan.pdf')
    expect(result.category).toBe('pdf-scan')
  })
})
