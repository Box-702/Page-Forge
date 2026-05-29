import type { PageComponent, PageSettings } from '@/types'
import { getRowColumns, normalizeRowComponent } from './rowColumns'
import { isSafeAssetUrl, isSafeLinkUrl } from './urlGuards'

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
  if (settings.ogImage && !isSafeAssetUrl(settings.ogImage)) {
    issues.push({ level: 'error', title: '社交分享图地址存在风险', detail: '社交分享图只允许 http、https、相对路径或常见 base64 图片。' })
  }
  if (settings.faviconUrl && !isSafeAssetUrl(settings.faviconUrl)) {
    issues.push({ level: 'error', title: 'Favicon 地址存在风险', detail: 'Favicon 只允许 http、https、相对路径或常见 base64 图片。' })
  }

  walkComponents(components, (component) => {
    if (component.type === 'hero' && !component.content.title?.trim()) {
      issues.push({ level: 'error', title: 'Hero 缺少标题', detail: '首屏标题为空会明显降低页面可读性。' })
    }
    if ((component.content.ctaText || '').trim() && !isSafeLinkUrl(component.content.ctaLink || '#')) {
      issues.push({ level: 'error', title: '按钮链接存在风险', detail: `${component.type} 区块的按钮链接只允许 http、https、mailto、tel、锚点或相对路径。` })
    }
    if (component.content.imageUrl && !isSafeAssetUrl(component.content.imageUrl)) {
      issues.push({ level: 'error', title: '图片地址存在风险', detail: `${component.type} 区块的图片地址只允许 http、https、相对路径或常见 base64 图片。` })
    }
    if (component.styles.bgImage && !isSafeAssetUrl(component.styles.bgImage)) {
      issues.push({ level: 'error', title: '背景图片地址存在风险', detail: `${component.type} 区块的背景图片地址只允许 http、https、相对路径或常见 base64 图片。` })
    }
    if (component.type === 'testimonials') {
      const invalidAvatar = (component.content.testimonials || []).some((item: any) =>
        item.avatarUrl && !isSafeAssetUrl(item.avatarUrl)
      )
      if (invalidAvatar) {
        issues.push({ level: 'error', title: '头像地址存在风险', detail: 'Testimonials 区块的头像地址只允许 http、https、相对路径或常见 base64 图片。' })
      }
    }
    if (component.type === 'footer') {
      const invalidLink = (component.content.links || []).some((item: any) =>
        item.url && !isSafeLinkUrl(item.url)
      )
      if (invalidLink) {
        issues.push({ level: 'error', title: '页脚链接存在风险', detail: 'Footer 区块链接只允许 http、https、mailto、tel、锚点或相对路径。' })
      }
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
