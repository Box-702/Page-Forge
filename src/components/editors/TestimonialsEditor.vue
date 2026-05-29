<script setup lang="ts">
import { useEditor } from '@/composables/useEditor'

const { content, set } = useEditor()

function addItem() {
  set('testimonials', [...(content.value.testimonials || []), { id: crypto.randomUUID(), quote: '评价内容', name: '姓名', title: '职位', avatarUrl: '' }])
}

function removeItem(index: number) {
  const list = [...(content.value.testimonials || [])]
  list.splice(index, 1)
  set('testimonials', list)
}

function updateItem(index: number, key: string, value: string) {
  const list = [...(content.value.testimonials || [])]
  list[index] = { ...list[index], [key]: value }
  set('testimonials', list)
}

function moveItem(index: number, direction: -1 | 1) {
  const list = [...(content.value.testimonials || [])]
  const next = index + direction
  if (next < 0 || next >= list.length) return
  ;[list[index], list[next]] = [list[next], list[index]]
  set('testimonials', list)
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
      </select>
    </div>

    <div class="border-t pt-3">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-xs font-medium text-gray-500">评价列表</span>
        <button class="text-xs text-blue-600 hover:text-blue-700" @click="addItem">+ 添加</button>
      </div>
      <div v-for="(item, i) in (content.testimonials || [])" :key="item?.id || i" class="mb-2 space-y-2 rounded-lg border p-3">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">评价 {{ i + 1 }}</span>
          <div class="flex gap-2 text-xs">
            <button class="text-gray-500 hover:text-gray-900" @click="moveItem(i, -1)">上移</button>
            <button class="text-gray-500 hover:text-gray-900" @click="moveItem(i, 1)">下移</button>
            <button class="text-red-500 hover:text-red-600" @click="removeItem(i)">删除</button>
          </div>
        </div>
        <textarea class="w-full rounded border px-2 py-1 text-xs" rows="2" :value="item.quote" @input="updateItem(i, 'quote', ($event.target as HTMLTextAreaElement).value)" placeholder="评价内容" />
        <input class="w-full rounded border px-2 py-1 text-xs" :value="item.name" @input="updateItem(i, 'name', ($event.target as HTMLInputElement).value)" placeholder="姓名" />
        <input class="w-full rounded border px-2 py-1 text-xs" :value="item.title" @input="updateItem(i, 'title', ($event.target as HTMLInputElement).value)" placeholder="职位" />
        <input class="w-full rounded border px-2 py-1 text-xs" :value="item.avatarUrl" @input="updateItem(i, 'avatarUrl', ($event.target as HTMLInputElement).value)" placeholder="头像 URL" />
        <img v-if="item.avatarUrl" :src="item.avatarUrl" class="h-16 w-16 rounded-full border object-cover" alt="头像预览" />
      </div>
    </div>
  </div>
</template>
