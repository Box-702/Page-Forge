import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { MergedReview, PersonaReview } from '@/ai/reviewApi'

export interface AgentToolCall {
  id: string
  name: string
  input: any
  result?: { ok: boolean; data?: any; error?: string }
}

export type AgentCardPayload =
  | { kind: 'review'; review: MergedReview }
  | { kind: 'persona'; persona: PersonaReview }
  | { kind: 'variants'; variants: any[] }
  | { kind: 'diagnostics'; report: any }

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: AgentToolCall[]
  card?: AgentCardPayload
  pending?: boolean
}

export const useAgentStore = defineStore('agent', () => {
  const sessionId = ref<string | null>(null)
  const messages = shallowRef<AgentMessage[]>([])
  const isStreaming = ref(false)
  const error = ref<string | null>(null)
  const sessionExpired = ref(false)
  /** M5: 当前附加的文档(MD/TXT),作为后续 3-5 轮 context */
  const documentName = ref<string | null>(null)
  const documentText = ref<string | null>(null)

  function reset() {
    messages.value = []
    sessionId.value = null
    error.value = null
    sessionExpired.value = false
    documentName.value = null
    documentText.value = null
  }

  function pushUser(content: string) {
    messages.value = [...messages.value, { id: crypto.randomUUID(), role: 'user', content }]
  }

  function startAssistant() {
    const id = crypto.randomUUID()
    messages.value = [...messages.value, { id, role: 'assistant', content: '', pending: true }]
    return id
  }

  function appendAssistantDelta(id: string, delta: string) {
    messages.value = messages.value.map((m) =>
      m.id === id ? { ...m, content: m.content + delta } : m,
    )
  }

  function finishAssistant(id: string, toolCalls: AgentToolCall[] = []) {
    messages.value = messages.value.map((m) =>
      m.id === id ? { ...m, pending: false, toolCalls } : m,
    )
  }

  return {
    sessionId,
    messages,
    isStreaming,
    error,
    sessionExpired,
    documentName,
    documentText,
    reset,
    pushUser,
    startAssistant,
    appendAssistantDelta,
    finishAssistant,
  }
})
