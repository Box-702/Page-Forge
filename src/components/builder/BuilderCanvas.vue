<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useDragDrop } from '@/composables/useDragDrop'
import { useBuilder } from '@/composables/useBuilder'
import ComponentWrapper from './ComponentWrapper.vue'

const store = useBuilderStore()
const { add, pushSnapshot } = useBuilder()
const listRef = ref<HTMLElement | null>(null)
const frameClass = computed(() => {
  if (!store.isPreview) return 'max-w-5xl'
  if (store.previewMode === 'mobile') return 'max-w-[390px]'
  if (store.previewMode === 'tablet') return 'max-w-[768px]'
  return 'max-w-6xl'
})

function onReorder(ids: string[]) {
  const ordered = ids
    .map((id) => store.components.find((c) => c.id === id))
    .filter(Boolean) as typeof store.components
  store.reorderComponents(ordered)
  pushSnapshot()
}

useDragDrop(listRef, onReorder)
</script>

<template>
  <div class="flex-1 overflow-y-auto p-6" :style="{ backgroundColor: store.pageSettings.backgroundColor }">
    <div v-if="store.components.length === 0" class="flex h-full items-center justify-center">
      <div class="max-w-md text-center">
        <h1 class="text-xl font-semibold text-gray-900">从一个页面结构开始</h1>
        <p class="mt-2 text-sm leading-6 text-gray-500">选择模板可以快速得到完整页面，也可以从单个区块开始搭建。</p>
        <div class="mt-5 flex justify-center gap-3">
          <button
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="store.showTemplateModal = true"
          >
            选择模板
          </button>
          <button
            class="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="add('hero')"
          >
            添加首屏
          </button>
        </div>
      </div>
    </div>

    <div ref="listRef" class="mx-auto space-y-6 transition-all" :class="frameClass">
      <ComponentWrapper
        v-for="comp in store.components"
        :key="comp.id"
        :component="comp"
      />
    </div>
  </div>
</template>
