<script setup lang="ts">
import type { PageComponent } from '@/types'
import { useBuilderStore } from '@/stores/builder'
import { useBuilder } from '@/composables/useBuilder'
import ComponentRenderer from './ComponentRenderer.vue'

const props = defineProps<{
  component: PageComponent
}>()

const store = useBuilderStore()
const { remove, duplicate } = useBuilder()

const isSelected = () => store.selectedId === props.component.id
</script>

<template>
  <div
    :data-id="component.id"
    class="relative group rounded-lg transition-colors"
    :class="[
      isSelected() && !store.isPreview ? 'border-2 border-blue-500' : store.isPreview ? '' : 'border-2 border-transparent',
    ]"
    @click.stop="!store.isPreview && store.selectComponent(component.id)"
  >
    <!-- 操作按钮（预览模式隐藏） -->
    <div
      v-if="!store.isPreview"
      class="absolute -top-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
    >
      <button
        class="px-2 py-0.5 text-xs bg-white border rounded shadow-sm hover:bg-gray-50"
        @click.stop="duplicate(component.id)"
      >
        复制
      </button>
      <button
        class="px-2 py-0.5 text-xs bg-white border rounded shadow-sm hover:bg-red-50 hover:text-red-600"
        @click.stop="remove(component.id)"
      >
        删除
      </button>
    </div>

    <!-- 拖拽手柄（预览模式隐藏） -->
    <div
      v-if="!store.isPreview"
      class="drag-handle cursor-grab absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
    >
      <span class="text-gray-500 text-xs">::</span>
    </div>

    <ComponentRenderer :component="component" />
  </div>
</template>
