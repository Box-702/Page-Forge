<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { validateProject } from '@/utils/projectChecks'

const store = useBuilderStore()
const issues = computed(() => validateProject(store.components, store.pageSettings))
const errorCount = computed(() => issues.value.filter((issue) => issue.level === 'error').length)
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    @click.self="store.showCheckPanel = false"
  >
    <div class="w-full max-w-2xl rounded-lg bg-white shadow-xl">
      <div class="flex items-start justify-between border-b px-6 py-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">导出前检查</h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ issues.length ? `发现 ${issues.length} 个需要关注的问题。` : '没有发现明显问题，可以导出。' }}
          </p>
        </div>
        <button class="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100" @click="store.showCheckPanel = false">
          关闭
        </button>
      </div>

      <div class="max-h-[60vh] overflow-y-auto p-6">
        <div v-if="!issues.length" class="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          页面结构、SEO 基础信息和常见链接字段都已通过检查。
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(issue, index) in issues"
            :key="index"
            class="rounded-lg border p-4"
            :class="issue.level === 'error' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'"
          >
            <div class="text-sm font-semibold" :class="issue.level === 'error' ? 'text-red-800' : 'text-amber-800'">
              {{ issue.title }}
            </div>
            <div class="mt-1 text-sm" :class="issue.level === 'error' ? 'text-red-700' : 'text-amber-700'">
              {{ issue.detail }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between border-t px-6 py-4">
        <span class="text-xs text-gray-500">{{ errorCount ? '请先处理错误项。' : '警告项不阻止导出。' }}</span>
        <button class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800" @click="store.showCheckPanel = false">
          完成
        </button>
      </div>
    </div>
  </div>
</template>
