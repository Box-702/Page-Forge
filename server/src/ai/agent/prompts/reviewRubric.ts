export interface ReviewRubricItem {
  category: 'clarity' | 'conversion' | 'trust' | 'visual' | 'copy' | 'structure'
  description: string
}

export const REVIEW_RUBRIC: ReviewRubricItem[] = [
  { category: 'clarity',     description: '价值主张是否清晰:用户 5 秒内能否说出"这是干什么的、给谁用的"?' },
  { category: 'conversion',  description: '转化路径是否明确:CTA 是否突出、流程是否最少步骤?' },
  { category: 'trust',       description: '信任信号:社会证明、数据、客户 logo、隐私保证是否充分?' },
  { category: 'visual',      description: '视觉层次:信息密度、留白、配色对比、视觉引导是否到位?' },
  { category: 'copy',        description: '文案:具体优于抽象、动词优于名词、收益优于功能?' },
  { category: 'structure',   description: '结构:hero → features → proof → pricing → FAQ → CTA 的转化漏斗是否完整?' },
]

export interface PersonaReview {
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

export interface MergedReview {
  personas: PersonaReview[]
  /** 按 blockType 合并的建议,每个 blockType 一组 */
  byBlock: Array<{
    blockId?: string
    blockType?: string
    suggestions: Array<{
      category: ReviewRubricItem['category']
      issue: string
      suggestion: string
      priority: 'high' | 'medium' | 'low'
      fromPersonas: string[]
    }>
  }>
  overall: string
}
