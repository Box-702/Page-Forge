import { useBuilderStore } from '@/stores/builder'
import { useLocalStorage } from './useLocalStorage'

/**
 * 撤销/重做 —— 快照 + 键盘快捷键
 * 操作入口：Ctrl+Z 撤销、Ctrl+Y（或 Ctrl+Shift+Z）重做
 */
export function useHistory() {
  const store = useBuilderStore()
  const { saveDebounced } = useLocalStorage()

  /** 创建快照并写入存储 —— 每次操作前调用 */
  function pushSnapshot() {
    store.saveHistory()
    saveDebounced(store.components, store.pageSettings)
  }

  /** 撤销一步，同步写回 storage */
  function handleUndo() {
    store.undo()
    saveDebounced(store.components, store.pageSettings)
  }

  /** 重做一步，同步写回 storage */
  function handleRedo() {
    store.redo()
    saveDebounced(store.components, store.pageSettings)
  }

  /** 全局键盘监听 —— 挂到 document keydown */
  function onKeydown(e: KeyboardEvent) {
    // Ctrl+Z（非 Shift）→ 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      handleUndo()
    }
    // Ctrl+Y 或 Ctrl+Shift+Z → 重做
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      handleRedo()
    }
  }

  return { pushSnapshot, handleUndo, handleRedo, onKeydown }
}
