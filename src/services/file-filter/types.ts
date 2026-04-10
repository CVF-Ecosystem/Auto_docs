export const ALLOWED_EXTENSIONS = [
  '.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt',
  '.png', '.jpg', '.jpeg', '.webp'
] as const

export const ALLOWED_MIMES: Record<string, string> = {
  '.pdf':  'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls':  'application/vnd.ms-excel',
  '.csv':  'text/csv',
  '.txt':  'text/plain',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20MB

export type FileCategory = 'text-extractable' | 'image' | 'pdf-text' | 'pdf-scan'

export interface GateResult {
  ok: boolean
  error?: string
  category?: FileCategory
}
