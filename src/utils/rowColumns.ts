import type { PageComponent, RowColumn } from '@/types'

const uid = () => crypto.randomUUID()

export function getRowColumns(component: PageComponent): RowColumn[] {
  const raw = component.content.columns as RowColumn[] | undefined
  if (raw?.length) return raw

  const count = Number(component.content.columnCount || 2)
  const widths = component.content.columnWidths as string[] | undefined
  const children = component.children || []
  const counts = getLegacyCounts(component, count)
  let offset = 0

  return Array.from({ length: count }, (_, index) => {
    const size = counts[index] || 0
    const columnChildren = children.slice(offset, offset + size)
    offset += size
    return {
      id: uid(),
      width: widths?.[index] || defaultWidth(count),
      children: columnChildren,
    }
  })
}

export function normalizeRowComponent(component: PageComponent): PageComponent {
  if (component.type !== 'row') return component
  const columns = getRowColumns(component)
  return {
    ...component,
    children: undefined,
    content: {
      ...component.content,
      columnCount: columns.length,
      columns,
    },
  }
}

export function resizeColumns(component: PageComponent, nextCount: number): RowColumn[] {
  const current = getRowColumns(component)
  if (nextCount === current.length) return current
  if (nextCount < current.length) {
    const kept = current.slice(0, nextCount)
    const overflow = current.slice(nextCount).flatMap((column) => column.children)
    kept[nextCount - 1] = {
      ...kept[nextCount - 1],
      children: [...kept[nextCount - 1].children, ...overflow],
    }
    return kept
  }

  return [
    ...current,
    ...Array.from({ length: nextCount - current.length }, () => ({
      id: uid(),
      width: defaultWidth(nextCount),
      children: [],
    })),
  ].map((column) => ({ ...column, width: defaultWidth(nextCount) }))
}

function getLegacyCounts(component: PageComponent, count: number): number[] {
  const savedCounts = component.content.columnItemCounts as number[] | undefined
  if (savedCounts?.length === count) return savedCounts

  const total = component.children?.length || 0
  const base = Math.floor(total / count)
  const rem = total % count
  return Array.from({ length: count }, (_, index) => base + (index < rem ? 1 : 0))
}

function defaultWidth(count: number): string {
  return `${Math.round(100 / count)}%`
}
