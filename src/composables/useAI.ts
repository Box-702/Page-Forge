import { computed } from 'vue'
import type { PageComponent, PageSettings } from '@/types'
import { useAIStore } from '@/stores/ai'
import { callClaude } from '@/ai/providers/anthropic'
import { generateImage } from '@/ai/providers/stability'
import { buildRewritePrompt, REWRITE_TOOL } from '@/ai/prompts/rewriteBlock'
import { buildPagePrompt, PAGE_TOOL } from '@/ai/prompts/generatePage'

export interface AIError {
  message: string
}

function asObject(content: any): any {
  if (!content) return null
  const tool = content.find((b: any) => b.type === 'tool_use')
  if (tool) return tool.input
  const text = content.find((b: any) => b.type === 'text')
  if (text) {
    try { return JSON.parse(text.text) } catch { return null }
  }
  return null
}

export function useAI() {
  const store = useAIStore()
  const isConfigured = computed(() => store.anthropicReady)

  async function rewriteBlock(component: PageComponent): Promise<any> {
    const prompt = buildRewritePrompt(component)
    const res = await callClaude({
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 2048,
      tools: [REWRITE_TOOL],
      tool_choice: { type: 'tool', name: REWRITE_TOOL.name },
      messages: [{ role: 'user', content: prompt }],
    })
    const obj = asObject(res.content)
    if (!obj) throw new Error('AI 未返回结构化结果')
    return obj
  }

  async function generatePage(brief: string, currentSettings?: PageSettings): Promise<{ pageSettings: PageSettings; components: PageComponent[] }> {
    const prompt = buildPagePrompt(brief, currentSettings)
    const res = await callClaude({
      model: 'claude-sonnet-4-6',
      maxTokens: 8192,
      tools: [PAGE_TOOL],
      tool_choice: { type: 'tool', name: PAGE_TOOL.name },
      messages: [{ role: 'user', content: prompt }],
    })
    const obj = asObject(res.content)
    if (!obj || !Array.isArray(obj.components)) {
      throw new Error('AI 未返回完整的页面结构')
    }
    return {
      pageSettings: obj.pageSettings ?? currentSettings ?? defaultSettings(),
      components: obj.components,
    }
  }

  async function generateHeroImage(prompt: string): Promise<string> {
    return await generateImage({ prompt, width: 1024, height: 1024 })
  }

  function defaultSettings(): PageSettings {
    return {
      primaryColor: '#3b82f6',
      accentColor: '#0f172a',
      surfaceColor: '#ffffff',
      textColor: '#111827',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#ffffff',
      title: 'Landing Page',
      description: '',
    }
  }

  return {
    isConfigured,
    rewriteBlock,
    generatePage,
    generateHeroImage,
  }
}