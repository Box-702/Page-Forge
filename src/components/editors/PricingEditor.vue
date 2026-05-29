<script setup lang="ts">
import { useEditor } from '@/composables/useEditor'

const { content, set } = useEditor()

function addPlan() {
  const plans = [...(content.value.plans || [])]
  plans.push({
    id: crypto.randomUUID(), name: '新方案', price: '0', period: '/月',
    description: '描述', features: ['功能 1'], highlighted: false, ctaText: '订阅',
  })
  set('plans', plans)
}

function removePlan(index: number) {
  const plans = [...(content.value.plans || [])]
  plans.splice(index, 1)
  set('plans', plans)
}

function updatePlan(index: number, key: string, value: any) {
  const plans = [...(content.value.plans || [])]
  plans[index] = { ...plans[index], [key]: value }
  set('plans', plans)
}

function addPlanFeature(planIndex: number) {
  const plans = [...(content.value.plans || [])]
  const plan = { ...plans[planIndex] }
  plan.features = [...(plan.features || []), '新功能']
  plans[planIndex] = plan
  set('plans', plans)
}

function removePlanFeature(planIndex: number, featIndex: number) {
  const plans = [...(content.value.plans || [])]
  const plan = { ...plans[planIndex] }
  plan.features = [...(plan.features || [])]
  plan.features.splice(featIndex, 1)
  plans[planIndex] = plan
  set('plans', plans)
}

function updatePlanFeature(planIndex: number, featIndex: number, value: string) {
  const plans = [...(content.value.plans || [])]
  const plan = { ...plans[planIndex] }
  plan.features = [...(plan.features || [])]
  plan.features[featIndex] = value
  plans[planIndex] = plan
  set('plans', plans)
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">标题</label>
      <input class="w-full border rounded-lg px-3 py-2 text-sm"
        :value="content.title" @input="set('title', ($event.target as HTMLInputElement).value)" />
    </div>
    <div>
      <label class="text-xs font-medium text-gray-500 block mb-1">副标题</label>
      <textarea class="w-full border rounded-lg px-3 py-2 text-sm" rows="2"
        :value="content.subtitle" @input="set('subtitle', ($event.target as HTMLTextAreaElement).value)" />
    </div>

    <div class="border-t pt-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-gray-500">方案列表</span>
        <button class="text-xs text-blue-600 hover:text-blue-700" @click="addPlan">+ 添加</button>
      </div>

      <div v-for="(plan, i) in content.plans" :key="plan?.id || i" class="border rounded-lg p-3 mb-2 space-y-2" :class="plan.highlighted ? 'border-blue-300 bg-blue-50' : ''">
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-400">方案 {{ i + 1 }}</span>
          <button class="text-xs text-red-500 hover:text-red-600" @click="removePlan(i)">删除</button>
        </div>
        <input class="w-full border rounded px-2 py-1 text-xs" :value="plan.name" @input="updatePlan(i, 'name', ($event.target as HTMLInputElement).value)" placeholder="名称" />
        <div class="flex gap-2">
          <input class="flex-1 border rounded px-2 py-1 text-xs" :value="plan.price" @input="updatePlan(i, 'price', ($event.target as HTMLInputElement).value)" placeholder="价格" />
          <input class="w-20 border rounded px-2 py-1 text-xs" :value="plan.period" @input="updatePlan(i, 'period', ($event.target as HTMLInputElement).value)" placeholder="周期" />
        </div>
        <textarea class="w-full border rounded px-2 py-1 text-xs" rows="2" :value="plan.description" @input="updatePlan(i, 'description', ($event.target as HTMLTextAreaElement).value)" placeholder="描述" />
        <label class="flex items-center gap-2 text-xs">
          <input type="checkbox" :checked="plan.highlighted" @change="updatePlan(i, 'highlighted', ($event.target as HTMLInputElement).checked)" />
          高亮推荐
        </label>
        <input class="w-full border rounded px-2 py-1 text-xs" :value="plan.ctaText" @input="updatePlan(i, 'ctaText', ($event.target as HTMLInputElement).value)" placeholder="按钮文字" />

        <!-- 功能列表 -->
        <div class="border-t pt-2 mt-2">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-gray-400">功能点</span>
            <button class="text-xs text-blue-600 hover:text-blue-700" @click="addPlanFeature(i)">+ 添加</button>
          </div>
          <div v-for="(feat, fi) in plan.features" :key="fi" class="flex gap-1 items-center mb-1">
            <input class="flex-1 border rounded px-2 py-1 text-xs"
              :value="feat" @input="updatePlanFeature(i, fi, ($event.target as HTMLInputElement).value)" placeholder="功能" />
            <button class="text-xs text-red-500 hover:text-red-600 flex-shrink-0" @click="removePlanFeature(i, fi)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
