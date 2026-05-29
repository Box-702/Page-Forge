import type { PageComponent, RowColumn } from '@/types'
import { getRowColumns, normalizeRowComponent } from './rowColumns'

export function findComponent(components: PageComponent[], id: string): PageComponent | null {
  for (const component of components) {
    const normalized = normalizeRowComponent(component)
    if (normalized.id === id) return normalized

    for (const child of getNestedChildren(normalized)) {
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
    const normalized = normalizeRowComponent(component)
    if (normalized.id === id) return { ...normalized, ...patch }
    return mapNestedChildren(normalized, (children) => updateInTree(children, id, patch))
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
    return getRowColumns(component).flatMap((column) => column.children)
  }
  return component.children || []
}

function mapNestedChildren(
  component: PageComponent,
  mapper: (children: PageComponent[]) => PageComponent[]
): PageComponent {
  const normalized = normalizeRowComponent(component)
  if (normalized.type === 'row') {
    const columns: RowColumn[] = getRowColumns(normalized).map((column) => ({
      ...column,
      children: mapper(column.children),
    }))
    return {
      ...normalized,
      children: undefined,
      content: { ...normalized.content, columns, columnCount: columns.length },
    }
  }

  if (!normalized.children) return normalized
  return { ...normalized, children: mapper(normalized.children) }
}
