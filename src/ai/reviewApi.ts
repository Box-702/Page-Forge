export interface PersonaReviewSuggestion {
  category: string
  blockId?: string
  blockType?: string
  issue: string
  suggestion: string
  priority: 'high' | 'medium' | 'low'
  fromPersonas?: string[]
}

export interface PersonaReview {
  persona: string
  feedback: string
  suggestions: PersonaReviewSuggestion[]
}

export interface BlockSuggestionGroup {
  blockId?: string
  blockType?: string
  suggestions: PersonaReviewSuggestion[]
}

export interface MergedReview {
  personas: PersonaReview[]
  byBlock: BlockSuggestionGroup[]
  overall: string
}

export interface ReviewRequest {
  pageTitle?: string
  blocks: Array<{ id: string; type: string; content: any }>
}

export interface ReviewResponse {
  ok: boolean
  error?: string
  review?: MergedReview
}

export interface PersonaRequest extends ReviewRequest {
  persona: string
}

export interface PersonaResponse {
  ok: boolean
  error?: string
  persona?: PersonaReview
}

export async function callMultiReview(req: ReviewRequest): Promise<ReviewResponse> {
  const res = await fetch('/api/agent/multi-review', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  })
  return await res.json() as ReviewResponse
}

export async function callPersona(req: PersonaRequest): Promise<PersonaResponse> {
  const res = await fetch('/api/agent/persona', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  })
  return await res.json() as PersonaResponse
}

export function snapshotPage(pageSettings: { title?: string }, components: Array<{ id: string; type: string; content: any }>): ReviewRequest {
  return {
    pageTitle: pageSettings.title,
    blocks: components.map((c) => ({ id: c.id, type: c.type, content: c.content })),
  }
}

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function priorityStyle(p: string): string {
  return PRIORITY_STYLE[p] ?? PRIORITY_STYLE.low
}

export const CATEGORY_LABELS: Record<string, string> = {
  clarity: '清晰度',
  conversion: '转化',
  trust: '信任',
  visual: '视觉',
  copy: '文案',
  structure: '结构',
}
