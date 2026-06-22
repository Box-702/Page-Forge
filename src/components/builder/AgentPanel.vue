<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useAIStore } from '@/stores/ai'
import { useAgentStore } from '@/stores/agent'
import { useAgentTurn } from '@/composables/useAgentTurn'
import { useDocumentContext } from '@/composables/useDocumentContext'
import { callMultiReview, callPersona, snapshotPage, type PersonaReviewSuggestion } from '@/ai/reviewApi'
import { callVariants, type VariantResult } from '@/ai/variantsApi'
import { callDiagnostics, severityStyle, categoryLabel, type DiagnosticIssue } from '@/ai/diagnosticsApi'
import PersonaReviewCard from './PersonaReviewCard.vue'
import VariantPreviewModal from './VariantPreviewModal.vue'

const builder = useBuilderStore()
const ai = useAIStore()
const agent = useAgentStore()
const docCtx = useDocumentContext()
const { send, abort } = useAgentTurn()

const inputValue = ref('')
const isReviewing = ref(false)
const showCommandMenu = ref(false)
const variantsModal = ref<{ open: boolean; variants: VariantResult[]; brief: string }>({
  open: false,
  variants: [],
  brief: '',
})

const pageSnapshot = computed(() => snapshotPage(builder.pageSettings, builder.components))

function onInput(e: Event) {
  inputValue.value = (e.target as HTMLTextAreaElement).value
}

async function submit() {
  const text = inputValue.value.trim()
  if (!text || agent.isStreaming || isReviewing.value) return
  inputValue.value = ''
  showCommandMenu.value = false

  if (text === '/review') {
    await runMultiReview()
    return
  }
  if (text.startsWith('/persona ')) {
    const persona = text.slice('/persona '.length).trim()
    if (!persona) return
    await runPersona(persona)
    return
  }
  if (text === '/variants' || text.startsWith('/variants ')) {
    const brief = text === '/variants' ? '' : text.slice('/variants '.length).trim()
    await runVariants(brief || builder.pageSettings.title || '我的产品落地页')
    return
  }
  if (text === '/diagnose' || text.startsWith('/diagnose')) {
    await runDiagnostics()
    return
  }
  await send(text)
}

async function runDiagnostics() {
  isReviewing.value = true
  agent.pushUser('/diagnose')
  try {
    const res = await callDiagnostics({
      pageSettings: builder.pageSettings,
      components: builder.components,
    })
    if (res.ok && res.report) {
      agent.messages = [...agent.messages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.report.summary,
        card: { kind: 'diagnostics', report: res.report },
      }]
    } else {
      agent.messages = [...agent.messages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `诊断失败:${res.error ?? '未知错误'}`,
      }]
    }
  } finally {
    isReviewing.value = false
  }
}

function applyDiagnosticFix(issue: DiagnosticIssue) {
  if (!issue.blockId || !issue.blockType) return
  send(`修复 ${issue.blockType} block 的这个问题:${issue.message} → 建议:${issue.fix}`)
}

const fileInput = ref<HTMLInputElement | null>(null)
function openFilePicker() {
  fileInput.value?.click()
}
async function onFileChosen(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const result = await docCtx.load(file)
  if (result.ok) {
    agent.documentName = docCtx.documentName.value
    agent.documentText = docCtx.documentText.value
    agent.pushUser(`📎 已附加文档 ${file.name}(${Math.round(file.size / 1024)} KB)。后续 3-5 轮对话会引用其内容,之后自动过期。`)
  } else {
    agent.pushUser(`⚠ 文档加载失败:${result.error}`)
  }
  input.value = ''
}
function clearDocument() {
  docCtx.clear()
  agent.documentName = null
  agent.documentText = null
}

async function runVariants(brief: string) {
  isReviewing.value = true
  agent.pushUser(`/variants ${brief}`)
  try {
    const currentPage = {
      title: builder.pageSettings.title,
      blockCount: builder.components.length,
      blockTypes: builder.components.map((c) => c.type),
    }
    const res = await callVariants(brief, currentPage)
    if (res.ok && res.variants && res.variants.length > 0) {
      variantsModal.value = { open: true, variants: res.variants, brief }
      agent.messages = [...agent.messages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `生成了 ${res.variants.length} 个 A/B 变体(转化/信任/功能),在弹窗中预览。`,
      }]
    } else {
      agent.messages = [...agent.messages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `变体生成失败:${res.error ?? '未知错误'}`,
      }]
    }
  } finally {
    isReviewing.value = false
  }
}

function applyVariant(v: VariantResult) {
  builder.applyVariant({
    name: v.name,
    rationale: v.rationale,
    pageSettings: v.projectData.pageSettings,
    components: v.projectData.components,
  })
  variantsModal.value.open = false
  agent.messages = [...agent.messages, {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: `已应用变体「${v.name}」。可 Ctrl+Z 撤销。`,
  }]
}

async function runMultiReview() {
  if (!builder.components.length) {
    agent.pushUser('/review')
    agent.messages = [...agent.messages, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '画布为空,先加点 block 再让我评审。',
    }]
    return
  }
  isReviewing.value = true
  agent.pushUser('/review')
  try {
    const res = await callMultiReview(pageSnapshot.value)
    if (res.ok && res.review) {
      agent.messages = [...agent.messages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `多角色评审完成,${res.review.personas.length} 个角色给出了 ${res.review.byBlock.reduce((n, g) => n + g.suggestions.length, 0)} 条建议:`,
        card: { kind: 'review', review: res.review },
      }]
    } else {
      agent.messages = [...agent.messages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `评审失败:${res.error ?? '未知错误'}`,
      }]
    }
  } finally {
    isReviewing.value = false
  }
}

async function runPersona(personaDesc: string) {
  if (!builder.components.length) {
    agent.pushUser(`/persona ${personaDesc}`)
    agent.messages = [...agent.messages, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '画布为空,先加点 block 再让 persona 模拟反馈。',
    }]
    return
  }
  isReviewing.value = true
  agent.pushUser(`/persona ${personaDesc}`)
  try {
    const res = await callPersona({ ...pageSnapshot.value, persona: personaDesc })
    if (res.ok && res.persona) {
      agent.messages = [...agent.messages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `「${personaDesc}」看完后的反馈:`,
        card: { kind: 'persona', persona: res.persona },
      }]
    } else {
      agent.messages = [...agent.messages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `persona 模拟失败:${res.error ?? '未知错误'}`,
      }]
    }
  } finally {
    isReviewing.value = false
  }
}

function applySuggestion(s: PersonaReviewSuggestion) {
  if (!s.suggestion) return
  const blockHint = s.blockType ? `(针对 ${s.blockType} block)` : ''
  send(`应用这条建议:${s.suggestion}${blockHint}`)
}

function close() {
  if (agent.isStreaming) abort()
  builder.showAgentPanel = false
}

function commitEdit() {
  builder.commitAgentEdit()
}
function discardEdit() {
  builder.discardAgentEdit()
}

const pendingSummary = computed(() => {
  const p = builder.pendingAgentEdit
  if (!p) return null
  const types = p.blocks.map((b) => b.type)
  return {
    rationale: p.rationale,
    replaceExisting: p.replaceExisting,
    count: p.blocks.length,
    types: Array.from(new Set(types)).join(', '),
  }
})

const isBusy = computed(() => agent.isStreaming || isReviewing.value)

function showCommands() {
  showCommandMenu.value = !showCommandMenu.value
}

interface CommandEntry {
  cmd: string
  desc: string
  group: '创作' | '评审' | '诊断'
}

const COMMANDS: CommandEntry[] = [
  { cmd: '/variants [需求]', desc: '生成 3 个 A/B 变体预览(转化/信任/功能)', group: '创作' },
  { cmd: '/review', desc: '让 3 个角色(营销/设计/文案)评审当前页面',         group: '评审' },
  { cmd: '/persona <描述>', desc: '模拟特定用户视角反馈,例:`/persona 30 岁独立开发者`', group: '评审' },
  { cmd: '/diagnose', desc: '检查 SEO/可访问性/标题层级等问题',                  group: '诊断' },
]

const COMMAND_GROUPS: { id: CommandEntry['group']; label: string; hint: string }[] = [
  { id: '创作', label: '🎨 创作',  hint: '生成新页面或变体' },
  { id: '评审', label: '👥 评审',  hint: '多角色 / persona 模拟' },
  { id: '诊断', label: '🔍 诊断',  hint: 'SEO / 可访问性 / 内容质量' },
]
</script>

<template>
  <aside class="w-[380px] flex-shrink-0 bg-white border-l flex flex-col">
    <header class="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
      <div class="flex-1 min-w-0">
        <h2 class="text-sm font-semibold">✨ Agent</h2>
        <p class="text-[11px] text-gray-500 truncate">
          <template v-if="agent.sessionExpired">⚠ 会话已过期,新一轮将自动新建</template>
          <template v-else-if="agent.sessionId">session {{ agent.sessionId.slice(0, 8) }}…</template>
          <template v-else>多轮对话 + 工具 + 评审</template>
        </p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-lg leading-none" @click="close">×</button>
    </header>

    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div v-if="agent.messages.length === 0" class="text-xs text-gray-600 leading-relaxed space-y-3">
        <p class="font-medium text-gray-700">告诉 agent 你想做什么,或点 <button class="text-purple-700 underline" @click="showCommands">/ 命令</button> 看可用操作。</p>

        <div class="space-y-2">
          <div class="rounded-md bg-gray-50 px-3 py-2">
            <div class="font-medium text-gray-800">🎨 创作</div>
            <p class="text-gray-600">"做一个咖啡店落地页" / <code class="bg-white px-1 rounded">/variants 我的产品</code></p>
          </div>
          <div class="rounded-md bg-gray-50 px-3 py-2">
            <div class="font-medium text-gray-800">👥 评审</div>
            <p class="text-gray-600"><code class="bg-white px-1 rounded">/review</code> 让 3 个角色反馈 / <code class="bg-white px-1 rounded">/persona 30 岁独立开发者</code></p>
          </div>
          <div class="rounded-md bg-gray-50 px-3 py-2">
            <div class="font-medium text-gray-800">🔍 诊断</div>
            <p class="text-gray-600"><code class="bg-white px-1 rounded">/diagnose</code> 检查 SEO/可访问性</p>
          </div>
          <div class="rounded-md bg-gray-50 px-3 py-2">
            <div class="font-medium text-gray-800">📎 附加文档</div>
            <p class="text-gray-600">底部 <code class="bg-white px-1 rounded">📎 附件</code> 按钮上传 PRD/MD,后续对话引用其内容</p>
          </div>
        </div>

        <p v-if="!ai.anthropicReady" class="rounded border border-yellow-200 bg-yellow-50 px-2 py-1.5 text-yellow-800">
          后端 Claude 未配置,请先点工具栏 <button class="underline" @click="builder.showAISettingsModal = true">AI 设置</button> 在 server/.env 填入 ANTHROPIC_API_KEY 并重启后端。
        </p>
      </div>

      <div
        v-for="m in agent.messages"
        :key="m.id"
        :class="['flex', m.role === 'user' ? 'justify-end' : 'justify-start']"
      >
        <div
          class="max-w-[92%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words"
          :class="m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'"
        >
          <span>{{ m.content || (m.pending ? '...' : '') }}</span>
          <span v-if="m.pending" class="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse align-middle"></span>

          <!-- 工具调用展示 -->
          <div v-if="m.toolCalls && m.toolCalls.length" class="mt-2 space-y-1">
            <div
              v-for="tc in m.toolCalls"
              :key="tc.id"
              class="bg-white border border-gray-200 rounded p-2 text-[11px]"
            >
              <div class="flex items-center gap-1.5">
                <span class="inline-block w-2 h-2 rounded-full"
                  :class="tc.result ? (tc.result.ok ? 'bg-green-500' : 'bg-red-500') : 'bg-yellow-500 animate-pulse'"></span>
                <code class="font-mono font-medium text-gray-700">{{ tc.name }}</code>
                <span v-if="tc.result?.ok && tc.name === 'generate_blocks'" class="text-gray-500">
                  → {{ tc.result.data?.blocks?.length ?? 0 }} blocks
                </span>
                <span v-else-if="tc.result?.ok" class="text-gray-500">→ ok</span>
                <span v-else-if="tc.result && !tc.result.ok" class="text-red-600">→ {{ tc.result.error }}</span>
                <span v-else class="text-gray-400">→ 等待执行...</span>
              </div>
            </div>
          </div>

          <!-- 内嵌卡片:多角色评审 / persona -->
          <PersonaReviewCard
            v-if="m.card?.kind === 'review'"
            :review="m.card.review"
            class="mt-2"
            @apply-suggestion="applySuggestion"
          />
          <PersonaReviewCard
            v-else-if="m.card?.kind === 'persona'"
            :single-persona="m.card.persona"
            class="mt-2"
            @apply-suggestion="applySuggestion"
          />
          <!-- 诊断卡片 -->
          <div
            v-else-if="m.card?.kind === 'diagnostics' && m.card.report"
            class="mt-2 space-y-2"
          >
            <div
              v-for="(iss, ii) in m.card.report.issues"
              :key="ii"
              class="bg-white border border-gray-200 rounded p-2 text-[11px] space-y-1"
            >
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[10px] px-1.5 py-0.5 rounded border" :class="severityStyle(iss.severity)">
                  {{ iss.severity }}
                </span>
                <span class="text-[10px] text-gray-500">{{ categoryLabel(iss.category) }}</span>
                <span v-if="iss.blockType" class="text-[10px] text-gray-400 font-mono">{{ iss.blockType }}</span>
              </div>
              <p class="text-gray-700">{{ iss.message }}</p>
              <div class="flex items-center justify-between gap-2">
                <p class="text-gray-500 text-[10px] flex-1"><strong>建议:</strong> {{ iss.fix }}</p>
                <button
                  v-if="iss.blockId && iss.autoFixable"
                  class="text-[10px] px-2 py-0.5 rounded border border-purple-300 text-purple-700 hover:bg-purple-50 flex-shrink-0"
                  @click="applyDiagnosticFix(iss)"
                >一键修复</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 待确认的 agent 提议 -->
      <div v-if="pendingSummary" class="rounded-lg border-2 border-purple-300 bg-purple-50 p-3 text-xs space-y-2">
        <div class="font-medium text-purple-800">Agent 提议</div>
        <p class="text-gray-700">{{ pendingSummary.rationale || '(无说明)' }}</p>
        <p class="text-gray-600">
          {{ pendingSummary.replaceExisting ? '替换当前画布' : '追加到画布末尾' }} ·
          {{ pendingSummary.count }} 个 block ({{ pendingSummary.types }})
        </p>
        <div class="flex gap-2 pt-1">
          <button class="flex-1 rounded bg-purple-600 text-white py-1.5 font-medium hover:bg-purple-700"
            @click="commitEdit">应用</button>
          <button class="flex-1 rounded border border-gray-300 py-1.5 text-gray-700 hover:bg-gray-50"
            @click="discardEdit">丢弃</button>
        </div>
        <p class="text-[10px] text-gray-500">应用后可 Ctrl+Z 撤销</p>
      </div>

      <div v-if="agent.error" class="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700 space-y-1">
        <p>{{ agent.error }}</p>
        <p v-if="agent.error.includes('Failed to fetch') || agent.error.includes('NetworkError')" class="text-red-600">
          后端不可达。请确认 NestJS 已启动(<code class="text-[10px] bg-white px-1 rounded">npm run dev</code>),
          或打开 <button class="underline" @click="builder.showAISettingsModal = true">AI 设置</button> 检查状态。
        </p>
      </div>
    </div>

    <footer class="border-t p-3 space-y-2 flex-shrink-0 relative">
      <!-- 已附加文档 -->
      <div
        v-if="agent.documentName"
        class="flex items-center gap-2 text-[11px] bg-purple-50 border border-purple-200 rounded px-2 py-1"
      >
        <span class="text-purple-700">📎 {{ agent.documentName }}</span>
        <button class="ml-auto text-purple-500 hover:text-purple-700" @click="clearDocument">×</button>
      </div>

      <div v-if="showCommandMenu" class="absolute bottom-full left-3 right-3 mb-1 bg-white border rounded-lg shadow-lg p-1 text-xs max-h-72 overflow-y-auto">
        <div v-for="g in COMMAND_GROUPS" :key="g.id" class="mb-1 last:mb-0">
          <div class="px-2 py-1 text-[10px] uppercase tracking-wide text-gray-500 font-semibold border-b border-gray-100">
            {{ g.label }} · {{ g.hint }}
          </div>
          <button
            v-for="c in COMMANDS.filter((x) => x.group === g.id)"
            :key="c.cmd"
            class="w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 flex items-baseline gap-2"
            @click="inputValue = c.cmd + ' '; showCommandMenu = false"
          >
            <code class="font-mono text-purple-700 text-[11px] flex-shrink-0">{{ c.cmd }}</code>
            <span class="text-gray-500 truncate">{{ c.desc }}</span>
          </button>
        </div>
      </div>

      <textarea
        :value="inputValue"
        rows="2"
        class="w-full border rounded-lg px-3 py-2 text-sm resize-none"
        placeholder="输入 / 看命令,或直接对话"
        :disabled="isBusy"
        @input="onInput"
        @keydown.enter.exact.prevent="submit"
      />
      <div class="flex gap-2 justify-end">
        <button
          class="text-xs px-2 py-1 rounded border text-gray-600 hover:bg-gray-50"
          :class="{ 'bg-gray-100': showCommandMenu }"
          @click="showCommands"
        >/ 命令</button>
        <button
          class="text-xs px-2 py-1 rounded border text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          :disabled="isBusy"
          title="附加 .md / .txt / .json 文档(M5:作为后续 3-5 轮对话上下文)"
          @click="openFilePicker"
        >📎 附件</button>
        <button
          v-if="isBusy"
          class="rounded border px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          @click="isReviewing ? (isReviewing = false) : abort()"
        >取消</button>
        <button
          class="rounded bg-blue-600 px-4 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
          :disabled="isBusy || !inputValue.trim()"
          @click="submit"
        >{{ isBusy ? (isReviewing ? '处理中…' : '生成中…') : '发送' }}</button>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept=".txt,.md,.markdown,.json"
        class="hidden"
        @change="onFileChosen"
      />
    </footer>

    <VariantPreviewModal
      v-if="variantsModal.open"
      :variants="variantsModal.variants"
      :brief="variantsModal.brief"
      @apply="applyVariant"
      @close="variantsModal.open = false"
    />
  </aside>
</template>