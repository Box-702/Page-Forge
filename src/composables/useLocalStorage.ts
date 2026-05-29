import type { PageComponent, PageSettings } from '@/types'

const STORAGE_KEY = 'page-forge-data'

/**
 * localStorage 持久化 —— 自动保存/加载/清除
 * 刷新页面后从浏览器恢复上次编辑状态
 */
export function useLocalStorage() {
  function save(components: PageComponent[], pageSettings: PageSettings) {
    const data = { components, pageSettings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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
    localStorage.removeItem(STORAGE_KEY)
  }

  return { save, load, clear }
}
