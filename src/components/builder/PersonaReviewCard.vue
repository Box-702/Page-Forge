<script setup lang="ts">
import { computed } from 'vue'
import type { PersonaReview, BlockSuggestionGroup, MergedReview, PersonaReviewSuggestion } from '@/ai/reviewApi'
import { priorityStyle, CATEGORY_LABELS } from '@/ai/reviewApi'

const props = defineProps<{
  /** 多角色:每条 persona 卡片 */
  personas?: PersonaReview[]
  /** 合并后的多角色 */
  review?: MergedReview
  /** 单 persona 模拟 */
  singlePersona?: PersonaReview
  /** 是否显示每个 persona 的折叠视图 */
  showPerPersona?: boolean
}>()

const emit = defineEmits<{
  (e: 'applySuggestion', payload: PersonaReviewSuggestion): void
}>()

const groups = computed(() => {
  if (props.review) return props.review.byBlock
  return []
})

const personList = computed(() => {
  if (props.singlePersona) return [props.singlePersona]
  return props.personas ?? []
})

function blockLabel(g: BlockSuggestionGroup): string {
  if (g.blockType) return g.blockType
  return '全局'
}

function apply(s: PersonaReviewSuggestion) {
  emit('applySuggestion', s)
}
</script>

<template>
  <div class="space-y-3 text-sm">
    <!-- 1. 合并建议(按 block 分组) -->
    <template v-if="review">
      <div
        v-if="review.overall"
        class="rounded-md bg-purple-50 border border-purple-200 px-3 py-2 text-xs text-purple-900 whitespace-pre-wrap"
      >{{ review.overall }}</div>

      <div
        v-for="(g, gi) in groups"
        :key="gi"
        class="rounded-md border border-gray-200 overflow-hidden"
      >
        <div class="px-3 py-1.5 bg-gray-50 text-xs font-medium text-gray-700">
          📦 {{ blockLabel(g) }}
        </div>
        <div class="divide-y divide-gray-100">
          <div
            v-for="(s, si) in g.suggestions"
            :key="si"
            class="px-3 py-2 space-y-1.5"
          >
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="text-[10px] px-1.5 py-0.5 rounded border"
                :class="priorityStyle(s.priority)"
              >{{ s.priority }}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {{ CATEGORY_LABELS[s.category] ?? s.category }}
              </span>
              <span v-if="s.fromPersonas && s.fromPersonas.length" class="text-[10px] text-gray-400">
                {{ s.fromPersonas.length }} 个角色提到
              </span>
            </div>
            <p class="text-xs text-gray-700"><strong>问题:</strong> {{ s.issue }}</p>
            <p class="text-xs text-gray-700"><strong>建议:</strong> {{ s.suggestion }}</p>
            <div v-if="s.fromPersonas && s.fromPersonas.length" class="text-[10px] text-gray-400">
              {{ s.fromPersonas.join(' · ') }}
            </div>
            <button
              class="text-[10px] px-2 py-0.5 rounded border border-purple-300 text-purple-700 hover:bg-purple-50"
              @click="apply(s)"
            >应用此建议</button>
          </div>
        </div>
      </div>
    </template>

    <!-- 2. 单 persona / 多 persona 详细反馈 -->
    <div v-if="personList.length" class="space-y-2">
      <details
        v-for="p in personList"
        :key="p.persona"
        class="rounded-md border border-gray-200"
      >
        <summary class="px-3 py-2 cursor-pointer text-xs font-medium text-gray-700 hover:bg-gray-50">
          👤 {{ p.persona }}
          <span class="text-gray-400 font-normal">({{ p.suggestions.length }} 条建议)</span>
        </summary>
        <div class="px-3 py-2 border-t border-gray-100 space-y-2">
          <p class="text-xs text-gray-700 italic">"{{ p.feedback }}"</p>
          <div class="space-y-1.5">
            <div
              v-for="(s, si) in p.suggestions"
              :key="si"
              class="text-xs bg-gray-50 rounded px-2 py-1.5 space-y-0.5"
            >
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] px-1 rounded border" :class="priorityStyle(s.priority)">{{ s.priority }}</span>
                <span class="text-[10px] text-gray-500">{{ CATEGORY_LABELS[s.category] ?? s.category }}</span>
              </div>
              <p class="text-gray-700">{{ s.issue }}</p>
              <p class="text-gray-600"><strong>→</strong> {{ s.suggestion }}</p>
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>