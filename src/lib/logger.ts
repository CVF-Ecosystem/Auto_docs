import pino from 'pino'

/**
 * Structured logger for Auto Docs.
 * Uses pino for low-overhead JSON logging.
 *
 * In development: pretty-printed output.
 * In production: JSON output (pipe to log aggregator).
 */
const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
})

/**
 * Child loggers per domain — adds `service` field to every log line.
 */
export const uploadLogger = logger.child({ service: 'upload' })
export const ocrLogger = logger.child({ service: 'ocr' })
export const aiLogger = logger.child({ service: 'ai' })
export const gasLogger = logger.child({ service: 'gas' })
export const authLogger = logger.child({ service: 'auth' })
export const dbLogger = logger.child({ service: 'db' })
