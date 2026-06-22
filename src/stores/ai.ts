import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AISettings } from '@/ai/types'
import { fetchHealth } from '@/ai/settings'

export const useAIStore = defineStore('ai', () => {
  // 客户端不再存储 key;保留空 settings 兼容旧 API。
  const settings = ref<AISettings>({})

  const anthropicReady = ref(false)
  const stabilityReady = ref(false)
  const backendReachable = ref(false)
  const lastCheckedAt = ref<number | null>(null)
  let inflight: Promise<void> | null = null

  async function refresh(force = false): Promise<void> {
    if (inflight && !force) return inflight
    inflight = (async () => {
      const h = await fetchHealth()
      anthropicReady.value = h.anthropic
      stabilityReady.value = h.stability
      backendReachable.value = true
      lastCheckedAt.value = Date.now()
    })().catch(() => {
      anthropicReady.value = false
      stabilityReady.value = false
      backendReachable.value = false
      lastCheckedAt.value = Date.now()
    })
    return inflight
  }

  function updateSettings(_patch: Partial<AISettings>) {
    // no-op: key lives on server
  }

  function clearKeys() {
    // no-op
  }

  const anthropicReadyComputed = computed(() => anthropicReady.value)
  const stabilityReadyComputed = computed(() => stabilityReady.value)

  return {
    settings,
    anthropicReady: anthropicReadyComputed,
    stabilityReady: stabilityReadyComputed,
    backendReachable,
    lastCheckedAt,
    refresh,
    updateSettings,
    clearKeys,
  }
})