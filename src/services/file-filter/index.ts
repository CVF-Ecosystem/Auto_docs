import { FileCategory } from './types'
import {
  gate1_extension,
  gate2_filesize,
  gate3_mimetype,
  gate4_integrity,
  gate5_classify
} from './gates'

export interface FileFilterResult {
  ok: boolean
  error?: string
  category?: FileCategory
}

/**
 * Run complete file filter pipeline
 * Gates are executed sequentially, stopping at first failure
 */
export async function runFileFilterPipeline(
  buffer: Buffer,
  filename: string
): Promise<FileFilterResult> {
  // Gate 1: Extension check
  const gate1 = gate1_extension(filename)
  if (!gate1.ok) {
    return gate1
  }
  
  // Gate 2: File size check
  const gate2 = gate2_filesize(buffer)
  if (!gate2.ok) {
    return gate2
  }
  
  // Extract extension for remaining gates
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
  
  // Gate 3: MIME type validation
  const gate3 = await gate3_mimetype(buffer, ext)
  if (!gate3.ok) {
    return gate3
  }
  
  // Gate 4: File integrity check
  const gate4 = await gate4_integrity(buffer, ext)
  if (!gate4.ok) {
    return gate4
  }
  
  // Gate 5: File classification
  const gate5 = await gate5_classify(ext, buffer)
  if (!gate5.ok) {
    return gate5
  }
  
  return {
    ok: true,
    category: gate5.category
  }
}
