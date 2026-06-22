<script setup lang="ts">
import { useBuilderStore } from '@/stores/builder'
import { useAIStore } from '@/stores/ai'
import { useAgentStore } from '@/stores/agent'

const builder = useBuilderStore()
const ai = useAIStore()
const agent = useAgentStore()

function summarizeBlock(content: any): string {
  if (!content) return '(空)'
  const lines: string[] = []
  for (const [k, v] of Object.entries(content)) {
    if (k === 'backgroundType') continue
    if (v == null || v === '') continue
    if (typeof v === 'string') lines.push(`${k}: ${v.slice(0, 60)}`)
    else if (Array.isArray(v)) lines.push(`${k}: [${v.length} 项]`)
    else lines.push(`${k}: ${JSON.stringify(v).slice(0, 40)}`)
  }
  return lines.join(' | ').slice(0, 200)
}

function open() {
  builder.showAgentPanel = true
  const comp = builder.selectedComponent
  if (!comp) return
  const summary = summarizeBlock(comp.content)
  agent.pushUser(`改写当前选中的 ${comp.type} block,当前内容:${summary}。请基于现有信息生成改进版本,我会预览后选择应用。`)
}
</script>

<template>
  <button
    class="text-xs px-2 py-1 rounded text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-40"
    :disabled="!ai.anthropicReady"
    :title="ai.anthropicReady ? '在 Agent 面板中改写' : '请先配置 Claude key'"
    @click="open"
  >✨ AI 改写</button>
</template>