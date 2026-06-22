export interface BlockSpec {
  id: string
  type: 'hero' | 'features' | 'pricing' | 'cta' | 'testimonials' | 'faq' | 'footer' | 'row'
  content: Record<string, any>
  styles?: Record<string, any>
}

export const BLOCK_GUIDE_TEXT = `你生成的 block 必须严格符合以下 schema:

1. hero
   content: { title: string, subtitle: string, ctaText: string, ctaLink: string (默认 "#"), ctaVariant: "primary"|"dark"|"light", alignment: "left"|"center", imageUrl: string (留空时为 "") }
   styles (推荐): { bgColor, textColor, paddingTop: "64px", paddingBottom: "64px", textAlign: "text-center" }

2. features
   content: { title, subtitle, columns: 2-4, features: [{ id, icon: "✦ 或 https://图标URL", title, description } x 3-6] }

3. pricing
   content: { title, subtitle, currency: "¥"|"$", plans: [{ id, name, price, period: "/mo", description, features: [string], highlighted: boolean, ctaText } x 2-3] }

4. cta
   content: { title, subtitle, ctaText, ctaLink: "#", ctaVariant: "light" }

5. testimonials
   content: { title, subtitle, columns: 2-3, testimonials: [{ id, quote, name, title: "职位", avatarUrl: "" } x 3] }

6. faq
   content: { title, subtitle, faqs: [{ id, question, answer } x 4-6] }

7. footer
   content: { companyName, description, copyright: "Copyright 2026 <公司名>", links: [{ id, title, url: "#" } x 4] }

8. row (多列容器)
   content: { columnCount: 2-3, columns: [{ id, width: "50%", children: [嵌套其他 block] }] }

字段约束:
- 所有 id 字段必须是 8-12 位随机字符串(字母数字,如 "k3x9p2m"),不能是完整 UUID。
- 每个 block 也必须有顶层 id 字段(同 schema)。
- styles 是可选对象,常用键:bgColor / textColor / bgGradient / paddingTop / paddingBottom / textAlign / decoration / animation。
- 顶层 block 数组里的元素必须是完整的 PageComponent: { id, type, content, styles }。`