<script setup lang="ts">
import { ref } from 'vue'
import Toolbar from './Toolbar.vue'
import BuilderCanvas from './BuilderCanvas.vue'
import RightSidebar from './RightSidebar.vue'
import AddBlockModal from './AddBlockModal.vue'
import TemplateModal from './TemplateModal.vue'
import ExportCheckPanel from './ExportCheckPanel.vue'
import ProjectManagerModal from './ProjectManagerModal.vue'
import { useBuilderStore } from '@/stores/builder'

const store = useBuilderStore()
const sidebarOpen = ref(true)
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <Toolbar />

    <div class="flex flex-1 overflow-hidden">
      <BuilderCanvas />

      <!-- 折叠按钮 -->
      <button
        v-if="!store.isPreview"
        class="flex-shrink-0 w-6 bg-white border-l hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer"
        :title="sidebarOpen ? '收起面板' : '展开面板'"
        @click="sidebarOpen = !sidebarOpen"
      >
        <span class="text-gray-400 text-xs">{{ sidebarOpen ? '◀' : '▶' }}</span>
      </button>

      <!-- 右侧面板（可折叠） -->
      <Transition name="sidebar">
        <RightSidebar v-if="!store.isPreview && sidebarOpen" />
      </Transition>
    </div>

    <AddBlockModal v-if="store.showAddModal && !store.isPreview" />
    <TemplateModal v-if="store.showTemplateModal && !store.isPreview" />
    <ExportCheckPanel v-if="store.showCheckPanel" />
    <ProjectManagerModal v-if="store.showProjectModal && !store.isPreview" />
  </div>
</template>

<style scoped>
.sidebar-enter-active,
.sidebar-leave-active {
  transition: width 0.2s ease, opacity 0.15s ease;
}
.sidebar-enter-from,
.sidebar-leave-to {
  width: 0;
  opacity: 0;
}
</style>
