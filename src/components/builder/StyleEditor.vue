<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useHistory } from '@/composables/useHistory'

const store = useBuilderStore()
const { pushSnapshot } = useHistory()
const styles = computed(() => store.selectedComponent?.styles ?? {})
let snapshotTimer: ReturnType<typeof setTimeout> | null = null

function set(key: string, value: string | undefined) {
  if (!store.selectedId) return
  store.updateComponent(store.selectedId, { styles: { ...styles.value, [key]: value || undefined } })
  scheduleSnapshot()
}

function scheduleSnapshot() {
  if (snapshotTimer) clearTimeout(snapshotTimer)
  snapshotTimer = setTimeout(() => pushSnapshot(), 300)
}

function parsePx(val: string | undefined, fallback: number): number {
  if (!val) return fallback
  const n = parseInt(val)
  return isNaN(n) ? fallback : n
}

// 固定预设选项
const shadowOptions = [
  { label: '无', value: undefined },
  { label: '小', value: 'shadow-sm' },
  { label: '中', value: 'shadow-md' },
  { label: '大', value: 'shadow-lg' },
  { label: '超大', value: 'shadow-xl' },
]
const alignOptions = [
  { label: '左', value: 'text-left' },
  { label: '中', value: 'text-center' },
  { label: '右', value: 'text-right' },
]
const maxWidthOptions = [
  { label: '无限制', value: undefined },
  { label: '窄 800px', value: 'max-w-4xl' },
  { label: '中 1024px', value: 'max-w-6xl' },
  { label: '宽 1280px', value: 'max-w-7xl' },
]
</script>

<template>
  <div class="space-y-4">
    <!-- 背景色 -->
    <div>
      <label class="text-xs font-medium text-gray-700 block mb-1.5">背景色</label>
      <div class="flex gap-2 items-center">
        <input type="color" class="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
          :value="styles.bgColor || '#ffffff'"
          @input="set('bgColor', ($event.target as HTMLInputElement).value)" />
        <input class="flex-1 border rounded px-2 py-1.5 text-xs font-mono"
          :value="styles.bgColor || ''"
          @input="set('bgColor', ($event.target as HTMLInputElement).value || undefined)"
          placeholder="#ffffff" />
      </div>
    </div>

    <!-- 文字颜色 -->
    <div>
      <label class="text-xs font-medium text-gray-700 block mb-1.5">文字颜色</label>
      <div class="flex gap-2 items-center">
        <input type="color" class="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
          :value="styles.textColor || '#111827'"
          @input="set('textColor', ($event.target as HTMLInputElement).value)" />
        <input class="flex-1 border rounded px-2 py-1.5 text-xs font-mono"
          :value="styles.textColor || ''"
          @input="set('textColor', ($event.target as HTMLInputElement).value || undefined)"
          placeholder="#111827" />
      </div>
    </div>

    <!-- 标题字号 -->
    <div>
      <div class="flex justify-between mb-1">
        <label class="text-xs font-medium text-gray-700">标题字号</label>
        <span class="text-xs text-gray-400">{{ parsePx(styles.titleFontSize, 36) }}px</span>
      </div>
      <input type="range" min="12" max="96" step="2" class="w-full"
        :value="parsePx(styles.titleFontSize, 36)"
        @input="set('titleFontSize', ($event.target as HTMLInputElement).value + 'px')" />
    </div>

    <!-- 正文字号 -->
    <div>
      <div class="flex justify-between mb-1">
        <label class="text-xs font-medium text-gray-700">正文字号</label>
        <span class="text-xs text-gray-400">{{ parsePx(styles.bodyFontSize, 18) }}px</span>
      </div>
      <input type="range" min="10" max="48" step="1" class="w-full"
        :value="parsePx(styles.bodyFontSize, 18)"
        @input="set('bodyFontSize', ($event.target as HTMLInputElement).value + 'px')" />
    </div>

    <!-- 上内边距 -->
    <div>
      <div class="flex justify-between mb-1">
        <label class="text-xs font-medium text-gray-700">上内边距</label>
        <span class="text-xs text-gray-400">{{ parsePx(styles.paddingTop, 64) }}px</span>
      </div>
      <input type="range" min="0" max="200" step="4" class="w-full"
        :value="parsePx(styles.paddingTop, 64)"
        @input="set('paddingTop', ($event.target as HTMLInputElement).value + 'px')" />
    </div>

    <!-- 下内边距 -->
    <div>
      <div class="flex justify-between mb-1">
        <label class="text-xs font-medium text-gray-700">下内边距</label>
        <span class="text-xs text-gray-400">{{ parsePx(styles.paddingBottom, 64) }}px</span>
      </div>
      <input type="range" min="0" max="200" step="4" class="w-full"
        :value="parsePx(styles.paddingBottom, 64)"
        @input="set('paddingBottom', ($event.target as HTMLInputElement).value + 'px')" />
    </div>

    <!-- 左内边距 -->
    <div>
      <div class="flex justify-between mb-1">
        <label class="text-xs font-medium text-gray-700">左内边距</label>
        <span class="text-xs text-gray-400">{{ parsePx(styles.paddingLeft, 0) }}px</span>
      </div>
      <input type="range" min="0" max="200" step="4" class="w-full"
        :value="parsePx(styles.paddingLeft, 0)"
        @input="set('paddingLeft', ($event.target as HTMLInputElement).value + 'px')" />
    </div>

    <!-- 右内边距 -->
    <div>
      <div class="flex justify-between mb-1">
        <label class="text-xs font-medium text-gray-700">右内边距</label>
        <span class="text-xs text-gray-400">{{ parsePx(styles.paddingRight, 0) }}px</span>
      </div>
      <input type="range" min="0" max="200" step="4" class="w-full"
        :value="parsePx(styles.paddingRight, 0)"
        @input="set('paddingRight', ($event.target as HTMLInputElement).value + 'px')" />
    </div>

    <!-- 圆角 -->
    <div>
      <div class="flex justify-between mb-1">
        <label class="text-xs font-medium text-gray-700">圆角</label>
        <span class="text-xs text-gray-400">{{ parsePx(styles.borderRadius, 8) }}px</span>
      </div>
      <input type="range" min="0" max="80" step="2" class="w-full"
        :value="parsePx(styles.borderRadius, 8)"
        @input="set('borderRadius', ($event.target as HTMLInputElement).value + 'px')" />
    </div>

    <!-- 背景图 -->
    <div>
      <label class="text-xs font-medium text-gray-700 block mb-1.5">背景图 URL</label>
      <input class="w-full border rounded-lg px-3 py-2 text-xs"
        :value="styles.bgImage || ''"
        @input="set('bgImage', ($event.target as HTMLInputElement).value || undefined)"
        placeholder="https://..." />
    </div>

    <!-- 阴影 -->
    <div>
      <label class="text-xs font-medium text-gray-700 block mb-1.5">阴影</label>
      <select class="w-full border rounded-lg px-3 py-2 text-sm"
        :value="styles.shadow"
        @change="set('shadow', ($event.target as HTMLSelectElement).value || undefined)">
        <option v-for="opt in shadowOptions" :key="opt.label" :value="opt.value ?? ''">{{ opt.label }}</option>
      </select>
    </div>

    <!-- 文字对齐 -->
    <div>
      <label class="text-xs font-medium text-gray-700 block mb-1.5">文字对齐</label>
      <select class="w-full border rounded-lg px-3 py-2 text-sm"
        :value="styles.textAlign"
        @change="set('textAlign', ($event.target as HTMLSelectElement).value || undefined)">
        <option v-for="opt in alignOptions" :key="opt.label" :value="opt.value ?? ''">{{ opt.label }}</option>
      </select>
    </div>

    <!-- 最大宽度 -->
    <div>
      <label class="text-xs font-medium text-gray-700 block mb-1.5">内容最大宽度</label>
      <select class="w-full border rounded-lg px-3 py-2 text-sm"
        :value="styles.maxWidth"
        @change="set('maxWidth', ($event.target as HTMLSelectElement).value || undefined)">
        <option v-for="opt in maxWidthOptions" :key="opt.label" :value="opt.value ?? ''">{{ opt.label }}</option>
      </select>
    </div>
  </div>
</template>
