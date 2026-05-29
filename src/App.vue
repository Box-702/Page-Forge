<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import BuilderLayout from './components/builder/BuilderLayout.vue'
import { useBuilderStore } from './stores/builder'
import { useHistory } from './composables/useHistory'
import { useLocalStorage } from './composables/useLocalStorage'

const store = useBuilderStore()
const { onKeydown } = useHistory()
const { saveDebounced, load } = useLocalStorage()

// 启动时从 localStorage 恢复
const saved = load()
if (saved) store.loadFromStorage(saved)
store.saveHistory()

// 全局键盘快捷键
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

watch(
  () => [store.components, store.pageSettings],
  () => saveDebounced(store.components, store.pageSettings),
  { deep: true }
)
</script>

<template>
  <BuilderLayout />
</template>
