<script setup lang="ts">
import { useEditor } from '@/composables/useEditor'

const { content, set } = useEditor()
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">大标题</label>
      <input class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.title" @input="set('title', ($event.target as HTMLInputElement).value)" />
    </div>
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">副标题</label>
      <textarea class="w-full rounded-lg border px-3 py-2 text-sm" rows="3" :value="content.subtitle" @input="set('subtitle', ($event.target as HTMLTextAreaElement).value)" />
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-500">按钮文字</label>
        <input class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.ctaText" @input="set('ctaText', ($event.target as HTMLInputElement).value)" />
      </div>
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-500">按钮样式</label>
        <select class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.ctaVariant || 'primary'" @change="set('ctaVariant', ($event.target as HTMLSelectElement).value)">
          <option value="primary">主按钮</option>
          <option value="dark">深色</option>
          <option value="light">浅色</option>
        </select>
      </div>
    </div>
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">按钮链接</label>
      <input class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.ctaLink" @input="set('ctaLink', ($event.target as HTMLInputElement).value)" />
    </div>
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">对齐方式</label>
      <select class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.alignment" @change="set('alignment', ($event.target as HTMLSelectElement).value)">
        <option value="left">左对齐</option>
        <option value="center">居中</option>
      </select>
    </div>
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">配图 URL</label>
      <input class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.imageUrl" @input="set('imageUrl', ($event.target as HTMLInputElement).value)" placeholder="https://..." />
      <img v-if="content.imageUrl" :src="content.imageUrl" class="mt-2 aspect-video w-full rounded-lg border object-cover" alt="配图预览" />
    </div>
  </div>
</template>
