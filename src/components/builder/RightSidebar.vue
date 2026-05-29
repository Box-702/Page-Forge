<script setup lang="ts">
import { useBuilderStore } from '@/stores/builder'
import StyleEditor from './StyleEditor.vue'
import ContentEditor from './ContentEditor.vue'
import PageSettingsEditor from './PageSettingsEditor.vue'

const store = useBuilderStore()
</script>

<template>
  <div
    class="w-80 bg-white border-l overflow-y-auto flex-shrink-0"
  >
    <!-- Tab 切换 -->
    <div class="flex border-b sticky top-0 bg-white z-10">
      <button
        class="flex-1 py-3 text-sm font-medium border-b-2 transition-colors"
        :class="store.sidebarTab === 'content'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="store.sidebarTab = 'content'"
      >
        内容
      </button>
      <button
        class="flex-1 py-3 text-sm font-medium border-b-2 transition-colors"
        :class="store.sidebarTab === 'style'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="store.sidebarTab = 'style'"
      >
        样式
      </button>
      <button
        class="flex-1 py-3 text-sm font-medium border-b-2 transition-colors"
        :class="store.sidebarTab === 'page'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="store.sidebarTab = 'page'"
      >
        页面
      </button>
    </div>

    <!-- 面板内容 -->
    <div class="p-4">
      <ContentEditor v-if="store.sidebarTab === 'content' && store.selectedId" />
      <StyleEditor v-else-if="store.sidebarTab === 'style' && store.selectedId" />
      <PageSettingsEditor v-else />
    </div>
  </div>
</template>
