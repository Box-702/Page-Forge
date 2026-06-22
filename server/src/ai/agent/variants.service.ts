import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import { BLOCK_GUIDE_TEXT } from './prompts/blockGuide'

export interface VariantSummary {
  id: string
  strategy: 'conversion' | 'trust' | 'feature'
  name: string
  rationale: string
  primaryColor: string
  blockTypes: string[]
  blockTitles: string[]
}

export interface VariantsResponseDto {
  variants: VariantSummary[]
}

@Injectable()
export class VariantsService {
  private readonly logger = new Logger(VariantsService.name)
  private readonly client: Anthropic | null

  constructor(config: ConfigService) {
    const key = config.get<string>('ANTHROPIC_API_KEY')?.trim()
    this.client = key && key.startsWith('sk-ant-') ? new Anthropic({ apiKey: key }) : null
    if (!this.client) this.logger.warn('VariantsService disabled: ANTHROPIC_API_KEY not configured.')
  }

  isConfigured(): boolean { return !!this.client }

  async generate(brief: string, currentPage?: { title?: string; blockCount?: number; blockTypes?: string[] }): Promise<VariantSummary[]> {
    if (!this.client) throw new Error('后端 ANTHROPIC_API_KEY 未配置')

    const sys = `你是 Page Forge 的 A/B 测试变体设计专家。给定一个落地页需求,生成 3 个不同策略的变体。
每个变体在信息架构、配色、文案风格、CTA 强度上应有显著差异,以便 A/B 测试对比效果。

${BLOCK_GUIDE_TEXT}

输出严格的 JSON,字段:
{
  "variants": [
    {
      "id": "v1",
      "strategy": "conversion" | "trust" | "feature",
      "name": "<3-6 字短名,例 '转化速胜版'>",
      "rationale": "<1-2 句话说明这个变体的核心策略>",
      "primaryColor": "<#hex 主色>",
      "blockTypes": ["hero", "features", ...],
      "blockTitles": ["block title 或 companyName", ...]
    }
    // 3 个变体,strategy 各不相同
  ]
}

约束:
- 3 个变体的 strategy 必须是 conversion / trust / feature 各一个
- 每个变体 5-7 个 block
- blockTypes 必须是有效类型
- blockTitles 是该变体每个 block 的"主要文本"(hero.title / faq 留空等)
- 主色应是不同色系(conversion 偏强对比橙/红,trust 偏稳蓝绿,feature 偏信息蓝紫)
- 输出只含 JSON,不要解释、不要 markdown`

    const userContent = currentPage?.blockCount
      ? `当前用户已有 ${currentPage.blockCount} 个 block (类型: ${(currentPage.blockTypes ?? []).join(', ')}),标题: ${currentPage.title ?? '(无)'}\n\n用户想要的变体方向:${brief}`
      : `落地页需求:${brief}`

    const res = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: sys,
      messages: [{ role: 'user', content: userContent as any }],
    })

    const text = (res.content as any[]).find((b: any) => b?.type === 'text')
    if (!text) throw new Error('Claude 未返回 text 块')

    const parsed = parseJsonLoose<{ variants: VariantSummary[] }>(text.text ?? '')
    // 兜底:确保 3 个 strategy 各占其一
    const strategies = ['conversion', 'trust', 'feature'] as const
    const seen = new Set(parsed.variants?.map((v) => v.strategy) ?? [])
    if (!strategies.every((s) => seen.has(s)) || !parsed.variants || parsed.variants.length < 3) {
      throw new Error('变体生成不完整,需要 3 个不同 strategy')
    }
    return parsed.variants.slice(0, 3)
  }

  /**
   * 真正生成 3 个完整 ProjectData(不是摘要)。从摘要展开,让 Claude 再调一次。
   * 这是重活,v1 简化:基于变体摘要,只把 block 列表+主色填到 ProjectData shape,
   * 不调第二次 LLM(成本考虑)。每个变体 block 内容用 placeholder。
   */
  expand(variant: VariantSummary, brief: string): any {
    const blockTypes = variant.blockTypes.length > 0
      ? variant.blockTypes
      : ['hero', 'features', 'pricing', 'cta', 'footer']
    const blocks = blockTypes.map((type, i) => {
      const id = `v_${variant.id}_${i}_${Math.random().toString(36).slice(2, 6)}`
      const title = variant.blockTitles[i] ?? `${type} 标题`
      return buildPlaceholderBlock(type, id, title, variant.primaryColor, brief)
    })
    return {
      pageSettings: {
        primaryColor: variant.primaryColor,
        accentColor: '#0f172a',
        surfaceColor: '#ffffff',
        textColor: '#111827',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#ffffff',
        title: variant.name,
        description: variant.rationale,
      },
      components: blocks,
    }
  }
}

function buildPlaceholderBlock(type: string, id: string, title: string, primary: string, brief: string): any {
  switch (type) {
    case 'hero':
      return {
        id, type, content: {
          title: title || brief.slice(0, 20) || '让产品更有说服力',
          subtitle: brief || '用一句话告诉访客:你为他们解决什么问题,带来什么收益',
          ctaText: '立即开始', ctaLink: '#', ctaVariant: 'primary', alignment: 'center', imageUrl: '',
        }, styles: { bgColor: '#ffffff', textAlign: 'text-center' },
      }
    case 'features':
      return {
        id, type, content: {
          title: title || '核心能力',
          subtitle: brief,
          columns: 3,
          features: [
            { id: `f${id}_1`, icon: '✦', title: '直观易用', description: '三步完成,无需培训。' },
            { id: `f${id}_2`, icon: '⚡', title: '高效稳定', description: '毫秒级响应,99.9% 可用。' },
            { id: `f${id}_3`, icon: '★', title: '值得信赖', description: '数千用户已经在用。' },
          ],
        }, styles: { bgColor: '#f9fafb' },
      }
    case 'pricing':
      return {
        id, type, content: {
          title: title || '价格方案',
          subtitle: brief,
          currency: '¥',
          plans: [
            { id: `p${id}_1`, name: '免费', price: '0', period: '/月', description: '个人体验', features: ['1 个项目', '基础功能'], highlighted: false, ctaText: '开始' },
            { id: `p${id}_2`, name: '专业', price: '99', period: '/月', description: '小团队', features: ['无限项目', '高级功能', '邮件支持'], highlighted: true, ctaText: '订阅' },
          ],
        }, styles: { bgColor: '#ffffff' },
      }
    case 'cta':
      return {
        id, type, content: {
          title: title || '准备好开始了吗?',
          subtitle: brief, ctaText: '免费试用', ctaLink: '#', ctaVariant: 'light',
        }, styles: { bgColor: primary, textColor: '#ffffff', textAlign: 'text-center' },
      }
    case 'testimonials':
      return {
        id, type, content: {
          title: title || '用户怎么说',
          subtitle: brief,
          columns: 3,
          testimonials: [
            { id: `t${id}_1`, quote: '用了之后效率翻倍。', name: '张明', title: '产品经理', avatarUrl: '' },
            { id: `t${id}_2`, quote: '我们团队的协作工具。', name: '李雷', title: '设计师', avatarUrl: '' },
            { id: `t${id}_3`, quote: '上手非常简单。', name: '王芳', title: '运营', avatarUrl: '' },
          ],
        }, styles: { bgColor: '#f9fafb' },
      }
    case 'faq':
      return {
        id, type, content: {
          title: title || '常见问题',
          subtitle: brief,
          faqs: [
            { id: `q${id}_1`, question: '如何开始?', answer: '注册账号即可,无需信用卡。' },
            { id: `q${id}_2`, question: '可以退款吗?', answer: '30 天内无条件退款。' },
          ],
        }, styles: { bgColor: '#ffffff' },
      }
    case 'footer':
      return {
        id, type, content: {
          companyName: title || 'Page Forge',
          description: brief,
          copyright: `Copyright 2026 ${title || 'Page Forge'}`,
          links: [
            { id: `l${id}_1`, title: '功能', url: '#' },
            { id: `l${id}_2`, title: '价格', url: '#' },
            { id: `l${id}_3`, title: '博客', url: '#' },
            { id: `l${id}_4`, title: '联系', url: '#' },
          ],
        }, styles: { bgColor: '#111827', textColor: '#ffffff' },
      }
    default:
      return {
        id, type, content: { title, description: brief }, styles: {},
      }
  }
}

function parseJsonLoose<T>(raw: string): T {
  try { return JSON.parse(raw) as T } catch { /* */ }
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return JSON.parse(raw.slice(start, end + 1)) as T
  }
  throw new Error('无法解析 Claude 返回的 JSON')
}
