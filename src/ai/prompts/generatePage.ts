import type { PageSettings } from '@/types'

export const PAGE_TOOL = {
  name: 'output_page',
  description: 'Return a complete landing page as structured data.',
  input_schema: {
    type: 'object' as const,
    properties: {
      pageSettings: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          primaryColor: { type: 'string' },
          accentColor: { type: 'string' },
          surfaceColor: { type: 'string' },
          textColor: { type: 'string' },
          fontFamily: { type: 'string' },
          backgroundColor: { type: 'string' },
        },
        required: ['title', 'description', 'primaryColor'],
      },
      components: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['hero', 'features', 'pricing', 'cta', 'testimonials', 'faq', 'footer', 'row'] },
            content: { type: 'object' },
            styles: { type: 'object' },
            children: { type: 'array' },
          },
          required: ['type', 'content', 'styles'],
        },
      },
    },
    required: ['pageSettings', 'components'],
  },
}

const BLOCK_GUIDE = `支持的 block 及其必填 content 字段:

1. hero
   { title, subtitle, ctaText, ctaLink:"#", ctaVariant:"primary", alignment:"center", imageUrl:"" }
   styles: { bgColor, textColor, paddingTop:"64px", paddingBottom:"64px", textAlign:"text-center" }

2. features
   { title, subtitle, columns:2-4, features:[{ id, icon:"✦ 或 https://...", title, description } x 3-6] }

3. pricing
   { title, subtitle, currency:"¥/$", plans:[{ id, name, price, period:"/mo", description, features:[...], highlighted:false, ctaText } x 2-3] }

4. cta
   { title, subtitle, ctaText, ctaLink:"#", ctaVariant:"light" }

5. testimonials
   { title, subtitle, columns:2-3, testimonials:[{ id, quote, name, title:"职位", avatarUrl:"" } x 3] }

6. faq
   { title, subtitle, faqs:[{ id, question, answer } x 4-6] }

7. footer
   { companyName, description, copyright:"Copyright 2026 ...", links:[{ id, title, url:"#" } x 4] }

8. row (多列容器)
   { columnCount:2-3, columns:[{ id, width:"50%", children:[...可嵌套其他 block] }] }

所有 id 字段必须是 8-12 位随机字符串(不能用 uuid 完整格式,生成短随机串即可)。
styles 中可选 decoration/animation/bgGradient 字段。
每个 block 的 id 字段也放在顶层(type 同级的 id)。`

export function buildPagePrompt(brief: string, current?: PageSettings): string {
  const ctx = current ? '当前页面设置(供参考):\n' + JSON.stringify(current, null, 2) + '\n\n' : ''
  return [
    '你是 landing page 设计师和文案专家。根据用户需求生成一个完整、可直接发布的落地页。',
    '',
    '用户需求:',
    brief,
    '',
    ctx + '生成要求:',
    '1. 5-7 个 block,顺序合理(hero → features → pricing/testimonials → faq → cta → footer)',
    '2. 中文文案,口语化,突出用户收益',
    '3. 配色和谐,推荐使用渐变或柔和色',
    '4. 不要放真实的公司名/邮箱/电话,占位即可',
    '',
    BLOCK_GUIDE.replace(/`/g, ''),
    '',
    '直接调用 output_page 工具。',
  ].filter(Boolean).join('\n')
}