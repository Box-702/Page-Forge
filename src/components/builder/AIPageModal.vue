<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useAIStore } from '@/stores/ai'
import { useAI } from '@/composables/useAI'
import { useLocalStorage } from '@/composables/useLocalStorage'

const builder = useBuilderStore()
const ai = useAIStore()
const aiSvc = useAI()
const { save } = useLocalStorage()

const brief = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<{ pageSettings: any; components: any[] } | null>(null)

const PRESETS = [
  '面向独立开发者的 Notion 替代品,突出隐私和速度,主色蓝紫渐变',
  '精品咖啡店,温暖木质调,突出第三空间体验',
  '在线瑜伽课程平台,突出每日 10 分钟,适合上班族',
  'B2B 数据分析 SaaS,主色深蓝,突出企业级安全',
]

async function generate() {
  if (!brief.value.trim()) return
  if (!ai.anthropicReady) {
    builder.showAISettingsModal = true
    return
  }
  loading.value = true
  error.value = ''
  result.value = null
  try {
    result.value = await aiSvc.generatePage(brief.value, builder.pageSettings)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '生成失败'
  } finally {
    loading.value = false
  }
}

function apply() {
  if (!result.value) return
  const normalized = {
    components: result.value.components.map((c: any) => ({
      ...c,
      id: c.id || crypto.randomUUID(),
      styles: c.styles || {},
      content: c.content || {},
    })),
    pageSettings: { ...builder.pageSettings, ...result.value.pageSettings },
  }
  builder.replaceProject(normalized as any)
  save(builder.components, builder.pageSettings)
  builder.showAIPageModal = false
}

const blockSummary = computed(() => {
  if (!result.value) return ''
  return result.value.components.map((c, i) => `${i + 1}. ${c.type}`).join('  ·  ')
})

function close() {
  builder.showAIPageModal = false
  brief.value = ''
  result.value = null
  error.value = ''
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="close">
    <div class="w-full max-w-2xl rounded-lg bg-white shadow-xl flex flex-col max-h-[85vh]">
      <div class="flex items-center justify-between border-b px-5 py-3 flex-shrink-0">
        <h2 class="text-base font-semibold">✨ AI 一键建站</h2>
        <button class="text-gray-400 hover:text-gray-600" @click="close">×</button>
      </div>

      <div class="p-5 space-y-4 overflow-y-auto flex-1">
        <p class="text-xs text-gray-500">用一句话描述你的产品/服务,AI 会生成 5-7 个 block 的完整页面。</p>

        <div>
          <label class="text-xs font-medium text-gray-700 block mb-1.5">需求描述</label>
          <textarea
            v-model="brief"
            rows="4"
            class="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            placeholder="例如:面向独立开发者的 Notion 替代品,主色蓝紫渐变,突出隐私、速度、本地优先..."
            :disabled="loading"
          />
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button
              v-for="p in PRESETS"
              :key="p"
              type="button"
              class="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700"
              :disabled="loading"
              @click="brief = p"
            >{{ p.slice(0, 20) }}…</button>
          </div>
        </div>

        <div v-if="error" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {{ error }}
        </div>

        <div v-if="loading" class="flex flex-col items-center justify-center py-12 gap-3">
          <div class="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          <p class="text-sm text-gray-500">AI 正在设计页面…</p>
          <p class="text-xs text-gray-400">通常需要 5-10 秒</p>
        </div>

        <div v-else-if="result" class="rounded-lg border border-purple-200 bg-purple-50/40 p-4 space-y-3">
          <div>
            <p class="text-xs font-medium text-purple-700 mb-1">生成结果</p>
            <p class="text-xs text-gray-600">{{ blockSummary }}</p>
          </div>
          <div>
            <p class="text-xs font-medium text-purple-700 mb-1">页面设置</p>
            <pre class="text-[10px] bg-white rounded p-2 overflow-x-auto">{{ JSON.stringify(result.pageSettings, null, 2) }}</pre>
          </div>
          <p class="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
            ⚠ 应用后会替换当前整个页面(可撤销)
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t px-5 py-3 bg-gray-50 rounded-b-lg flex-shrink-0">
        <button class="rounded border px-3 py-1.5 text-xs hover:bg-gray-100" @click="close">取消</button>
        <button
          v-if="!result"
          class="rounded bg-purple-600 px-4 py-1.5 text-xs text-white hover:bg-purple-700 disabled:opacity-50"
          :disabled="loading || !brief.trim()"
          @click="generate"
        >{{ loading ? '生成中…' : '生成' }}</button>
        <button
          v-else
          class="rounded bg-purple-600 px-4 py-1.5 text-xs text-white hover:bg-purple-700"
          @click="apply"
        >应用到画布</button>
      </div>
    </div>
  </div>
</template>