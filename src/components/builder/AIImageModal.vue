<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useAIStore } from '@/stores/ai'
import { useAI } from '@/composables/useAI'
import { findComponent } from '@/utils/treeHelpers'

const builder = useBuilderStore()
const ai = useAIStore()
const aiSvc = useAI()

const prompt = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<string | null>(null)
const abortCtrl = ref<AbortController | null>(null)

const targetField = computed(() => builder.aiImageTargetField)

function placeholder(): string {
  if (!builder.selectedId) return ''
  const comp = findComponent(builder.components, builder.selectedId)
  if (!comp) return ''
  if (targetField.value === 'bgImage') return `${comp.type} 背景图,极简风格`
  const c = comp.content as any
  return c?.title ? `${c.title} 相关插画或产品图` : `${comp.type} 配图`
}

function close() {
  abortCtrl.value?.abort()
  builder.showAIImageModal = false
  builder.aiImageTargetField = null
  prompt.value = ''
  result.value = null
  error.value = ''
}

async function generate() {
  if (!prompt.value.trim()) return
  if (!ai.stabilityReady) {
    builder.showAISettingsModal = true
    return
  }
  if (!builder.selectedId || !targetField.value) return
  loading.value = true
  error.value = ''
  result.value = null
  abortCtrl.value = new AbortController()
  try {
    const url = await aiSvc.generateHeroImage(prompt.value)
    result.value = url
  } catch (e) {
    error.value = e instanceof Error ? e.message : '生成失败'
  } finally {
    loading.value = false
  }
}

function apply() {
  if (!result.value || !builder.selectedId || !targetField.value) return
  const comp = findComponent(builder.components, builder.selectedId)
  if (!comp) return
  const field = targetField.value
  if (field === 'bgImage') {
    builder.updateComponent(builder.selectedId, {
      styles: { ...comp.styles, bgImage: result.value },
    })
  } else if (field === 'imageUrl') {
    builder.updateComponent(builder.selectedId, {
      content: { ...comp.content, imageUrl: result.value },
    })
  }
  close()
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="close">
    <div class="w-full max-w-md rounded-lg bg-white shadow-xl flex flex-col max-h-[85vh]">
      <div class="flex items-center justify-between border-b px-5 py-3 flex-shrink-0">
        <h2 class="text-base font-semibold">✨ AI 生图</h2>
        <button class="text-gray-400 hover:text-gray-600" @click="close">×</button>
      </div>

      <div class="p-5 space-y-3 overflow-y-auto flex-1">
        <p class="text-xs text-gray-500">使用 Stability AI 生成图片,生成结果会填入{{ targetField === 'bgImage' ? '背景图' : '配图' }}。</p>

        <div>
          <label class="text-xs font-medium text-gray-700 block mb-1">图片描述</label>
          <textarea
            v-model="prompt"
            rows="3"
            class="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            :placeholder="placeholder()"
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {{ error }}
        </div>

        <div v-if="loading" class="flex flex-col items-center justify-center py-8 gap-3">
          <div class="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          <p class="text-sm text-gray-500">AI 正在生成图像…</p>
          <p class="text-xs text-gray-400">通常需要 10-20 秒</p>
        </div>

        <div v-else-if="result" class="space-y-2">
          <p class="text-xs text-gray-500">预览</p>
          <img :src="result" alt="生成结果" class="w-full rounded-lg border" />
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t px-5 py-3 bg-gray-50 rounded-b-lg flex-shrink-0">
        <button class="rounded border px-3 py-1.5 text-xs hover:bg-gray-100" @click="close">取消</button>
        <button
          v-if="!result"
          class="rounded bg-purple-600 px-4 py-1.5 text-xs text-white hover:bg-purple-700 disabled:opacity-50"
          :disabled="loading || !prompt.trim()"
          @click="generate"
        >{{ loading ? '生成中…' : '生成' }}</button>
        <button
          v-else
          class="rounded bg-purple-600 px-4 py-1.5 text-xs text-white hover:bg-purple-700"
          @click="apply"
        >使用此图</button>
      </div>
    </div>
  </div>
</template>