import type { StabilityRequest } from '../types'

export async function generateImage(req: StabilityRequest): Promise<string> {
  const res = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      prompt: req.prompt,
      width: req.width,
      height: req.height,
      steps: req.steps,
      cfg_scale: req.cfg_scale,
    }),
    signal: req.signal,
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const msg = errBody?.message ?? `${res.status} ${res.statusText}`
    throw new Error(`Stability via proxy ${res.status}: ${msg}`)
  }

  const data = await res.json() as { dataUrl: string }
  return data.dataUrl
}

export async function testStabilityConnection(): Promise<string> {
  const url = await generateImage({
    prompt: 'a tiny red dot on white background, minimal',
    width: 256,
    height: 256,
    steps: 5,
  })
  return url.slice(0, 50) + '…'
}