import type { Response } from 'express'

/**
 * SSE helper. Writes standard `text/event-stream` headers and a single
 * JSON-encoded event. Caller is responsible for `end()`.
 */
export function initSse(res: Response): void {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()
}

export function writeSse(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

export function endSse(res: Response): void {
  res.end()
}