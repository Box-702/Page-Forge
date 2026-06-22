import type { PageComponent } from '@/types'

export const REWRITE_TOOL = {
  name: 'rewrite_block_content',
  description: 'Return the rewritten block content matching the input structure exactly.',
  input_schema: {
    type: 'object' as const,
    properties: {
      content: {
        type: 'object',
        description: 'The rewritten content with the same keys as the input',
      },
    },
    required: ['content'],
  },
}

const FIELD_HINTS: Record<string, string> = {
  title: '页面标题,H1/H2,简洁有冲击力,15 字以内最佳',
  subtitle: '副标题,补充价值,30-80 字',
  description: '描述文字,2-3 句话',
  ctaText: '按钮文案,2-4 字动词',
  features: '功能列表项数组,保留 id/字段名',
  plans: '定价方案数组,保留 id/字段名',
  testimonials: '客户证言数组,保留 id/字段名',
  faqs: 'FAQ 数组,保留 id/字段名',
  links: '链接数组,保留 id/字段名',
}

export function buildRewritePrompt(component: PageComponent): string {
  const fields = Object.keys(component.content).filter(k => k !== 'backgroundType' && k !== 'columnCount')
  const hint = fields.map(f => `- ${f}: ${FIELD_HINTS[f] || '文本字段'}`).join('\n')

  return `你是落地页文案专家。改写下面的 block 内容。

要求:
- 保持字段名和结构完全一致(包括数组项的 id 字段),只改文本值
- 语言:简体中文
- 风格:简洁、口语化、突出用户收益和痛点,避免陈词滥调
- 不要新增字段,不要省略字段,不要改 id

字段说明:
${hint}

输入 block 类型: ${component.type}
当前内容(JSON):
${JSON.stringify(component.content, null, 2)}

直接调用 rewrite_block_content 工具,只填 content 字段。`
}