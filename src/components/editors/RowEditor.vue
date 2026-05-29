<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useEditor } from '@/composables/useEditor'
import { resizeColumns } from '@/utils/rowColumns'

const store = useBuilderStore()
const { content, set } = useEditor()
const selected = computed(() => store.selectedComponent)

function setColumnCount(value: number) {
  if (!selected.value) return
  set('columns', resizeColumns(selected.value, value))
  set('columnCount', value)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">列数</label>
      <select
        class="w-full rounded-lg border px-3 py-2 text-sm"
        :value="content.columnCount"
        @change="setColumnCount(Number(($event.target as HTMLSelectElement).value))"
      >
        <option :value="1">1 列</option>
        <option :value="2">2 列</option>
        <option :value="3">3 列</option>
        <option :value="4">4 列</option>
      </select>
    </div>

    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">列间距</label>
      <input
        class="w-full rounded-lg border px-3 py-2 text-sm"
        :value="content.gap"
        @input="set('gap', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">垂直对齐</label>
      <select
        class="w-full rounded-lg border px-3 py-2 text-sm"
        :value="content.verticalAlign"
        @change="set('verticalAlign', ($event.target as HTMLSelectElement).value)"
      >
        <option value="start">顶部对齐</option>
        <option value="center">居中</option>
        <option value="stretch">拉伸</option>
      </select>
    </div>
  </div>
</template>
