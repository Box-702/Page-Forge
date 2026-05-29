<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useBuilder } from '@/composables/useBuilder'

const store = useBuilderStore()
const { add } = useBuilder()
const addingToRow = computed(() => store.selectedComponent?.type === 'row')

const blockTypes = [
  { type: 'hero', label: 'Hero', desc: '首屏标题、说明和行动按钮' },
  { type: 'features', label: 'Features', desc: '产品能力或卖点列表' },
  { type: 'pricing', label: 'Pricing', desc: '套餐和价格对比' },
  { type: 'cta', label: 'CTA', desc: '转化行动区块' },
  { type: 'testimonials', label: 'Testimonials', desc: '用户评价和社会证明' },
  { type: 'faq', label: 'FAQ', desc: '常见问题和回答' },
  { type: 'footer', label: 'Footer', desc: '页脚链接和版权信息' },
  { type: 'row', label: 'Row', desc: '多列容器，可嵌套区块' },
]

function onSelect(type: string) {
  add(type)
  store.showAddModal = false
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    @click.self="store.showAddModal = false"
  >
    <div class="w-full max-w-xl rounded-lg bg-white shadow-xl">
      <div class="flex items-start justify-between border-b px-6 py-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">添加区块</h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ addingToRow ? '当前区块会添加到选中的 Row 容器中。' : '选择一个区块加入页面。' }}
          </p>
        </div>
        <button class="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100" @click="store.showAddModal = false">
          关闭
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 p-6">
        <button
          v-for="bt in blockTypes"
          :key="bt.type"
          class="rounded-lg border p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
          @click="onSelect(bt.type)"
        >
          <span class="block text-sm font-semibold text-gray-900">{{ bt.label }}</span>
          <span class="mt-1 block text-xs leading-5 text-gray-500">{{ bt.desc }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
