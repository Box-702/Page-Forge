<script setup lang="ts">
import { ref } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useAIStore } from '@/stores/ai'
import { useExport } from '@/composables/useExport'
import { useHistory } from '@/composables/useHistory'
import { useLocalStorage } from '@/composables/useLocalStorage'

const store = useBuilderStore()
const ai = useAIStore()
const { downloadHTML, downloadProject, readProjectFile } = useExport()
const { handleUndo, handleRedo } = useHistory()
const { save } = useLocalStorage()
const importInput = ref<HTMLInputElement | null>(null)

const previewModes = [
  { value: 'desktop', label: '桌面' },
  { value: 'tablet', label: '平板' },
  { value: 'mobile', label: '手机' },
] as const

async function onImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const project = await readProjectFile(file)
    store.replaceProject(project)
    save(store.components, store.pageSettings)
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '导入失败，请检查文件格式。')
  } finally {
    input.value = ''
  }
}
</script>

<template>
  <div class="h-14 flex-shrink-0 border-b bg-white px-4">
    <div class="flex h-full items-center gap-2">
      <button class="mr-3 text-left" @click="store.sidebarTab = 'page'">
        <span class="block text-sm font-bold text-gray-900">Page Forge</span>
        <span class="block text-[11px] text-gray-400">{{ store.pageSettings.title || 'Untitled page' }}</span>
      </button>

      <button
        class="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-30"
        :disabled="!store.canUndo"
        @click="handleUndo"
      >
        撤销
      </button>
      <button
        class="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-30"
        :disabled="!store.canRedo"
        @click="handleRedo"
      >
        重做
      </button>

      <div class="mx-1 h-6 w-px bg-gray-200" />

      <button
        class="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        :class="{ 'bg-blue-50 text-blue-700': store.isPreview }"
        @click="store.isPreview = !store.isPreview"
      >
        {{ store.isPreview ? '编辑' : '预览' }}
      </button>

      <div class="flex rounded-lg border p-0.5">
        <button
          v-for="mode in previewModes"
          :key="mode.value"
          class="rounded-md px-2 py-1 text-xs"
          :class="store.previewMode === mode.value ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'"
          @click="store.previewMode = mode.value"
        >
          {{ mode.label }}
        </button>
      </div>

      <div class="flex-1" />

      <button
        class="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        @click="store.showTemplateModal = true"
      >
        模板
      </button>

      <button
        class="rounded px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-40"
        :disabled="!ai.anthropicReady"
        :title="ai.anthropicReady ? '打开 AI Agent 面板(多轮对话)' : '后端 Claude 未就绪,请打开 AI 设置查看'"
        @click="store.showAgentPanel = !store.showAgentPanel"
      >
        ✨ Agent
      </button>

      <button
        class="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        :title="ai.backendReachable ? (ai.anthropicReady ? '后端 Claude 已就绪' : '后端可达,但 Claude 未配置') : '后端不可达'"
        @click="store.showAISettingsModal = true"
      >
        AI 设置
        <span
          class="ml-1 inline-block w-2 h-2 rounded-full"
          :class="!ai.backendReachable ? 'bg-red-500' : ai.anthropicReady ? 'bg-green-500' : 'bg-yellow-500'"
        ></span>
      </button>
      <button
        class="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        @click="store.sidebarTab = 'page'"
      >
        页面设置
      </button>
      <button
        class="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        @click="importInput?.click()"
      >
        导入
      </button>
      <button
        class="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        @click="store.showProjectModal = true"
      >
        项目
      </button>
      <button
        class="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        @click="downloadProject(store.components, store.pageSettings)"
      >
        保存项目
      </button>
      <button
        class="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        @click="store.showCheckPanel = true"
      >
        检查
      </button>
      <button
        class="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        @click="downloadHTML(store.components, store.pageSettings)"
      >
        导出 HTML
      </button>
      <button
        class="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        @click="store.showAddModal = true"
      >
        添加区块
      </button>

      <input ref="importInput" type="file" accept="application/json,.json" class="hidden" @change="onImport" />
    </div>
  </div>
</template>
