<script setup lang="ts">
import type { DecorationVariant } from '@/types'
import { decorations, decorationCategories } from '@/data/decorationRegistry'

defineProps<{
  modelValue: DecorationVariant | undefined
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: DecorationVariant | undefined): void
}>()

function pick(v: DecorationVariant | undefined) {
  emit('update:modelValue', v)
}
</script>

<template>
  <div class="space-y-2">
    <button
      type="button"
      class="w-full h-12 border-2 border-dashed rounded text-xs text-gray-500 hover:border-gray-400 transition"
      :class="!modelValue || modelValue === 'none' ? 'border-blue-500 text-blue-600' : 'border-gray-300'"
      @click="pick('none')"
    >
      无装饰
    </button>

    <div v-for="cat in decorationCategories" :key="cat.id">
      <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mt-2 mb-1">{{ cat.label }}</p>
      <div class="grid grid-cols-4 gap-1.5">
        <button
          v-for="d in decorations.filter(x => x.category === cat.id)"
          :key="d.variant"
          type="button"
          class="aspect-square border-2 rounded overflow-hidden flex items-center justify-center bg-gray-50 transition hover:border-blue-300"
          :class="modelValue === d.variant ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'"
          :title="d.label"
          @click="pick(d.variant)"
        >
          <div
            class="w-3/4 h-3/4 pointer-events-none"
            :class="d.colorClass || 'text-blue-400'"
            v-html="d.raw"
          />
        </button>
      </div>
    </div>
  </div>
</template>