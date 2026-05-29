<script setup lang="ts">
import { templates } from '@/data/templates'
import { useBuilderStore } from '@/stores/builder'
import { useLocalStorage } from '@/composables/useLocalStorage'

const store = useBuilderStore()
const { save } = useLocalStorage()

function applyTemplate(templateId: string) {
  const template = templates.find((item) => item.id === templateId)
  if (!template) return
  const nextProject = {
    components: template.create(),
    pageSettings: { ...store.pageSettings, ...template.settings },
  }
  store.replaceProject(nextProject)
  save(store.components, store.pageSettings)
  store.showTemplateModal = false
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    @click.self="store.showTemplateModal = false"
  >
    <div class="w-full max-w-3xl rounded-lg bg-white shadow-xl">
      <div class="flex items-start justify-between border-b px-6 py-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">选择页面模板</h2>
          <p class="mt-1 text-sm text-gray-500">模板会替换当前画布内容，适合快速开始一个完整页面。</p>
        </div>
        <button class="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100" @click="store.showTemplateModal = false">
          关闭
        </button>
      </div>

      <div class="grid gap-4 p-6 md:grid-cols-3">
        <button
          v-for="template in templates"
          :key="template.id"
          class="flex min-h-[180px] flex-col rounded-lg border p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
          @click="applyTemplate(template.id)"
        >
          <span class="text-sm font-semibold text-gray-900">{{ template.name }}</span>
          <span class="mt-2 text-sm leading-6 text-gray-600">{{ template.description }}</span>
          <span class="mt-auto pt-4 text-xs font-medium text-blue-600">使用模板</span>
        </button>
      </div>
    </div>
  </div>
</template>
