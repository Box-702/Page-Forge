import type { PageComponent } from '@/types'
import { useBuilderStore } from '@/stores/builder'
import { useHistory } from './useHistory'
import { createDefaultFor } from '@/utils/defaults'
import { findComponent } from '@/utils/treeHelpers'
import { getRowColumns, normalizeRowComponent } from '@/utils/rowColumns'

export function useBuilder() {
  const store = useBuilderStore()
  const { pushSnapshot } = useHistory()

  function add(type: string) {
    if (store.rowInsertTarget) {
      addToRow(store.rowInsertTarget.rowId, type, store.rowInsertTarget.columnId)
      store.rowInsertTarget = null
      return
    }

    const selected = store.selectedComponent
    if (selected?.type === 'row') {
      addToRow(selected.id, type)
      return
    }

    const component = createDefaultFor(type)
    if (!component) return
    store.addComponent(normalizeRowComponent(component))
    pushSnapshot()
  }

  function addToRow(rowId: string, type: string, columnId?: string) {
    const component = createDefaultFor(type)
    if (!component) return

    const row = findComponent(store.components, rowId)
    if (!row || row.type !== 'row') return

    const normalized = normalizeRowComponent(row)
    const columns = getRowColumns(normalized)
    const targetColumnId = columnId || columns.reduce((min, item) =>
      item.children.length < min.children.length ? item : min
    ).id

    store.updateComponent(rowId, {
      content: {
        ...normalized.content,
        columns: columns.map((column) => column.id === targetColumnId
          ? { ...column, children: [...column.children, normalizeRowComponent(component)] }
          : column
        ),
        columnCount: columns.length,
      },
      children: undefined,
    })
    pushSnapshot()
  }

  function remove(id: string) {
    store.removeComponent(id)
    pushSnapshot()
  }

  function duplicate(id: string) {
    store.duplicateComponent(id)
    pushSnapshot()
  }

  function select(id: string | null) {
    store.selectComponent(id)
  }

  function update(id: string, patch: Partial<PageComponent>) {
    store.updateComponent(id, patch)
  }

  return { add, addToRow, remove, duplicate, select, update, pushSnapshot }
}
