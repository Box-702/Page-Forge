import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PageComponent, PageSettings, HistoryEntry } from '@/types'
import { cloneComponentWithNewIds, findComponent, removeComponent as treeRemove, updateInTree } from '@/utils/treeHelpers'
import { normalizeRowComponent } from '@/utils/rowColumns'

export const useBuilderStore = defineStore('builder', () => {
  // ========== 核心数据 ==========
  const components = ref<PageComponent[]>([])
  const pageSettings = ref<PageSettings>({
    primaryColor: '#3b82f6',
    accentColor: '#0f172a',
    surfaceColor: '#ffffff',
    textColor: '#111827',
    fontFamily: 'system-ui, sans-serif',
    backgroundColor: '#ffffff',
    title: 'Landing Page',
    description: 'A landing page built with Page Forge.',
  })
  const selectedId = ref<string | null>(null)
  const hoveredId = ref<string | null>(null)

  // ========== 撤销/重做 ==========
  const history = ref<HistoryEntry[]>([])
  const historyIndex = ref(-1)
  const MAX_HISTORY = 20

  // ========== UI 状态 ==========
  const isPreview = ref(false)
  const previewMode = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
  const showAddModal = ref(false)
  const showTemplateModal = ref(false)
  const showCheckPanel = ref(false)
  const showProjectModal = ref(false)
  const rowInsertTarget = ref<{ rowId: string; columnId: string } | null>(null)
  const sidebarTab = ref<'content' | 'style' | 'page'>('content')

  // ========== Getters ==========

  /** 递归搜索顶层及嵌套 children */
  const selectedComponent = computed(() =>
    selectedId.value ? findComponent(components.value, selectedId.value) : null
  )
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  // ========== 组件操作 ==========

  function selectComponent(id: string | null) {
    selectedId.value = id
  }

  function addComponent(component: PageComponent) {
    components.value.push(normalizeRowComponent(component))
  }

  /** 递归替换组件，生成新数组触发 Vue 响应（支持嵌套 children） */
  function updateComponent(id: string, patch: Partial<PageComponent>) {
    components.value = updateInTree(components.value, id, patch)
  }

  /** 递归删除组件 */
  function removeComponent(id: string) {
    components.value = treeRemove(components.value, id)
    if (selectedId.value === id) selectedId.value = null
  }

  function reorderComponents(newOrder: PageComponent[]) {
    components.value = newOrder
  }

  function updatePageSettings(patch: Partial<PageSettings>) {
    pageSettings.value = { ...pageSettings.value, ...patch }
  }

  /** 复制组件（递归查找源，深拷贝 + 新 UUID） */
  function duplicateComponent(id: string) {
    const comp = findComponent(components.value, id)
    if (comp) {
      const clone = cloneComponentWithNewIds(comp)
      components.value.push(clone)
    }
  }

  // ========== 历史操作 ==========

  function saveHistory() {
    const snapshot: HistoryEntry = {
      components: JSON.parse(JSON.stringify(components.value)),
      pageSettings: JSON.parse(JSON.stringify(pageSettings.value)),
    }
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(snapshot)
    if (history.value.length > MAX_HISTORY) history.value.shift()
    historyIndex.value = history.value.length - 1
  }

  function undo() {
    if (!canUndo.value) return
    historyIndex.value--
    const snapshot = history.value[historyIndex.value]
    components.value = JSON.parse(JSON.stringify(snapshot.components))
    pageSettings.value = JSON.parse(JSON.stringify(snapshot.pageSettings))
  }

  function redo() {
    if (!canRedo.value) return
    historyIndex.value++
    const snapshot = history.value[historyIndex.value]
    components.value = JSON.parse(JSON.stringify(snapshot.components))
    pageSettings.value = JSON.parse(JSON.stringify(snapshot.pageSettings))
  }

  // ========== 持久化 ==========

  function loadFromStorage(data: { components: PageComponent[]; pageSettings: PageSettings }) {
    components.value = data.components.map(normalizeRowComponent)
    pageSettings.value = { ...pageSettings.value, ...data.pageSettings }
  }

  function replaceProject(data: { components: PageComponent[]; pageSettings: PageSettings }) {
    components.value = data.components.map(normalizeRowComponent)
    pageSettings.value = { ...pageSettings.value, ...data.pageSettings }
    selectedId.value = null
    hoveredId.value = null
    history.value = []
    historyIndex.value = -1
    saveHistory()
  }

  return {
    components, pageSettings, selectedId, hoveredId,
    history, historyIndex, MAX_HISTORY,
    isPreview, previewMode, showAddModal, showTemplateModal, showCheckPanel, showProjectModal, rowInsertTarget, sidebarTab,
    selectedComponent, canUndo, canRedo,
    selectComponent, addComponent, updateComponent, removeComponent,
    duplicateComponent, reorderComponents, updatePageSettings,
    saveHistory, undo, redo,
    loadFromStorage, replaceProject,
  }
})
