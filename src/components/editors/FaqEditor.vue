<script setup lang="ts">
import { useEditor } from '@/composables/useEditor'
import AIRewriteButton from '../builder/AIRewriteButton.vue'

const { content, set } = useEditor()

function addFaq() {
  set('faqs', [...(content.value.faqs || []), { id: crypto.randomUUID(), question: '新问题', answer: '回答内容' }])
}

function removeFaq(index: number) {
  const list = [...(content.value.faqs || [])]
  list.splice(index, 1)
  set('faqs', list)
}

function updateFaq(index: number, key: string, value: string) {
  const list = [...(content.value.faqs || [])]
  list[index] = { ...list[index], [key]: value }
  set('faqs', list)
}

function moveFaq(index: number, direction: -1 | 1) {
  const list = [...(content.value.faqs || [])]
  const next = index + direction
  if (next < 0 || next >= list.length) return
  ;[list[index], list[next]] = [list[next], list[index]]
  set('faqs', list)
}
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
      <label class="mb-1 block text-xs font-medium text-gray-500">副标题</label>
      <textarea class="w-full rounded-lg border px-3 py-2 text-sm" rows="2" :value="content.subtitle" @input="set('subtitle', ($event.target as HTMLTextAreaElement).value)" />
    </div>

    <div class="border-t pt-3">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-xs font-medium text-gray-500">问答列表</span>
        <button class="text-xs text-blue-600 hover:text-blue-700" @click="addFaq">+ 添加</button>
      </div>
      <div v-for="(faq, i) in (content.faqs || [])" :key="faq?.id || i" class="mb-2 space-y-2 rounded-lg border p-3">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">问答 {{ i + 1 }}</span>
          <div class="flex gap-2 text-xs">
            <button class="text-gray-500 hover:text-gray-900" @click="moveFaq(i, -1)">上移</button>
            <button class="text-gray-500 hover:text-gray-900" @click="moveFaq(i, 1)">下移</button>
            <button class="text-red-500 hover:text-red-600" @click="removeFaq(i)">删除</button>
          </div>
        </div>
        <input class="w-full rounded border px-2 py-1 text-xs font-medium" :value="faq.question" @input="updateFaq(i, 'question', ($event.target as HTMLInputElement).value)" placeholder="问题" />
        <textarea class="w-full rounded border px-2 py-1 text-xs" rows="3" :value="faq.answer" @input="updateFaq(i, 'answer', ($event.target as HTMLTextAreaElement).value)" placeholder="回答" />
      </div>
    </div>
  </div>
</template>
