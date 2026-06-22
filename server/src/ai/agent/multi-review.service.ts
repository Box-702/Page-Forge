import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import {
  REVIEW_RUBRIC,
  type MergedReview,
  type PersonaReview,
  type ReviewRubricItem,
} from './prompts/reviewRubric'

const RUBRIC_TEXT = REVIEW_RUBRIC
  .map((r) => `- [${r.category}] ${r.description}`)
  .join('\n')

interface BlockSummary {
  id: string
  type: string
  preview: string
}

interface PageContext {
  pageTitle?: string
  blocks: BlockSummary[]
}

interface SinglePersonaResult {
  persona: string
  feedback: string
  suggestions: Array<{
    category: ReviewRubricItem['category']
    blockId?: string
    blockType?: string
    issue: string
    suggestion: string
    priority: 'high' | 'medium' | 'low'
  }>
}

interface PersonaSpec {
  id: string
  name: string
  system: string
}

const PERSONAS: PersonaSpec[] = [
  {
    id: 'marketer',
    name: '营销专家',
    system: `你是 Page Forge 的资深营销转化专家,曾为 SaaS、电商、教育产品做高转化落地页。
你的视角:
- 用户从看到页面到决定行动只有几秒,任何模糊都意味着流失
- 关注漏斗:看到 → 理解 → 信任 → 行动,每个环节都要有钩子
- 你挑剔,但你给的是可执行的修改,不是空泛建议
- 反馈要短、直接、带数据直觉(不要说"也许" "可能")
你只输出结构化 JSON,不要任何解释或 markdown。`,
  },
  {
    id: 'designer',
    name: '设计师',
    system: `你是 Page Forge 的资深产品设计师,关注视觉层次、信息密度、品牌一致性。
你的视角:
- 视觉对比:标题/正文/CTA 的字号、字重、颜色对比是否清晰
- 节奏:section 之间的呼吸感是否舒服,有没有压迫感
- 装饰元素:渐变、装饰 SVG、动效是否过度或风格不统一
- 移动端可读性:这个页面在手机上会塌吗?
你只输出结构化 JSON,不要任何解释或 markdown。`,
  },
  {
    id: 'copywriter',
    name: '文案',
    system: `你是 Page Forge 的资深转化文案,中文母语,擅长短句、动词、口语化表达。
你的视角:
- 具体优于抽象("3 分钟搭好网站" 比 "快速搭建" 好)
- 动词优于名词、副词("现在试" 比 "开始使用" 好)
- 收益优于功能("再也不丢笔记" 比 "云端同步" 好)
- 用户语言:不要用公司内部术语,要用目标用户口头禅
- 字数控制:hero 标题 ≤ 12 字,副标题 ≤ 30 字
你只输出结构化 JSON,不要任何解释或 markdown。`,
  },
] as const

@Injectable()
export class MultiReviewService {
  private readonly logger = new Logger(MultiReviewService.name)
  private readonly client: Anthropic | null

  constructor(config: ConfigService) {
    const key = config.get<string>('ANTHROPIC_API_KEY')?.trim()
    this.client = key && key.startsWith('sk-ant-') ? new Anthropic({ apiKey: key }) : null
    if (!this.client) this.logger.warn('MultiReview disabled: ANTHROPIC_API_KEY not configured.')
  }

  isConfigured(): boolean { return !!this.client }

  async run(page: PageContext): Promise<MergedReview> {
    if (!this.client) throw new Error('后端 ANTHROPIC_API_KEY 未配置')

    const pageText = renderPage(page)

    const calls = PERSONAS.map((persona) => this.callPersona(persona, pageText))
    const results = await Promise.allSettled(calls)

    const personas: PersonaReview[] = []
    for (let i = 0; i < PERSONAS.length; i++) {
      const r = results[i]
      if (r.status === 'fulfilled' && r.value) {
        personas.push({
          persona: PERSONAS[i].name,
          feedback: r.value.feedback,
          suggestions: r.value.suggestions,
        })
      } else {
        this.logger.warn(`persona ${PERSONAS[i].id} failed`, r.status === 'rejected' ? r.reason : '')
      }
    }

    return merge(page, personas)
  }

  async runSinglePersona(
    personaDesc: string,
    page: PageContext,
  ): Promise<PersonaReview> {
    if (!this.client) throw new Error('后端 ANTHROPIC_API_KEY 未配置')

    const sys = `你现在是 Page Forge 的目标用户模拟器。
用户的特征:${personaDesc}

你的反馈必须真实、具体、带情绪。不要客气,不要鼓励,直接说你看到了什么、哪里看不懂、哪里不信任、哪里没吸引力。
每次回答都假设你第一次看到这个页面,只有几秒钟的耐心。

只输出结构化 JSON,不要任何解释或 markdown。`

    const pageText = renderPage(page)
    const data = await this.callPersona({ id: 'custom', name: personaDesc.slice(0, 30), system: sys }, pageText)
    return { persona: personaDesc, feedback: data.feedback, suggestions: data.suggestions }
  }

  private async callPersona(
    persona: PersonaSpec,
    pageText: string,
  ): Promise<SinglePersonaResult> {
    const userMsg = `对以下落地页给出评审意见。

# 页面内容
${pageText}

# 评审维度(rubric)
${RUBRIC_TEXT}

# 输出 schema(严格按此 JSON 结构)
{
  "feedback": "<2-3 句总结,直接、不绕弯>",
  "suggestions": [
    {
      "category": "<clarity|conversion|trust|visual|copy|structure 之一>",
      "blockId": "<可选,引用的 block id>",
      "blockType": "<可选,引用的 block 类型>",
      "issue": "<这个块具体哪里有问题,1 句话>",
      "suggestion": "<怎么改,具体可执行,1-2 句话>",
      "priority": "high|medium|low"
    }
    // 3-6 条
  ]
}`

    const client = this.client!
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: persona.system,
      messages: [{ role: 'user', content: userMsg as any }],
    })

    const text = (res.content as any[]).find((b: any) => b?.type === 'text')
    if (!text) throw new Error(`${persona.id} 未返回 text 块`)
    return parseJsonLoose<SinglePersonaResult>(text.text)
  }
}

function renderPage(page: PageContext): string {
  const lines: string[] = []
  if (page.pageTitle) lines.push(`页面标题: ${page.pageTitle}`)
  lines.push(`block 数: ${page.blocks.length}`)
  lines.push('')
  for (const b of page.blocks) {
    lines.push(`## block ${b.type} (id=${b.id})`)
    lines.push(b.preview || '(空内容)')
    lines.push('')
  }
  return lines.join('\n')
}

function merge(page: PageContext, personas: PersonaReview[]): MergedReview {
  type Key = string
  const byBlock = new Map<Key, {
    blockId?: string
    blockType?: string
    suggestions: Map<string, {
      category: ReviewRubricItem['category']
      issue: string
      suggestion: string
      priority: 'high' | 'medium' | 'low'
      fromPersonas: Set<string>
    }>
  }>()

  for (const p of personas) {
    for (const s of p.suggestions) {
      const key = `${s.blockId ?? s.blockType ?? '_global'}`
      if (!byBlock.has(key)) {
        byBlock.set(key, {
          blockId: s.blockId,
          blockType: s.blockType,
          suggestions: new Map(),
        })
      }
      const group = byBlock.get(key)!
      const sugKey = `${s.category}::${s.issue}`
      if (!group.suggestions.has(sugKey)) {
        group.suggestions.set(sugKey, {
          category: s.category,
          issue: s.issue,
          suggestion: s.suggestion,
          priority: s.priority,
          fromPersonas: new Set([p.persona]),
        })
      } else {
        group.suggestions.get(sugKey)!.fromPersonas.add(p.persona)
      }
    }
  }

  const byBlockArr = Array.from(byBlock.entries()).map(([_, g]) => ({
    blockId: g.blockId,
    blockType: g.blockType,
    suggestions: Array.from(g.suggestions.values()).map((s) => ({
      ...s,
      fromPersonas: Array.from(s.fromPersonas),
    })).sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority)),
  }))

  // 按 block 在 page 中的顺序排序
  const orderIndex = new Map<string, number>()
  page.blocks.forEach((b, i) => orderIndex.set(b.id, i))
  byBlockArr.sort((a, b) => {
    const ai = a.blockId ? orderIndex.get(a.blockId) ?? 999 : 999
    const bi = b.blockId ? orderIndex.get(b.blockId) ?? 999 : 999
    return ai - bi
  })

  const overall = personas.length === 0
    ? '评审服务暂不可用,请检查后端 ANTHROPIC_API_KEY 配置。'
    : `${personas.length} 个角色已完成评审。最重要的前 3 个建议:\n${byBlockArr.flatMap(g => g.suggestions).slice(0, 3).map((s, i) => `${i + 1}. [${s.priority}] ${s.suggestion}`).join('\n')}`

  return { personas, byBlock: byBlockArr, overall }
}

function priorityRank(p: 'high' | 'medium' | 'low'): number {
  return p === 'high' ? 0 : p === 'medium' ? 1 : 2
}

function parseJsonLoose<T>(raw: string | null | undefined): T {
  const text = raw ?? ''
  // 1) 直接 parse
  try { return JSON.parse(text) as T } catch { /* */ }
  // 2) 截取第一个 {...}
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    const candidate = text.slice(start, end + 1)
    return JSON.parse(candidate) as T
  }
  throw new Error('无法解析 persona 返回的 JSON')
}
