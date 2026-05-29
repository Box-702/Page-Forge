<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useHistory } from '@/composables/useHistory'

const store = useBuilderStore()
const { pushSnapshot } = useHistory()
const settings = computed(() => store.pageSettings)
let snapshotTimer: ReturnType<typeof setTimeout> | null = null

function set(key: keyof typeof settings.value, value: string) {
  store.updatePageSettings({ [key]: value })
  scheduleSnapshot()
}

function applyPreset(name: 'blue' | 'teal' | 'violet') {
  const presets = {
    blue: { primaryColor: '#2563eb', accentColor: '#0f172a', surfaceColor: '#ffffff', textColor: '#111827', backgroundColor: '#f8fafc' },
    teal: { primaryColor: '#0f766e', accentColor: '#134e4a', surfaceColor: '#f8fffc', textColor: '#10201d', backgroundColor: '#f2fbf7' },
    violet: { primaryColor: '#7c3aed', accentColor: '#312e81', surfaceColor: '#fdfbff', textColor: '#1f1833', backgroundColor: '#fbf7ff' },
  }
  store.updatePageSettings(presets[name])
  scheduleSnapshot()
}

function scheduleSnapshot() {
  if (snapshotTimer) clearTimeout(snapshotTimer)
  snapshotTimer = setTimeout(() => pushSnapshot(), 300)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="text-xs font-medium text-gray-500 block mb-2">主题预设</label>
      <div class="grid grid-cols-3 gap-2">
        <button class="rounded-lg border px-2 py-2 text-xs hover:bg-gray-50" @click="applyPreset('blue')">蓝色</button>
        <button class="rounded-lg border px-2 py-2 text-xs hover:bg-gray-50" @click="applyPreset('teal')">青绿</button>
        <button class="rounded-lg border px-2 py-2 text-xs hover:bg-gray-50" @click="applyPreset('violet')">紫色</button>
      </div>
    </div>

    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">页面标题</label>
      <input
        class="w-full border rounded-lg px-3 py-2 text-sm"
        :value="settings.title || ''"
        @input="set('title', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">页面描述</label>
      <textarea
        class="w-full border rounded-lg px-3 py-2 text-sm"
        rows="3"
        :value="settings.description || ''"
        @input="set('description', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">主色</label>
      <div class="flex gap-2">
        <input
          type="color"
          class="w-10 h-10 rounded border cursor-pointer"
          :value="settings.primaryColor"
          @input="set('primaryColor', ($event.target as HTMLInputElement).value)"
        />
        <input
          class="flex-1 border rounded-lg px-3 py-2 text-sm font-mono"
          :value="settings.primaryColor"
          @input="set('primaryColor', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">强调色</label>
      <div class="flex gap-2">
        <input type="color" class="w-10 h-10 rounded border cursor-pointer" :value="settings.accentColor || '#0f172a'" @input="set('accentColor', ($event.target as HTMLInputElement).value)" />
        <input class="flex-1 border rounded-lg px-3 py-2 text-sm font-mono" :value="settings.accentColor || ''" @input="set('accentColor', ($event.target as HTMLInputElement).value)" />
      </div>
    </div>

    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">表面色</label>
      <div class="flex gap-2">
        <input type="color" class="w-10 h-10 rounded border cursor-pointer" :value="settings.surfaceColor || '#ffffff'" @input="set('surfaceColor', ($event.target as HTMLInputElement).value)" />
        <input class="flex-1 border rounded-lg px-3 py-2 text-sm font-mono" :value="settings.surfaceColor || ''" @input="set('surfaceColor', ($event.target as HTMLInputElement).value)" />
      </div>
    </div>

    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">文字色</label>
      <div class="flex gap-2">
        <input type="color" class="w-10 h-10 rounded border cursor-pointer" :value="settings.textColor || '#111827'" @input="set('textColor', ($event.target as HTMLInputElement).value)" />
        <input class="flex-1 border rounded-lg px-3 py-2 text-sm font-mono" :value="settings.textColor || ''" @input="set('textColor', ($event.target as HTMLInputElement).value)" />
      </div>
    </div>

    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">页面背景</label>
      <div class="flex gap-2">
        <input
          type="color"
          class="w-10 h-10 rounded border cursor-pointer"
          :value="settings.backgroundColor"
          @input="set('backgroundColor', ($event.target as HTMLInputElement).value)"
        />
        <input
          class="flex-1 border rounded-lg px-3 py-2 text-sm font-mono"
          :value="settings.backgroundColor"
          @input="set('backgroundColor', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">字体</label>
      <select
        class="w-full border rounded-lg px-3 py-2 text-sm"
        :value="settings.fontFamily"
        @change="set('fontFamily', ($event.target as HTMLSelectElement).value)"
      >
        <option value="system-ui, sans-serif">系统默认</option>
        <option value="Inter, system-ui, sans-serif">Inter</option>
        <option value="Georgia, serif">Serif</option>
        <option value="'Courier New', monospace">Monospace</option>
      </select>
    </div>

    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">社交分享图 URL</label>
      <input class="w-full border rounded-lg px-3 py-2 text-sm" :value="settings.ogImage || ''" @input="set('ogImage', ($event.target as HTMLInputElement).value)" placeholder="https://..." />
    </div>

    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">Favicon URL</label>
      <input class="w-full border rounded-lg px-3 py-2 text-sm" :value="settings.faviconUrl || ''" @input="set('faviconUrl', ($event.target as HTMLInputElement).value)" placeholder="/favicon.ico" />
    </div>
  </div>
</template>
