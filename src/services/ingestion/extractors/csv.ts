import Papa from 'papaparse'

/**
 * Extract text from CSV file
 */
export async function extractCsv(buffer: Buffer): Promise<string> {
  try {
    const text = buffer.toString('utf-8')
    
    const result = Papa.parse(text, {
      header: false,
      skipEmptyLines: true
    })
    
    if (result.errors.length > 0) {
      throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`)
    }
    
    // Convert parsed data back to text format
    const rows = result.data as string[][]
    return rows.map(row => row.join('\t')).join('\n')
  } catch (error) {
    throw new Error(`Failed to extract text from CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
