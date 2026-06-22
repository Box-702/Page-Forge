import type { PageComponent, RowColumn } from '@/types'
import { getRowColumns, normalizeRowComponent } from './rowColumns'

export function findComponent(components: PageComponent[], id: string): PageComponent | null {
  for (const component of components) {
    if (component.id === id) return component

    for (const child of getNestedChildren(component)) {
      const found = findComponent([child], id)
      if (found) return found
    }
  }
  return null
}

export function removeComponent(components: PageComponent[], id: string): PageComponent[] {
  return components
    .filter((component) => component.id !== id)
    .map((component) => mapNestedChildren(component, (children) => removeComponent(children, id)))
}

export function updateInTree(
  components: PageComponent[],
  id: string,
  patch: Partial<PageComponent>
): PageComponent[] {
  return components.map((component) => {
    if (component.id === id) return { ...component, ...patch }
    return mapNestedChildren(component, (children) => updateInTree(children, id, patch))
  })
}

export function cloneComponentWithNewIds(component: PageComponent): PageComponent {
  const normalized = normalizeRowComponent(component)
  const clone: PageComponent = {
    ...JSON.parse(JSON.stringify(normalized)),
    id: crypto.randomUUID(),
  }

  if (clone.type === 'row') {
    const columns = getRowColumns(clone).map((column) => ({
      ...column,
      id: crypto.randomUUID(),
      children: column.children.map(cloneComponentWithNewIds),
    }))
    return {
      ...clone,
      content: { ...clone.content, columns, columnCount: columns.length },
      children: undefined,
    }
  }

  if (clone.children) {
    clone.children = clone.children.map(cloneComponentWithNewIds)
  }
  return clone
}

function getNestedChildren(component: PageComponent): PageComponent[] {
  if (component.type === 'row') {
    const rowChildren: PageComponent[] = []
    const columns = component.content?.columns
    if (Array.isArray(columns)) {
      for (const column of columns) {
        if (Array.isArray(column.children)) rowChildren.push(...column.children)
      }
    }
    return rowChildren
  }
  return component.children || []
}

function mapNestedChildren(
  component: PageComponent,
  mapper: (children: PageComponent[]) => PageComponent[]
): PageComponent {
  if (component.type === 'row') {
    const raw = component.content?.columns as RowColumn[] | undefined
    const columns = (raw || []).map((column) => ({
      ...column,
      children: mapper(column.children || []),
    }))
    return { ...component, children: undefined, content: { ...component.content, columns } }
  }

  if (!component.children) return component
  return { ...component, children: mapper(component.children) }
}
