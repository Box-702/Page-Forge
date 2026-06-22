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
const { updateField, commitInlineEdit } = useInlineContent(() => props.component)
const s = computed(() => props.component.styles)
const boxStyle = useBlockStyle(toRef(props, 'component'))
const animClass = computed(() => animationClass(s.value.animation))
const c = computed(() => props.component.content as {
  title: string; subtitle: string; ctaText: string; ctaLink: string; ctaVariant?: string; alignment: string; imageUrl: string
})
const buttonClass = computed(() => {
  if (c.value.ctaVariant === 'dark') return 'bg-gray-900 text-white hover:bg-gray-800'
  if (c.value.ctaVariant === 'light') return 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50'
  return 'bg-blue-600 text-white hover:bg-blue-700'
})
</script>

<template>
  <section :style="boxStyle" :class="[s.textAlign, s.shadow, s.maxWidth, animClass]">
    <BlockDecoration :variant="s.decoration" />
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex flex-col md:flex-row items-center gap-8" :class="c.alignment === 'center' ? 'text-center' : ''">
        <div class="flex-1">
          <InlineText
            tag="h1"
            class="font-bold mb-4"
            :style="{ fontSize: s.titleFontSize || '48px' }"
            :model-value="c.title"
            :disabled="store.isPreview"
            placeholder="Hero title"
            @update:model-value="updateField('title', $event)"
            @commit="commitInlineEdit"
          />
          <InlineText
            tag="p"
            class="mb-8 max-w-2xl"
            :style="{ fontSize: s.bodyFontSize || '18px' }"
            :class="c.alignment === 'center' ? 'mx-auto' : ''"
            :model-value="c.subtitle"
            :disabled="store.isPreview"
            multiline
            placeholder="Hero subtitle"
            @update:model-value="updateField('subtitle', $event)"
            @commit="commitInlineEdit"
          />
          <a v-if="c.ctaText || !store.isPreview" :href="c.ctaLink" :class="['inline-block rounded-lg px-8 py-3 font-medium transition-colors', buttonClass]">
            <InlineText
              :model-value="c.ctaText"
              :disabled="store.isPreview"
              placeholder="Button"
              @update:model-value="updateField('ctaText', $event)"
              @commit="commitInlineEdit"
            />
          </a>
        </div>
        <div v-if="c.imageUrl" class="flex-1 flex justify-center">
          <img :src="c.imageUrl" alt="Hero" class="max-w-full h-auto rounded-lg shadow-lg" />
        </div>
      </div>
    </div>
  </section>
</template>
