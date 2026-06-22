import { ref, shallowRef } from 'vue'
import type { Ref } from 'vue'
import type { ClaudeMessage, ClaudeTool } from '@/ai/types'

export interface AgentEvent {
  type:
    | 'text_delta'
    | 'tool_use_start'
    | 'tool_use'
    | 'tool_input_delta'
    | 'message_end'
    | 'done'
    | 'error'
  text?: string
  id?: string
  name?: string
  input?: any
  partial?: string
  stop_reason?: string | null
  usage?: { input_tokens: number; output_tokens: number } | null
  message?: string
}

export interface AgentStreamHandle {
  isStreaming: Ref<boolean>
  streamingText: Ref<string>
  events: Ref<AgentEvent[]>
  error: Ref<string | null>
  abort: () => void
  send: (params: {
    system?: string
    messages: ClaudeMessage[]
    tools?: ClaudeTool[]
    tool_choice?: any
    maxTokens?: number
  }) => Promise<void>
}

export function useAgentStream(): AgentStreamHandle {
  const isStreaming = ref(false)
  const streamingText = ref('')
  const events = shallowRef<AgentEvent[]>([])
  const error = ref<string | null>(null)
  let abortCtrl: AbortController | null = null

  function abort() {
    if (abortCtrl) {
      abortCtrl.abort()
      abortCtrl = null
    }
    isStreaming.value = false
  }

  async function send(params: {
    system?: string
    messages: ClaudeMessage[]
    tools?: ClaudeTool[]
    tool_choice?: any
    maxTokens?: number
  }): Promise<void> {
    isStreaming.value = true
    streamingText.value = ''
    events.value = []
    error.value = null
    abortCtrl = new AbortController()

    try {
      const res = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          system: params.system,
          messages: params.messages,
          tools: params.tools,
          tool_choice: params.tool_choice,
          maxTokens: params.maxTokens,
        }),
        signal: abortCtrl.signal,
      })

      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => '')
        throw new Error(`代理返回 ${res.status}: ${txt.slice(0, 200)}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buf = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })

        // SSE frames are separated by \n\n; parse one or more frames in the buffer.
        let idx: number
        while ((idx = buf.indexOf('\n\n')) !== -1) {
          const frame = buf.slice(0, idx)
          buf = buf.slice(idx + 2)
          const evt = parseFrame(frame)
          if (!evt) continue
          events.value = [...events.value, evt]
          if (evt.type === 'text_delta' && evt.text) {
            streamingText.value += evt.text
          } else if (evt.type === 'error') {
            throw new Error(evt.message ?? '流错误')
          } else if (evt.type === 'done') {
            return
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        // 用户主动取消,不算错
      } else {
        error.value = (e as Error).message
      }
    } finally {
      isStreaming.value = false
    }
  }

  return { isStreaming, streamingText, events, error, abort, send }
}

function parseFrame(frame: string): AgentEvent | null {
  let eventName = 'message'
  let dataLine = ''
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLine += line.slice(5).trim()
  }
  if (!dataLine) return null
  try {
    const parsed = JSON.parse(dataLine)
    return { ...parsed, type: parsed.type ?? eventName } as AgentEvent
  } catch {
    return null
  }
}