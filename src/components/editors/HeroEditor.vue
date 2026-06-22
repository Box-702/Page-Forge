<script setup lang="ts">
import { useEditor } from '@/composables/useEditor'
import { useBuilderStore } from '@/stores/builder'
import { useAIStore } from '@/stores/ai'

const { content, set } = useEditor()
const builder = useBuilderStore()
const ai = useAIStore()

function openAIRewrite() {
  builder.aiRewriteTargetId = builder.selectedId
  builder.showAIRewriteModal = true
}

function openAIImage() {
  builder.aiImageTargetField = 'imageUrl'
  builder.showAIImageModal = true
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between -mb-2">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">文案</p>
      <button
        class="text-xs px-2 py-1 rounded text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-40"
        :disabled="!ai.anthropicReady"
        :title="ai.anthropicReady ? '用 AI 改写' : '请先配置 Claude key'"
        @click="openAIRewrite"
      >✨ AI 改写</button>
    </div>
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
      <div class="flex items-center justify-between mb-1">
        <label class="text-xs font-medium text-gray-500">配图 URL</label>
        <button
          class="text-xs px-2 py-1 rounded text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-40"
          :disabled="!ai.stabilityReady"
          :title="ai.stabilityReady ? 'AI 生图' : '请先在 AI 设置中配置 Stability key'"
          @click="openAIImage"
        >✨ AI 生图</button>
      </div>
      <input class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.imageUrl" @input="set('imageUrl', ($event.target as HTMLInputElement).value)" placeholder="https://..." />
      <img v-if="content.imageUrl" :src="content.imageUrl" class="mt-2 aspect-video w-full rounded-lg border object-cover" alt="配图预览" />
    </div>
  </div>
</template>
