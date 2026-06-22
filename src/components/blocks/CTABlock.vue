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
  title: string; subtitle: string; ctaText: string; ctaLink: string; ctaVariant?: string
})
const buttonClass = computed(() => {
  if (c.value.ctaVariant === 'dark') return 'bg-gray-900 text-white hover:bg-gray-800'
  if (c.value.ctaVariant === 'outline') return 'bg-transparent text-white ring-1 ring-white/60 hover:bg-white/10'
  return 'bg-white text-blue-600 hover:bg-blue-50'
})
</script>

<template>
  <section :style="boxStyle" :class="[s.textAlign, s.shadow, s.maxWidth, animClass]">
    <BlockDecoration :variant="s.decoration" />
    <div class="max-w-4xl mx-auto px-4 text-center">
      <InlineText
        tag="h2"
        class="font-bold mb-4"
        :style="{ fontSize: s.titleFontSize || '48px' }"
        :model-value="c.title"
        :disabled="store.isPreview"
        placeholder="CTA title"
        @update:model-value="updateField('title', $event)"
        @commit="commitInlineEdit"
      />
      <InlineText
        tag="p"
        class="mb-8 opacity-90"
        :style="{ fontSize: s.bodyFontSize || '20px' }"
        :model-value="c.subtitle"
        :disabled="store.isPreview"
        multiline
        placeholder="CTA subtitle"
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
  </section>
</template>
