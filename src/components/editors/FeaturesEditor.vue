<script setup lang="ts">
import { useEditor } from '@/composables/useEditor'

const { content, set } = useEditor()

function addFeature() {
  set('features', [...(content.value.features || []), { id: crypto.randomUUID(), icon: ':', title: '新特性', description: '描述这个能力带来的价值' }])
}

function removeFeature(index: number) {
  const list = [...(content.value.features || [])]
  list.splice(index, 1)
  set('features', list)
}

function updateFeature(index: number, key: string, value: string) {
  const list = [...(content.value.features || [])]
  list[index] = { ...list[index], [key]: value }
  set('features', list)
}

function moveFeature(index: number, direction: -1 | 1) {
  const list = [...(content.value.features || [])]
  const next = index + direction
  if (next < 0 || next >= list.length) return
  ;[list[index], list[next]] = [list[next], list[index]]
  set('features', list)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">标题</label>
      <input class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.title" @input="set('title', ($event.target as HTMLInputElement).value)" />
    </div>
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">副标题</label>
      <textarea class="w-full rounded-lg border px-3 py-2 text-sm" rows="2" :value="content.subtitle" @input="set('subtitle', ($event.target as HTMLTextAreaElement).value)" />
    </div>
    <div>
      <label class="mb-1 block text-xs font-medium text-gray-500">列数</label>
      <select class="w-full rounded-lg border px-3 py-2 text-sm" :value="content.columns || 3" @change="set('columns', Number(($event.target as HTMLSelectElement).value))">
        <option :value="2">2 列</option>
        <option :value="3">3 列</option>
        <option :value="4">4 列</option>
      </select>
    </div>

    <div class="border-t pt-3">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-xs font-medium text-gray-500">特性列表</span>
        <button class="text-xs text-blue-600 hover:text-blue-700" @click="addFeature">+ 添加</button>
      </div>
      <div v-for="(feat, i) in (content.features || [])" :key="feat?.id || i" class="mb-2 space-y-2 rounded-lg border p-3">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">特性 {{ i + 1 }}</span>
          <div class="flex gap-2 text-xs">
            <button class="text-gray-500 hover:text-gray-900" @click="moveFeature(i, -1)">上移</button>
            <button class="text-gray-500 hover:text-gray-900" @click="moveFeature(i, 1)">下移</button>
            <button class="text-red-500 hover:text-red-600" @click="removeFeature(i)">删除</button>
          </div>
        </div>
        <input class="w-full rounded border px-2 py-1 text-xs" :value="feat.icon" @input="updateFeature(i, 'icon', ($event.target as HTMLInputElement).value)" placeholder="图标或图片 URL" />
        <img v-if="feat.icon?.startsWith('http')" :src="feat.icon" class="h-16 w-16 rounded border object-cover" alt="图标预览" />
        <input class="w-full rounded border px-2 py-1 text-xs" :value="feat.title" @input="updateFeature(i, 'title', ($event.target as HTMLInputElement).value)" placeholder="标题" />
        <textarea class="w-full rounded border px-2 py-1 text-xs" rows="2" :value="feat.description" @input="updateFeature(i, 'description', ($event.target as HTMLTextAreaElement).value)" placeholder="描述" />
      </div>
    </div>
  </div>
</template>
