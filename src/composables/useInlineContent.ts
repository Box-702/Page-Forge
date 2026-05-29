import { useBuilderStore } from '@/stores/builder'
import { useHistory } from './useHistory'
import type { PageComponent } from '@/types'

export function useInlineContent(getComponent: () => PageComponent) {
  const store = useBuilderStore()
  const { pushSnapshot } = useHistory()

  function updateField(key: string, value: string) {
    const component = getComponent()
    store.updateComponent(component.id, {
      content: { ...component.content, [key]: value },
    })
  }

  function updateArrayItem(arrayKey: string, index: number, key: string, value: string) {
    const component = getComponent()
    const list = [...(component.content[arrayKey] || [])]
    list[index] = { ...list[index], [key]: value }
    store.updateComponent(component.id, {
      content: { ...component.content, [arrayKey]: list },
    })
  }

  function updateNestedArrayItem(arrayKey: string, index: number, nestedKey: string, nestedIndex: number, value: string) {
    const component = getComponent()
    const list = [...(component.content[arrayKey] || [])]
    const item = { ...list[index] }
    const nested = [...(item[nestedKey] || [])]
    nested[nestedIndex] = value
    item[nestedKey] = nested
    list[index] = item
    store.updateComponent(component.id, {
      content: { ...component.content, [arrayKey]: list },
    })
  }

  return { updateField, updateArrayItem, updateNestedArrayItem, commitInlineEdit: pushSnapshot }
}
