<script setup lang="ts">
import { ref } from 'vue'
import type { SavedProject } from '@/types'
import { useBuilderStore } from '@/stores/builder'
import { useProjects } from '@/composables/useProjects'
import { useLocalStorage } from '@/composables/useLocalStorage'

const store = useBuilderStore()
const { listProjects, saveProject, deleteProject } = useProjects()
const { save } = useLocalStorage()
const projects = ref<SavedProject[]>(listProjects())
const projectName = ref(store.pageSettings.title || 'Untitled project')

function saveCurrentProject() {
  saveProject(projectName.value, store.components, store.pageSettings)
  projects.value = listProjects()
}

function loadProject(project: SavedProject) {
  store.replaceProject(project)
  save(store.components, store.pageSettings)
  store.showProjectModal = false
}

function removeProject(id: string) {
  deleteProject(id)
  projects.value = listProjects()
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    @click.self="store.showProjectModal = false"
  >
    <div class="w-full max-w-3xl rounded-lg bg-white shadow-xl">
      <div class="flex items-start justify-between border-b px-6 py-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">项目管理</h2>
          <p class="mt-1 text-sm text-gray-500">保存多个本地项目，稍后可以继续编辑。</p>
        </div>
        <button class="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100" @click="store.showProjectModal = false">
          关闭
        </button>
      </div>

      <div class="grid gap-6 p-6 md:grid-cols-[280px_1fr]">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500">保存为</label>
          <input v-model="projectName" class="w-full rounded-lg border px-3 py-2 text-sm" />
          <button class="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" @click="saveCurrentProject">
            保存当前项目
          </button>
        </div>

        <div class="max-h-[420px] overflow-y-auto">
          <div v-if="!projects.length" class="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
            还没有保存过项目。
          </div>
          <div v-else class="space-y-2">
            <div v-for="project in projects" :key="project.id" class="rounded-lg border p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-gray-900">{{ project.name }}</div>
                  <div class="mt-1 text-xs text-gray-500">{{ new Date(project.updatedAt).toLocaleString() }}</div>
                </div>
                <div class="flex gap-2 text-xs">
                  <button class="text-blue-600 hover:text-blue-700" @click="loadProject(project)">打开</button>
                  <button class="text-red-500 hover:text-red-600" @click="removeProject(project.id)">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
