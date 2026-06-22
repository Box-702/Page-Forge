import type { ClaudeRequest, ClaudeResponse } from '../types'

export async function callClaude(req: ClaudeRequest): Promise<ClaudeResponse> {
  const res = await fetch('/api/ai/claude', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: req.model ?? 'claude-sonnet-4-6',
      maxTokens: req.maxTokens ?? 2048,
      system: req.system,
      messages: req.messages,
      tools: req.tools,
      tool_choice: req.tool_choice,
    }),
    signal: req.signal,
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const msg = errBody?.message ?? `${res.status} ${res.statusText}`
    throw new Error(`Claude via proxy ${res.status}: ${msg}`)
  }

  return (await res.json()) as ClaudeResponse
}

export async function testAnthropicConnection(): Promise<string> {
  const res = await callClaude({
    model: 'claude-haiku-4-5-20251001',
    messages: [{ role: 'user', content: 'Reply with just "ok".' }],
    maxTokens: 16,
  })
  const text = res.content.find(b => b.type === 'text')
  return text && text.type === 'text' ? text.text : ''
}