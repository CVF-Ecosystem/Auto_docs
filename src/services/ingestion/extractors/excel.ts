import * as XLSX from 'xlsx'

/**
 * Extract text from Excel file (.xlsx, .xls)
 * Converts sheets to text format
 */
export async function extractExcel(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const textParts: string[] = []
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName]
      
      // Convert sheet to CSV format
      const csv = XLSX.utils.sheet_to_csv(sheet)
      
      if (csv.trim()) {
        textParts.push(`Sheet: ${sheetName}\n${csv}`)
      }
    })
    
    return textParts.join('\n\n')
  } catch (error) {
    throw new Error(`Failed to extract text from Excel: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
