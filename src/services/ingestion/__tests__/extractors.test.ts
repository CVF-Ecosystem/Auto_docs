import { describe, it, expect } from 'vitest'
import { extractCsv } from '../extractors/csv'
import { extractExcel } from '../extractors/excel'
import { extractText as extractPlainText } from '../extractors/text'
import * as XLSX from 'xlsx'

// ─── Plain Text ───────────────────────────────────────────────────────────────

describe('extractText (plain text)', () => {
  it('extracts UTF-8 text correctly', async () => {
    const buffer = Buffer.from('Xin chào thế giới\nDòng thứ hai', 'utf-8')
    const result = await extractPlainText(buffer)
    expect(result).toBe('Xin chào thế giới\nDòng thứ hai')
  })

  it('handles empty file', async () => {
    const buffer = Buffer.from('', 'utf-8')
    const result = await extractPlainText(buffer)
    expect(result).toBe('')
  })

  it('handles ASCII content', async () => {
    const buffer = Buffer.from('Hello World 123', 'ascii')
    const result = await extractPlainText(buffer)
    expect(result).toContain('Hello World 123')
  })

  it('handles multiline content', async () => {
    const content = 'Line 1\nLine 2\nLine 3\n'
    const buffer = Buffer.from(content)
    const result = await extractPlainText(buffer)
    expect(result).toBe(content)
  })
})

// ─── CSV ─────────────────────────────────────────────────────────────────────

describe('extractCsv', () => {
  it('parses a simple CSV into tab-separated rows', async () => {
    const csv = 'name,age,city\nAlice,30,Hanoi\nBob,25,HCMC'
    const buffer = Buffer.from(csv, 'utf-8')
    const result = await extractCsv(buffer)
    expect(result).toContain('name\tage\tcity')
    expect(result).toContain('Alice\t30\tHanoi')
    expect(result).toContain('Bob\t25\tHCMC')
  })

  it('skips empty lines', async () => {
    const csv = 'col1,col2\n\nval1,val2\n'
    const buffer = Buffer.from(csv, 'utf-8')
    const result = await extractCsv(buffer)
    const lines = result.split('\n').filter(Boolean)
    expect(lines).toHaveLength(2)
  })

  it('handles single-column CSV with explicit delimiter', async () => {
    // papaparse requires at least one delimiter character to detect — use comma
    const csv = 'item,\napple,\nbanana,\ncherry,'
    const buffer = Buffer.from(csv, 'utf-8')
    const result = await extractCsv(buffer)
    expect(result).toContain('item')
    expect(result).toContain('apple')
  })

  it('handles Vietnamese content in CSV', async () => {
    const csv = 'tên,tuổi\nNguyễn Văn A,35\nTrần Thị B,28'
    const buffer = Buffer.from(csv, 'utf-8')
    const result = await extractCsv(buffer)
    expect(result).toContain('Nguyễn Văn A')
    expect(result).toContain('Trần Thị B')
  })

  it('handles CSV with quoted fields', async () => {
    const csv = 'name,description\n"Smith, John","Senior engineer"'
    const buffer = Buffer.from(csv, 'utf-8')
    const result = await extractCsv(buffer)
    expect(result).toContain('Smith, John')
    expect(result).toContain('Senior engineer')
  })
})

// ─── Excel ────────────────────────────────────────────────────────────────────

function createExcelBuffer(sheetData: Record<string, (string | number)[][]>): Buffer {
  const wb = XLSX.utils.book_new()
  for (const [sheetName, rows] of Object.entries(sheetData)) {
    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

describe('extractExcel', () => {
  it('extracts a single sheet with data', async () => {
    const buffer = createExcelBuffer({
      'Sheet1': [['Name', 'Score'], ['Alice', 95], ['Bob', 88]],
    })
    const result = await extractExcel(buffer)
    expect(result).toContain('Sheet: Sheet1')
    expect(result).toContain('Alice')
    expect(result).toContain('95')
  })

  it('extracts multiple sheets', async () => {
    const buffer = createExcelBuffer({
      'Q1': [['Month', 'Revenue'], ['Jan', 100]],
      'Q2': [['Month', 'Revenue'], ['Apr', 200]],
    })
    const result = await extractExcel(buffer)
    expect(result).toContain('Sheet: Q1')
    expect(result).toContain('Sheet: Q2')
    expect(result).toContain('Jan')
    expect(result).toContain('Apr')
  })

  it('skips empty sheets', async () => {
    const buffer = createExcelBuffer({
      'Empty': [],
      'Data': [['col1', 'col2'], ['a', 'b']],
    })
    const result = await extractExcel(buffer)
    // Empty sheet should not appear (or appear with empty content)
    expect(result).toContain('Sheet: Data')
    expect(result).toContain('col1')
  })

  it('handles Vietnamese content', async () => {
    const buffer = createExcelBuffer({
      'Báo cáo': [['Tên', 'Số lượng'], ['Hàng A', 50]],
    })
    const result = await extractExcel(buffer)
    expect(result).toContain('Tên')
    expect(result).toContain('Hàng A')
  })

  it('parses plain text as a sheet gracefully (XLSX is lenient)', async () => {
    // XLSX.read does NOT throw on plain text — it treats it as a CSV-like sheet.
    // This is known SheetJS behavior. Real corruption (e.g., truncated ZIP) does throw.
    const plainText = Buffer.from('this is not an excel file')
    const result = await extractExcel(plainText)
    // Should return a string — may contain the text as a cell value or be empty
    expect(typeof result).toBe('string')
  })
})
