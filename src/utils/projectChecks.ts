import type { PageComponent, PageSettings } from '@/types'
import { getRowColumns, normalizeRowComponent } from './rowColumns'

export interface ProjectIssue {
  level: 'error' | 'warning'
  title: string
  detail: string
}

export function validateProject(components: PageComponent[], settings: PageSettings): ProjectIssue[] {
  const issues: ProjectIssue[] = []

  if (!components.length) {
    issues.push({ level: 'error', title: '页面为空', detail: '至少添加一个区块后再导出。' })
  }
  if (!settings.title?.trim()) {
    issues.push({ level: 'warning', title: '缺少页面标题', detail: '页面标题会影响浏览器标签和搜索展示。' })
  }
  if (!settings.description?.trim()) {
    issues.push({ level: 'warning', title: '缺少页面描述', detail: '建议填写 80 到 160 字的页面描述。' })
  }

  walkComponents(components, (component) => {
    if (component.type === 'hero' && !component.content.title?.trim()) {
      issues.push({ level: 'error', title: 'Hero 缺少标题', detail: '首屏标题为空会明显降低页面可读性。' })
    }
    if ((component.content.ctaText || '').trim() && !isValidLink(component.content.ctaLink || '#')) {
      issues.push({ level: 'warning', title: '按钮链接可能无效', detail: `${component.type} 区块的按钮链接不是 URL、锚点或相对路径。` })
    }
    if (component.content.imageUrl && !isValidAssetUrl(component.content.imageUrl)) {
      issues.push({ level: 'warning', title: '图片地址可能无效', detail: `${component.type} 区块使用了无法识别的图片地址。` })
    }
    if (component.type === 'row') {
      const emptyColumns = getRowColumns(normalizeRowComponent(component)).filter((column) => column.children.length === 0).length
      if (emptyColumns) {
        issues.push({ level: 'warning', title: 'Row 存在空列', detail: `有 ${emptyColumns} 个空列，移动端和导出页面可能显得松散。` })
      }
    }
  })

  return issues
}

function walkComponents(components: PageComponent[], visitor: (component: PageComponent) => void) {
  components.forEach((component) => {
    const normalized = normalizeRowComponent(component)
    visitor(normalized)
    if (normalized.type === 'row') {
      getRowColumns(normalized).forEach((column) => walkComponents(column.children, visitor))
    } else if (normalized.children) {
      walkComponents(normalized.children, visitor)
    }
  })
}

function isValidLink(value: string): boolean {
  return value.startsWith('#') || value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('mailto:')
}

function isValidAssetUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/') || value.startsWith('data:image/')
}
