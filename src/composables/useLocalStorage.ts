import type { PageComponent, PageSettings } from '@/types'

const STORAGE_KEY = 'page-forge-data'
const SAVE_DELAY = 500

let saveTimer: ReturnType<typeof setTimeout> | null = null

/**
 * localStorage 持久化 —— 防抖保存/加载/清除
 * 刷新页面后从浏览器恢复上次编辑状态
 */
export function useLocalStorage() {
  function save(components: PageComponent[], pageSettings: PageSettings) {
    const data = { components, pageSettings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function saveDebounced(components: PageComponent[], pageSettings: PageSettings) {
    const data = {
      components: JSON.parse(JSON.stringify(components)),
      pageSettings: JSON.parse(JSON.stringify(pageSettings)),
    }
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      saveTimer = null
    }, SAVE_DELAY)
  }

  function flushSave(components: PageComponent[], pageSettings: PageSettings) {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    save(components, pageSettings)
  }

  function load(): { components: PageComponent[]; pageSettings: PageSettings } | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  function clear() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    localStorage.removeItem(STORAGE_KEY)
  }

  return { save, saveDebounced, flushSave, load, clear }
}
