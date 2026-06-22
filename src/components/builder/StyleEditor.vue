<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useAIStore } from '@/stores/ai'
import { useHistory } from '@/composables/useHistory'
import { gradientPresets } from '@/data/visualPresets'
import DecorationPicker from './DecorationPicker.vue'

const store = useBuilderStore()
const ai = useAIStore()
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

function parseAlpha(val: string | undefined, fallback: number): number {
  if (!val) return fallback
  const m = val.match(/rgba?\([^)]*?,\s*([\d.]+)\s*\)/)
  if (!m) return fallback
  const n = parseFloat(m[1])
  return isNaN(n) ? fallback : Math.round(n * 100)
}

function setOverlayAlpha(percent: number) {
  const m = (styles.value.bgOverlay || 'rgba(0,0,0,0.4)').match(/rgba?\(([^)]+)\)/)
  if (!m) {
    set('bgOverlay', `rgba(0,0,0,${(percent / 100).toFixed(2)})`)
    return
  }
  const parts = m[1].split(',').map(s => s.trim())
  const rgb = parts.slice(0, 3).join(',')
  set('bgOverlay', `rgba(${rgb}, ${(percent / 100).toFixed(2)})`)
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
const animationOptions = [
  { label: '无', value: undefined },
  { label: '淡入', value: 'fade-in' },
  { label: '上滑', value: 'slide-up' },
  { label: '悬浮', value: 'float' },
]
const patternOptions = [
  { label: '无', value: undefined },
  { label: '圆点', value: 'dots' },
  { label: '网格', value: 'grid' },
]
const bgAttachmentOptions = [
  { label: '随滚动', value: undefined },
  { label: '固定视差', value: 'fixed' },
]

const currentGradientId = computed(() => {
  const g = styles.value.bgGradient
  if (!g) return undefined
  const match = gradientPresets.find(p => p.gradient === g)
  return match?.id
})
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
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-xs font-medium text-gray-700">背景图 URL</label>
        <button
          class="text-xs px-2 py-0.5 rounded text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-40"
          :disabled="!ai.stabilityReady"
          @click="store.aiImageTargetField = 'bgImage'; store.showAIImageModal = true"
        >✨ AI 生图</button>
      </div>
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

    <div class="pt-3 mt-3 border-t border-gray-200">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">视觉增强</p>
    </div>

    <!-- 渐变背景 -->
    <div>
      <label class="text-xs font-medium text-gray-700 block mb-1.5">渐变背景</label>
      <div class="grid grid-cols-5 gap-1.5 mb-2">
        <button
          v-for="p in gradientPresets"
          :key="p.id"
          type="button"
          class="h-8 rounded border-2 transition-all"
          :class="currentGradientId === p.id ? 'border-blue-500 scale-105' : 'border-gray-200 hover:border-gray-400'"
          :style="{ backgroundImage: p.gradient }"
          :title="p.label"
          @click="set('bgGradient', p.gradient)"
        ></button>
        <button
          type="button"
          class="h-8 rounded border-2 border-dashed text-xs text-gray-500 hover:border-gray-400"
          :class="!currentGradientId && styles.bgGradient ? 'border-blue-500' : 'border-gray-300'"
          title="清除渐变"
          @click="set('bgGradient', undefined)"
        >×</button>
      </div>
      <input class="w-full border rounded-lg px-3 py-1.5 text-xs font-mono"
        :value="styles.bgGradient || ''"
        @input="set('bgGradient', ($event.target as HTMLInputElement).value || undefined)"
        placeholder="自定义 gradient,如 linear-gradient(...)" />
    </div>

    <!-- 背景遮罩 -->
    <div>
      <div class="flex justify-between mb-1">
        <label class="text-xs font-medium text-gray-700">背景遮罩</label>
        <span class="text-xs text-gray-400">
          {{ styles.bgOverlay ? `${parseAlpha(styles.bgOverlay, 40)}%` : '未设置' }}
        </span>
      </div>
      <input type="range" min="0" max="90" step="5" class="w-full"
        :disabled="!styles.bgGradient && !styles.bgImage"
        :value="parseAlpha(styles.bgOverlay, 40)"
        @input="setOverlayAlpha(parseInt(($event.target as HTMLInputElement).value))" />
      <p class="text-[10px] text-gray-400 mt-1">仅在有渐变或背景图时生效</p>
    </div>

    <!-- 背景图案 -->
    <div>
      <label class="text-xs font-medium text-gray-700 block mb-1.5">背景图案</label>
      <select class="w-full border rounded-lg px-3 py-2 text-sm"
        :value="styles.bgPattern"
        @change="set('bgPattern', ($event.target as HTMLSelectElement).value || undefined)">
        <option v-for="opt in patternOptions" :key="opt.label" :value="opt.value ?? ''">{{ opt.label }}</option>
      </select>
    </div>

    <!-- 背景滚动 -->
    <div>
      <label class="text-xs font-medium text-gray-700 block mb-1.5">背景滚动</label>
      <select class="w-full border rounded-lg px-3 py-2 text-sm"
        :value="styles.bgAttachment"
        @change="set('bgAttachment', ($event.target as HTMLSelectElement).value || undefined)">
        <option v-for="opt in bgAttachmentOptions" :key="opt.label" :value="opt.value ?? ''">{{ opt.label }}</option>
      </select>
    </div>

    <!-- 装饰 -->
    <div>
      <label class="text-xs font-medium text-gray-700 block mb-1.5">装饰元素</label>
      <DecorationPicker
        :model-value="styles.decoration"
        @update:model-value="set('decoration', $event)"
      />
    </div>

    <!-- 动效 -->
    <div>
      <label class="text-xs font-medium text-gray-700 block mb-1.5">入场动效</label>
      <select class="w-full border rounded-lg px-3 py-2 text-sm"
        :value="styles.animation"
        @change="set('animation', ($event.target as HTMLSelectElement).value || undefined)">
        <option v-for="opt in animationOptions" :key="opt.label" :value="opt.value ?? ''">{{ opt.label }}</option>
      </select>
    </div>
  </div>
</template>
