<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import BuilderLayout from './components/builder/BuilderLayout.vue'
import { useBuilderStore } from './stores/builder'
import { useHistory } from './composables/useHistory'
import { useLocalStorage } from './composables/useLocalStorage'

const store = useBuilderStore()
const { onKeydown } = useHistory()
const { save, load } = useLocalStorage()

// 启动时从 localStorage 恢复
const saved = load()
if (saved) store.loadFromStorage(saved)
store.saveHistory()

// 全局键盘快捷键
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

// 自动保存：数据变化时 500ms 防抖写入 localStorage
let timer: ReturnType<typeof setTimeout> | null = null
watch(
  () => [store.components, store.pageSettings],
  () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => save(store.components, store.pageSettings), 500)
  },
  { deep: true }
)
</script>

<template>
  <BuilderLayout />
</template>
