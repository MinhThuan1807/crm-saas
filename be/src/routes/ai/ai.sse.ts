import { Response } from 'express'
import { Logger } from '@nestjs/common'

type Subscriber = { res: Response; interval: NodeJS.Timeout }

const log = new Logger('AiSse')

const subscribers = new Map<string, Set<Subscriber>>()

function keyFor(tenantId: string, dealId: string) {
  return `${tenantId}:${dealId}`
}

function sendEvent(res: Response, event: string, data: unknown) {
  try {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  } catch (err) {
    log.warn('Failed to write SSE event', err)
  }
}

export function subscribeToAiStream(tenantId: string, dealId: string, res: Response) {
  const k = keyFor(tenantId, dealId)
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  // disable nginx buffering
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()

  // send connected event
  sendEvent(res, 'ai-connected', { message: 'connected' })

  const interval = setInterval(() => {
    sendEvent(res, 'heartbeat', { ts: Date.now() })
  }, 15_000)

  const sub: Subscriber = { res, interval }
  const set = subscribers.get(k) ?? new Set()
  set.add(sub)
  subscribers.set(k, set)

  const cleanup = () => {
    clearInterval(interval)
    const s = subscribers.get(k)
    if (s) {
      s.delete(sub)
      if (s.size === 0) subscribers.delete(k)
    }
  }

  res.on('close', () => {
    cleanup()
  })

  return cleanup
}

export function publishAiEvent(tenantId: string, dealId: string, event: string, payload: unknown) {
  const k = keyFor(tenantId, dealId)
  const set = subscribers.get(k)
  if (!set || set.size === 0) return false
  for (const sub of set) {
    sendEvent(sub.res, event, payload)
    if (event === 'ai-complete' || event === 'ai-error') {
      try {
        sub.res.end()
      } catch (e) {
        // ignore
      }
      clearInterval(sub.interval)
    }
  }
  // remove all subscribers for this key after complete/error
  if (event === 'ai-complete' || event === 'ai-error') subscribers.delete(k)
  return true
}

export function getSubscriberCount(tenantId: string, dealId: string) {
  const k = keyFor(tenantId, dealId)
  return subscribers.get(k)?.size ?? 0
}

export default { subscribeToAiStream, publishAiEvent, getSubscriberCount }
