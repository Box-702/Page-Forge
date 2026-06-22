import { Injectable } from '@nestjs/common'

export type Severity = 'high' | 'medium' | 'low'

export interface DiagnosticIssue {
  severity: Severity
  category: 'image-alt' | 'heading' | 'meta' | 'cta' | 'decor' | 'placeholder' | 'accessibility'
  blockId?: string
  blockType?: string
  message: string
  /** 自动修复方案描述,或 'manual' 表示需要用户手改 */
  fix: string
  /** 是否可一键修复(自动 apply) */
  autoFixable: boolean
}

export interface DiagnosticReport {
  totalIssues: number
  highCount: number
  mediumCount: number
  lowCount: number
  issues: DiagnosticIssue[]
  /** 健康摘要,1-2 句 */
  summary: string
}

const WEAK_CTA_PATTERNS = [
  /了解更多$/, /learn more$/i, /submit$/i, /click here$/i, /点这里$/,
  /更多$/, /read more$/i, /see more$/i, /查看更多$/, /了解$/, /go$/i,
]

const PLACEHOLDER_PATTERNS = [
  /^landing page$/i,
  /^copyright \d{4} page forge/i,
  /^company name$/i,
]

@Injectable()
export class DiagnosticsService {
  /**
   * 在服务端纯静态分析页面结构和 PageSettings。
   * 不调 LLM —— 全部是 deterministic 检查。
   */
  run(page: {
    pageSettings: Record<string, any>
    components: Array<{ id: string; type: string; content?: any; styles?: any }>
  }): DiagnosticReport {
    const issues: DiagnosticIssue[] = []

    this.checkMeta(page.pageSettings, issues)
    this.checkHeadings(page.components, issues)
    this.checkImages(page.components, issues)
    this.checkCtas(page.components, issues)
    this.checkDecorationDensity(page.components, issues)
    this.checkPlaceholders(page.pageSettings, page.components, issues)

    const highCount = issues.filter((i) => i.severity === 'high').length
    const mediumCount = issues.filter((i) => i.severity === 'medium').length
    const lowCount = issues.filter((i) => i.severity === 'low').length

    const summary = highCount > 0
      ? `发现 ${highCount} 个严重问题(影响 SEO/可访问性),建议优先修复。`
      : mediumCount > 0
        ? `无严重问题,但有 ${mediumCount} 个建议改进项。`
        : issues.length > 0
          ? `整体不错,还有 ${issues.length} 个小优化点。`
          : '✓ 未发现明显问题。'

    return {
      totalIssues: issues.length,
      highCount, mediumCount, lowCount,
      issues,
      summary,
    }
  }

  private checkMeta(settings: Record<string, any>, issues: DiagnosticIssue[]) {
    if (!settings.title || settings.title.trim() === '' || settings.title === 'Landing Page') {
      issues.push({
        severity: 'high',
        category: 'meta',
        message: '页面 title 为空或仍是默认"Landing Page",搜索引擎和社交分享都会看不到有意义的标题。',
        fix: 'manual',
        autoFixable: false,
      })
    } else if (settings.title.length > 60) {
      issues.push({
        severity: 'medium',
        category: 'meta',
        message: `页面 title 长度 ${settings.title.length} 字符,超过 SEO 建议的 60 字符上限,搜索引擎会截断。`,
        fix: '请把 title 压缩到 50-60 字符',
        autoFixable: true,
      })
    }

    if (!settings.description || settings.description.trim() === '') {
      issues.push({
        severity: 'high',
        category: 'meta',
        message: '缺少页面 description meta,会影响搜索摘要和 OG 卡片。',
        fix: 'manual',
        autoFixable: false,
      })
    } else if (settings.description.length > 160) {
      issues.push({
        severity: 'low',
        category: 'meta',
        message: `description 长度 ${settings.description.length} 字符,建议压缩到 150-160 字符。`,
        fix: '请缩短描述',
        autoFixable: false,
      })
    } else if (settings.description.length < 50) {
      issues.push({
        severity: 'low',
        category: 'meta',
        message: `description 仅 ${settings.description.length} 字符,建议补充到 80+ 让搜索摘要更丰富。`,
        fix: '请补充 description 内容',
        autoFixable: false,
      })
    }

    if (!settings.ogImage) {
      issues.push({
        severity: 'medium',
        category: 'meta',
        message: '没有 og:image,社交分享时不会显示封面图。',
        fix: 'manual',
        autoFixable: false,
      })
    }

    if (!settings.faviconUrl) {
      issues.push({
        severity: 'low',
        category: 'meta',
        message: '未设置 faviconUrl,浏览器标签页会显示默认图标。',
        fix: 'manual',
        autoFixable: false,
      })
    }
  }

  private checkHeadings(components: Array<{ id: string; type: string; content?: any }>, issues: DiagnosticIssue[]) {
    const h1Count = components.filter((c) => c.type === 'hero').length
    if (h1Count === 0) {
      issues.push({
        severity: 'high',
        category: 'heading',
        message: '页面没有 hero block,因此没有 H1。SEO 需要页面有且仅有一个 H1。',
        fix: '添加一个 hero block',
        autoFixable: true,
      })
    } else if (h1Count > 1) {
      issues.push({
        severity: 'medium',
        category: 'heading',
        message: `页面有 ${h1Count} 个 hero,每个 hero 用 H1 标签,会导致多个 H1(影响 SEO 和可访问性)。`,
        fix: '保留一个 hero 作为 H1,其余 hero 改为 H2',
        autoFixable: true,
      })
    }
    const faqBlocks = components.filter((c) => c.type === 'faq')
    for (const f of faqBlocks) {
      issues.push({
        severity: 'medium',
        category: 'heading',
        blockId: f.id,
        blockType: 'faq',
        message: 'FAQ block 的标题目前用 H1,应该改为 H2(页面只能有一个 H1)。',
        fix: '将 FAQ 标题标签从 H1 改为 H2',
        autoFixable: false,
      })
    }
  }

  private checkImages(components: Array<{ id: string; type: string; content?: any; styles?: any }>, issues: DiagnosticIssue[]) {
    components.forEach((c) => {
      const imgUrls: Array<{ url: string; blockId: string; blockType: string; context: string }> = []
      if (c.type === 'hero' && c.content?.imageUrl) {
        imgUrls.push({ url: c.content.imageUrl, blockId: c.id, blockType: c.type, context: 'hero 主图' })
      }
      if (c.type === 'testimonials') {
        (c.content?.testimonials || []).forEach((t: any, i: number) => {
          if (t.avatarUrl) imgUrls.push({ url: t.avatarUrl, blockId: c.id, blockType: c.type, context: `头像 #${i + 1}(${t.name || ''})` })
        })
      }
      if (c.content?.features) {
        (c.content.features || []).forEach((f: any, i: number) => {
          if (f.icon && /^https?:\/\//.test(f.icon)) {
            imgUrls.push({ url: f.icon, blockId: c.id, blockType: c.type, context: `图标 #${i + 1}` })
          }
        })
      }
      if (c.styles?.bgImage) {
        imgUrls.push({ url: c.styles.bgImage, blockId: c.id, blockType: c.type, context: 'block 背景图' })
      }
      for (const img of imgUrls) {
        issues.push({
          severity: 'low',
          category: 'image-alt',
          blockId: img.blockId,
          blockType: img.blockType,
          message: `${img.context}有图片(${img.url.slice(0, 40)}…)但当前数据模型没有 alt 字段。导出时浏览器会显示空 alt,影响可访问性。`,
          fix: '在导出 HTML 时为该图加 alt(目前用 block 标题作为 fallback)',
          autoFixable: false,
        })
      }
    })
  }

  private checkCtas(components: Array<{ id: string; type: string; content?: any }>, issues: DiagnosticIssue[]) {
    components.forEach((c) => {
      const ctas: Array<{ text: string; blockId: string; blockType: string }> = []
      if (c.type === 'hero' && c.content?.ctaText) {
        ctas.push({ text: c.content.ctaText, blockId: c.id, blockType: c.type })
      }
      if (c.type === 'cta' && c.content?.ctaText) {
        ctas.push({ text: c.content.ctaText, blockId: c.id, blockType: c.type })
      }
      if (c.type === 'pricing') {
        (c.content?.plans || []).forEach((p: any, i: number) => {
          if (p.ctaText) ctas.push({ text: p.ctaText, blockId: c.id, blockType: c.type })
        })
      }
      for (const cta of ctas) {
        if (WEAK_CTA_PATTERNS.some((re) => re.test(cta.text.trim()))) {
          issues.push({
            severity: 'medium',
            category: 'cta',
            blockId: cta.blockId,
            blockType: cta.blockType,
            message: `CTA 文案「${cta.text}」偏弱。"了解更多/Submit" 等不告诉用户会发生什么,转化率低。`,
            fix: '把 CTA 改成具体动词,例:"免费试 14 天"、"查看价格"',
            autoFixable: true,
          })
        }
      }
    })
  }

  private checkDecorationDensity(components: Array<{ id: string; type: string; styles?: any }>, issues: DiagnosticIssue[]) {
    if (components.length === 0) return
    const decorated = components.filter((c) =>
      c.styles?.decoration && c.styles.decoration !== 'none',
    ).length
    const withBgImage = components.filter((c) => c.styles?.bgImage).length
    const ratio = (decorated + withBgImage) / components.length
    if (ratio > 0.5) {
      issues.push({
        severity: 'low',
        category: 'decor',
        message: `${Math.round(ratio * 100)}% 的 block 用了装饰元素或背景图,可能视觉过载。建议减少到 30% 以下。`,
        fix: '保留 hero 和一个其他 block 的装饰,其余去掉',
        autoFixable: false,
      })
    }
  }

  private checkPlaceholders(settings: Record<string, any>, components: Array<{ id: string; type: string; content?: any }>, issues: DiagnosticIssue[]) {
    if (PLACEHOLDER_PATTERNS.some((re) => re.test(settings.title || ''))) {
      issues.push({
        severity: 'medium',
        category: 'placeholder',
        message: `页面 title「${settings.title}」仍是默认占位符,发布前必须替换。`,
        fix: '请填写真实的页面标题',
        autoFixable: false,
      })
    }
    for (const c of components) {
      if (c.type === 'footer') {
        const copyright = c.content?.copyright || ''
        if (PLACEHOLDER_PATTERNS.some((re) => re.test(copyright))) {
          issues.push({
            severity: 'medium',
            category: 'placeholder',
            blockId: c.id,
            blockType: 'footer',
            message: `footer copyright「${copyright}」是默认占位符,需替换成真实公司名。`,
            fix: '请填写真实的公司名',
            autoFixable: false,
          })
        }
        const companyName = c.content?.companyName || ''
        if (companyName === 'Page Forge' || companyName === '') {
          issues.push({
            severity: 'medium',
            category: 'placeholder',
            blockId: c.id,
            blockType: 'footer',
            message: `footer 公司名「${companyName}」是默认或空的,需替换。`,
            fix: '请填写真实的公司名',
            autoFixable: false,
          })
        }
      }
    }
  }
}
