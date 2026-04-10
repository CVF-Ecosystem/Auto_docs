import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').default('http://localhost:3000'),
  GAS_WEBHOOK_URL: z.string().url('GAS_WEBHOOK_URL must be a valid URL'),
  GAS_SECRET: z.string().min(1).optional(),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(20),
  DEFAULT_OCR_ENGINE: z.enum(['gemini', 'tesseract']).default('gemini'),
})

export const env = envSchema.parse(process.env)
