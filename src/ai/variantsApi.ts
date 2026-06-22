export interface VariantStrategy {
  id: 'conversion' | 'trust' | 'feature'
  name: string
  description: string
}

export const VARIANT_STRATEGIES: VariantStrategy[] = [
  { id: 'conversion', name: '转化导向', description: '强 CTA、紧迫感、价格突出、漏斗式信息流' },
  { id: 'trust',     name: '信任导向', description: '社会证明、案例、数据、客户 logo 优先' },
  { id: 'feature',   name: '功能导向', description: '详尽功能说明、技术细节、对比表、FAQ 充分' },
]

export interface VariantResult {
  id: string
  strategy: string
  name: string
  rationale: string
  primaryColor: string
  blocks: Array<{
    id: string
    type: string
    title?: string
    snippet?: string
  }>
  pageSettings?: any
  projectData: {
    pageSettings: any
    components: any[]
  }
}

export interface VariantsResponse {
  ok: boolean
  error?: string
  variants?: VariantResult[]
}

export async function callVariants(brief: string, currentPage?: { title?: string; blockCount?: number; blockTypes?: string[] }): Promise<VariantsResponse> {
  const res = await fetch('/api/agent/variants', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ brief, currentPage }),
  })
  return await res.json() as VariantsResponse
}
