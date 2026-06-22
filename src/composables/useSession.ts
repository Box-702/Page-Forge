import { ref } from 'vue'

const STORAGE_KEY = 'page-forge-agent-session'

const currentSessionId = ref<string | null>(loadSessionId())

function loadSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function persist(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

export function useSession() {
  async function newSession(): Promise<string> {
    const res = await fetch('/api/agent/session/new', { method: 'POST' })
    const data = await res.json() as { ok: boolean; sessionId: string }
    if (!data.ok) throw new Error('无法创建会话')
    currentSessionId.value = data.sessionId
    persist(data.sessionId)
    return data.sessionId
  }

  async function probe(): Promise<boolean> {
    if (!currentSessionId.value) return false
    try {
      const res = await fetch(`/api/agent/session?id=${encodeURIComponent(currentSessionId.value)}`)
      const data = await res.json() as { ok: boolean }
      return data.ok
    } catch {
      return false
    }
  }

  function reset() {
    currentSessionId.value = null
    persist(null)
  }

  return {
    currentSessionId,
    newSession,
    probe,
    reset,
  }
}