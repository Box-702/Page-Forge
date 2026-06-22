<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { PageComponent } from '@/types'
import { useBuilderStore } from '@/stores/builder'
import { useInlineContent } from '@/composables/useInlineContent'
import { useBlockStyle, animationClass } from '@/composables/useBlockStyle'
import InlineText from '../builder/InlineText.vue'
import BlockDecoration from '../builder/BlockDecoration.vue'

const props = defineProps<{ component: PageComponent }>()
const store = useBuilderStore()
const { updateField, updateArrayItem, updateNestedArrayItem, commitInlineEdit } = useInlineContent(() => props.component)
const s = computed(() => props.component.styles)
const boxStyle = useBlockStyle(toRef(props, 'component'))
const animClass = computed(() => animationClass(s.value.animation))
const c = computed(() => props.component.content as {
  title: string; subtitle: string; currency: string
  plans: { id: string; name: string; price: string; period: string; description: string; features: string[]; highlighted: boolean; ctaText: string }[]
})
</script>

<template>
  <section :style="boxStyle" :class="[s.textAlign, s.shadow, s.maxWidth, animClass]">
    <BlockDecoration :variant="s.decoration" />
    <div class="max-w-6xl mx-auto px-4">
      <InlineText
        tag="h2"
        class="font-bold mb-4"
        :style="{ fontSize: s.titleFontSize || '36px' }"
        :model-value="c.title"
        :disabled="store.isPreview"
        placeholder="Pricing title"
        @update:model-value="updateField('title', $event)"
        @commit="commitInlineEdit"
      />
      <InlineText
        tag="p"
        class="mb-12 max-w-2xl"
        :style="{ fontSize: s.bodyFontSize || '18px' }"
        :model-value="c.subtitle"
        :disabled="store.isPreview"
        multiline
        placeholder="Pricing subtitle"
        @update:model-value="updateField('subtitle', $event)"
        @commit="commitInlineEdit"
      />
      <div class="grid gap-8 md:grid-cols-3 items-start">
        <div v-for="(p, planIndex) in c.plans" :key="p.id"
          :class="['rounded-xl p-8 border', p.highlighted ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white text-gray-900 border-gray-200 shadow-sm']">
          <InlineText
            tag="h3"
            class="text-xl font-bold mb-2"
            :model-value="p.name"
            :disabled="store.isPreview"
            placeholder="Plan name"
            @update:model-value="updateArrayItem('plans', planIndex, 'name', $event)"
            @commit="commitInlineEdit"
          />
          <InlineText
            tag="p"
            class="text-sm mb-4"
            :class="p.highlighted ? 'text-blue-100' : 'text-gray-500'"
            :model-value="p.description"
            :disabled="store.isPreview"
            multiline
            placeholder="Plan description"
            @update:model-value="updateArrayItem('plans', planIndex, 'description', $event)"
            @commit="commitInlineEdit"
          />
          <div class="mb-6">
            <span class="text-4xl font-bold">{{ c.currency }}</span>
            <InlineText
              class="text-4xl font-bold"
              :model-value="p.price"
              :disabled="store.isPreview"
              placeholder="0"
              @update:model-value="updateArrayItem('plans', planIndex, 'price', $event)"
              @commit="commitInlineEdit"
            />
            <InlineText
              class="text-sm"
              :class="p.highlighted ? 'text-blue-200' : 'text-gray-400'"
              :model-value="p.period"
              :disabled="store.isPreview"
              placeholder="/mo"
              @update:model-value="updateArrayItem('plans', planIndex, 'period', $event)"
              @commit="commitInlineEdit"
            />
          </div>
          <ul class="space-y-3 mb-8">
            <li v-for="(f, featureIndex) in p.features" :key="featureIndex" class="flex items-center gap-2 text-sm" :class="p.highlighted ? 'text-blue-50' : 'text-gray-600'">
              <span>:</span>
              <InlineText
                :model-value="f"
                :disabled="store.isPreview"
                placeholder="Feature"
                @update:model-value="updateNestedArrayItem('plans', planIndex, 'features', featureIndex, $event)"
                @commit="commitInlineEdit"
              />
            </li>
          </ul>
          <a href="#" :class="['block text-center py-3 rounded-lg font-medium', p.highlighted ? 'bg-white text-blue-600' : 'bg-blue-600 text-white']">
            <InlineText
              :model-value="p.ctaText"
              :disabled="store.isPreview"
              placeholder="Button"
              @update:model-value="updateArrayItem('plans', planIndex, 'ctaText', $event)"
              @commit="commitInlineEdit"
            />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
