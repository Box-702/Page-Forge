<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useAIStore } from '@/stores/ai'

const builder = useBuilderStore()
const ai = useAIStore()

const refreshing = ref(false)

const status = computed(() => {
  if (!ai.backendReachable) return 'unreachable'
  if (ai.anthropicReady && ai.stabilityReady) return 'ready'
  if (ai.anthropicReady || ai.stabilityReady) return 'partial'
  return 'not-configured'
})

async function refresh() {
  refreshing.value = true
  await ai.refresh(true)
  refreshing.value = false
}

onMounted(() => { ai.refresh() })

function close() {
  builder.showAISettingsModal = false
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="close"
  >
    <div class="w-full max-w-lg rounded-lg bg-white shadow-xl">
      <div class="flex items-center justify-between border-b px-5 py-3">
        <h2 class="text-base font-semibold">AI 设置</h2>
        <button class="text-gray-400 hover:text-gray-600" @click="close">×</button>
      </div>

      <div class="p-5 space-y-4 text-sm">
        <div
          class="rounded-lg border px-3 py-2.5 text-xs"
          :class="status === 'ready' ? 'border-green-200 bg-green-50 text-green-800' :
                  status === 'partial' ? 'border-yellow-200 bg-yellow-50 text-yellow-800' :
                  status === 'not-configured' ? 'border-gray-200 bg-gray-50 text-gray-700' :
                  'border-red-200 bg-red-50 text-red-700'"
        >
          <p class="font-medium">
            <span v-if="status === 'ready'">✓ 后端 AI 已就绪</span>
            <span v-else-if="status === 'partial'">⚠ 部分 provider 已配置</span>
            <span v-else-if="status === 'not-configured'">⚠ 后端可达,但 key 未配置</span>
            <span v-else>✗ 无法连接后端</span>
          </p>
          <p class="mt-1 opacity-80">
            <span v-if="status === 'unreachable'">请确认 NestJS 后端已启动(默认 http://localhost:3000)。</span>
            <span v-else>
              API Key 由 <code class="font-mono">server/.env</code> 管理,前端不再保存。
              在 <code class="font-mono">server/.env</code> 中填入 <code class="font-mono">ANTHROPIC_API_KEY</code> /
              <code class="font-mono">STABILITY_API_KEY</code> 后重启后端。
            </span>
          </p>
        </div>

        <div class="rounded-lg border border-gray-200 p-3 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">Anthropic Claude</p>
              <p class="text-xs text-gray-500">文案改写、整页生成</p>
            </div>
            <span
              class="text-xs px-2 py-0.5 rounded"
              :class="ai.anthropicReady ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
            >{{ ai.anthropicReady ? '已就绪' : '未配置' }}</span>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 p-3 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">Stability AI</p>
              <p class="text-xs text-gray-500">AI 生图(可选)</p>
            </div>
            <span
              class="text-xs px-2 py-0.5 rounded"
              :class="ai.stabilityReady ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
            >{{ ai.stabilityReady ? '已就绪' : '未配置' }}</span>
          </div>
        </div>

        <details class="text-xs text-gray-500">
          <summary class="cursor-pointer hover:text-gray-700">如何配置后端?</summary>
          <div class="mt-2 space-y-1 leading-relaxed pl-2 border-l-2 border-gray-200">
            <p>1. 进入 <code class="font-mono">server/</code> 目录,复制 <code class="font-mono">.env.example</code> 为 <code class="font-mono">.env</code></p>
            <p>2. 在 Anthropic 控制台(<a href="https://console.anthropic.com" class="text-blue-600 underline" target="_blank">console.anthropic.com</a>)创建 API key</p>
            <p>3. 在 Stability(<a href="https://platform.stability.ai" class="text-blue-600 underline" target="_blank">platform.stability.ai</a>)创建 key(可选)</p>
            <p>4. 重启 NestJS 服务(cd server && npm run dev)</p>
          </div>
        </details>
      </div>

      <div class="flex justify-end gap-2 border-t px-5 py-3 bg-gray-50 rounded-b-lg">
        <button class="rounded border px-3 py-1.5 text-xs hover:bg-gray-100" :disabled="refreshing" @click="refresh">
          {{ refreshing ? '刷新中…' : '刷新状态' }}
        </button>
        <button class="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700" @click="close">完成</button>
      </div>
    </div>
  </div>
</template>