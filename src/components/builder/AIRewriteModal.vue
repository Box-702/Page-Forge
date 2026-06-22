<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useAIStore } from '@/stores/ai'
import { useAI } from '@/composables/useAI'
import { findComponent } from '@/utils/treeHelpers'

const builder = useBuilderStore()
const ai = useAIStore()
const aiSvc = useAI()

const loading = ref(false)
const error = ref('')
const result = ref<any | null>(null)

const target = computed(() => {
  if (!builder.aiRewriteTargetId) return null
  return findComponent(builder.components, builder.aiRewriteTargetId)
})

const before = computed(() => target.value?.content ?? null)
const after = computed(() => result.value?.content ?? null)

async function rewrite() {
  if (!target.value) return
  if (!ai.anthropicReady) {
    builder.showAISettingsModal = true
    return
  }
  loading.value = true
  error.value = ''
  result.value = null
  try {
    result.value = await aiSvc.rewriteBlock(target.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '改写失败'
  } finally {
    loading.value = false
  }
}

function apply() {
  if (!target.value || !after.value) return
  builder.updateComponent(target.value.id, {
    content: { ...target.value.content, ...after.value },
  })
  close()
}

function close() {
  builder.showAIRewriteModal = false
  builder.aiRewriteTargetId = null
  result.value = null
  error.value = ''
}

function diffField(key: string): { before: any; after: any } | null {
  if (!before.value || !after.value) return null
  const b = before.value[key]
  const a = after.value[key]
  if (JSON.stringify(b) === JSON.stringify(a)) return null
  return { before: b, after: a }
}

const diffKeys = computed(() => {
  if (!before.value || !after.value) return []
  return Object.keys(after.value).filter(k => diffField(k) !== null)
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="close">
    <div class="w-full max-w-3xl rounded-lg bg-white shadow-xl flex flex-col max-h-[85vh]">
      <div class="flex items-center justify-between border-b px-5 py-3 flex-shrink-0">
        <div>
          <h2 class="text-base font-semibold">✨ AI 改写文案</h2>
          <p v-if="target" class="text-xs text-gray-500 mt-0.5">block 类型: {{ target.type }}</p>
        </div>
        <button class="text-gray-400 hover:text-gray-600" @click="close">×</button>
      </div>

      <div class="p-5 overflow-y-auto flex-1">
        <div v-if="loading" class="flex flex-col items-center justify-center py-12 gap-3">
          <div class="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          <p class="text-sm text-gray-500">AI 正在改写文案…</p>
        </div>

        <div v-else-if="error" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {{ error }}
        </div>

        <div v-else-if="!result" class="text-center py-8 space-y-3">
          <p class="text-sm text-gray-600">AI 会基于当前内容生成更口语化、突出用户收益的版本。</p>
          <p class="text-xs text-gray-400">应用后可撤销(Ctrl+Z)</p>
          <button class="rounded bg-purple-600 px-5 py-2 text-sm text-white hover:bg-purple-700" @click="rewrite">
            开始改写
          </button>
        </div>

        <div v-else class="space-y-3">
          <p class="text-xs text-gray-500">{{ diffKeys.length }} 个字段已修改</p>
          <div v-for="key in diffKeys" :key="key" class="border rounded-lg overflow-hidden">
            <div class="px-3 py-1 bg-gray-50 border-b text-xs font-medium text-gray-700">{{ key }}</div>
            <div class="grid grid-cols-2 divide-x">
              <div class="p-3">
                <p class="text-[10px] text-gray-400 mb-1">原文</p>
                <div class="text-xs text-gray-600 whitespace-pre-wrap break-words">{{ JSON.stringify(diffField(key)!.before) }}</div>
              </div>
              <div class="p-3 bg-purple-50/40">
                <p class="text-[10px] text-purple-600 mb-1">改写后</p>
                <div class="text-xs text-gray-800 whitespace-pre-wrap break-words">{{ JSON.stringify(diffField(key)!.after) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t px-5 py-3 bg-gray-50 rounded-b-lg flex-shrink-0">
        <button class="rounded border px-3 py-1.5 text-xs hover:bg-gray-100" @click="close">关闭</button>
        <button
          v-if="result"
          class="rounded bg-purple-600 px-4 py-1.5 text-xs text-white hover:bg-purple-700"
          @click="apply"
        >应用到画布</button>
      </div>
    </div>
  </div>
</template>