<script setup lang="ts">
import { useEditor } from '@/composables/useEditor'
import AIRewriteButton from '../builder/AIRewriteButton.vue'

const { content, set } = useEditor()

function addLink() {
  const links = [...(content.value.links || [])]
  links.push({ id: crypto.randomUUID(), title: '新链接', url: '#' })
  set('links', links)
}

function removeLink(index: number) {
  const links = [...(content.value.links || [])]
  links.splice(index, 1)
  set('links', links)
}

function updateLink(index: number, key: string, value: string) {
  const links = [...(content.value.links || [])]
  links[index] = { ...links[index], [key]: value }
  set('links', links)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between -mb-2">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">文案</p>
      <AIRewriteButton />
    </div>
    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">公司名称</label>
      <input class="w-full border rounded-lg px-3 py-2 text-sm"
        :value="content.companyName" @input="set('companyName', ($event.target as HTMLInputElement).value)" />
    </div>
    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">描述</label>
      <textarea class="w-full border rounded-lg px-3 py-2 text-sm" rows="2"
        :value="content.description" @input="set('description', ($event.target as HTMLTextAreaElement).value)" />
    </div>
    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">版权信息</label>
      <input class="w-full border rounded-lg px-3 py-2 text-sm"
        :value="content.copyright" @input="set('copyright', ($event.target as HTMLInputElement).value)" />
    </div>

    <div class="border-t pt-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-gray-500">链接列表</span>
        <button class="text-xs text-blue-600 hover:text-blue-700" @click="addLink">+ 添加</button>
      </div>

      <div v-for="(link, i) in content.links" :key="i" class="flex gap-2 items-center mb-2">
        <input class="flex-1 border rounded px-2 py-1 text-xs" :value="link.title" @input="updateLink(i, 'title', ($event.target as HTMLInputElement).value)" placeholder="名称" />
        <input class="flex-1 border rounded px-2 py-1 text-xs" :value="link.url" @input="updateLink(i, 'url', ($event.target as HTMLInputElement).value)" placeholder="URL" />
        <button class="text-xs text-red-500 hover:text-red-600 flex-shrink-0" @click="removeLink(i)">删除</button>
      </div>
    </div>
  </div>
</template>
