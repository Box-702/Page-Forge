import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useHistory } from './useHistory'

export function useEditor() {
  const store = useBuilderStore()
  const { pushSnapshot } = useHistory()
  const content = computed(() => store.selectedComponent?.content ?? {})
  let snapshotTimer: ReturnType<typeof setTimeout> | null = null

  function set(key: string, value: any) {
    if (!store.selectedId) return
    store.updateComponent(store.selectedId, {
      content: { ...content.value, [key]: value },
    })
    scheduleSnapshot()
  }

  function scheduleSnapshot() {
    if (snapshotTimer) clearTimeout(snapshotTimer)
    snapshotTimer = setTimeout(() => pushSnapshot(), 300)
  }

  return { content, set }
}
