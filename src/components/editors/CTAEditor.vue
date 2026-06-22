<script setup lang="ts">
import { useEditor } from '@/composables/useEditor'
import AIRewriteButton from '../builder/AIRewriteButton.vue'

const { content, set } = useEditor()
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between -mb-2">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">文案</p>
      <AIRewriteButton />
    </div>
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">标题</label>
      <input class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.title" @input="set('title', ($event.target as HTMLInputElement).value)" />
    </div>
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">说明</label>
      <textarea class="w-full rounded-lg border px-3 py-2 text-sm" rows="3" :value="content.subtitle" @input="set('subtitle', ($event.target as HTMLTextAreaElement).value)" />
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-500">按钮文字</label>
        <input class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.ctaText" @input="set('ctaText', ($event.target as HTMLInputElement).value)" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-500">按钮样式</label>
        <select class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.ctaVariant || 'light'" @change="set('ctaVariant', ($event.target as HTMLSelectElement).value)">
          <option value="light">浅色</option>
          <option value="dark">深色</option>
          <option value="outline">描边</option>
        </select>
      </div>
    </div>
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">按钮链接</label>
      <input class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.ctaLink" @input="set('ctaLink', ($event.target as HTMLInputElement).value)" />
    </div>
  </div>
</template>
