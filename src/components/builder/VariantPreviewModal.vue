<script setup lang="ts">
import type { VariantResult } from '@/ai/variantsApi'

defineProps<{
  variants: VariantResult[]
  brief: string
}>()

const emit = defineEmits<{
  (e: 'apply', v: VariantResult): void
  (e: 'close'): void
}>()

const STRATEGY_LABEL: Record<string, { label: string; color: string }> = {
  conversion: { label: '转化',  color: 'bg-red-100 text-red-700' },
  trust:     { label: '信任',  color: 'bg-blue-100 text-blue-700' },
  feature:   { label: '功能',  color: 'bg-purple-100 text-purple-700' },
}

function strategyBadge(s: string) {
  return STRATEGY_LABEL[s] ?? { label: s, color: 'bg-gray-100 text-gray-700' }
}

function apply(v: VariantResult) {
  emit('apply', v)
}
function close() {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="close">
    <div class="w-full max-w-6xl max-h-[90vh] rounded-lg bg-white shadow-xl flex flex-col">
      <header class="px-5 py-3 border-b flex items-center justify-between flex-shrink-0">
        <div>
          <h2 class="text-base font-semibold">A/B 变体预览</h2>
          <p class="text-xs text-gray-500 mt-0.5">需求: {{ brief }}</p>
        </div>
        <button class="text-gray-400 hover:text-gray-600 text-lg" @click="close">×</button>
      </header>

      <div class="flex-1 overflow-y-auto p-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="v in variants"
            :key="v.id"
            class="rounded-lg border-2 border-gray-200 overflow-hidden flex flex-col hover:border-purple-300 transition"
          >
            <!-- 缩略图(简化版:标题 + block 列表 + 配色) -->
            <div
              class="px-4 py-3 text-white"
              :style="{ backgroundColor: v.primaryColor }"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/20">
                  {{ strategyBadge(v.strategy).label }}
                </span>
                <h3 class="text-sm font-bold truncate">{{ v.name }}</h3>
              </div>
              <p class="text-[11px] opacity-90 leading-snug line-clamp-2">{{ v.rationale }}</p>
            </div>

            <div class="flex-1 p-3 space-y-1.5 bg-gray-50 text-[11px]">
              <div class="font-medium text-gray-700 mb-1">包含 {{ v.blocks?.length ?? v.projectData?.components?.length ?? 0 }} 个 block:</div>
              <div
                v-for="(b, i) in (v.blocks?.length ? v.blocks : (v.projectData?.components ?? []).map((c: any) => ({
                  id: c.id, type: c.type, title: c.content?.title || c.content?.companyName,
                })))"
                :key="b.id ?? i"
                class="flex items-baseline gap-2 bg-white rounded px-2 py-1"
              >
                <code class="text-[10px] text-gray-500 w-12 flex-shrink-0">{{ b.type }}</code>
                <span class="truncate text-gray-700">{{ b.title || '(无标题)' }}</span>
              </div>
            </div>

            <button
              class="bg-purple-600 text-white text-sm font-medium py-2.5 hover:bg-purple-700"
              @click="apply(v)"
            >使用此变体</button>
          </div>
        </div>

        <p class="text-[11px] text-gray-500 mt-4 text-center">
          选定后变体会替换当前画布(支持 Ctrl+Z 撤销)
        </p>
      </div>
    </div>
  </div>
</template>