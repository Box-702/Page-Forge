export type Severity = 'high' | 'medium' | 'low'

export interface DiagnosticIssue {
  severity: Severity
  category: string
  blockId?: string
  blockType?: string
  message: string
  fix: string
  autoFixable: boolean
}

export interface DiagnosticReport {
  totalIssues: number
  highCount: number
  mediumCount: number
  lowCount: number
  issues: DiagnosticIssue[]
  summary: string
}

export interface DiagnosticsRequest {
  pageSettings: Record<string, any>
  components: Array<{ id: string; type: string; content?: any; styles?: any }>
}

export interface DiagnosticsResponse {
  ok: boolean
  report?: DiagnosticReport
  error?: string
}

export async function callDiagnostics(req: DiagnosticsRequest): Promise<DiagnosticsResponse> {
  const res = await fetch('/api/diagnostics/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  })
  return await res.json() as DiagnosticsResponse
}

const SEVERITY_STYLE: Record<Severity, string> = {
  high: 'bg-red-100 text-red-700 border-red-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  low: 'bg-blue-100 text-blue-700 border-blue-300',
}

const CATEGORY_LABEL: Record<string, string> = {
  'image-alt': '图片 alt',
  heading: '标题层级',
  meta: 'Meta',
  cta: 'CTA',
  decor: '装饰密度',
  placeholder: '占位内容',
  accessibility: '可访问性',
}

export function severityStyle(s: Severity): string {
  return SEVERITY_STYLE[s] ?? SEVERITY_STYLE.low
}

export function categoryLabel(c: string): string {
  return CATEGORY_LABEL[c] ?? c
}
