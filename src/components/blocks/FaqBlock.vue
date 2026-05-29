<script setup lang="ts">
import { computed } from 'vue'
import type { PageComponent } from '@/types'
import { useBuilderStore } from '@/stores/builder'
import { useInlineContent } from '@/composables/useInlineContent'
import InlineText from '../builder/InlineText.vue'

const props = defineProps<{ component: PageComponent }>()
const store = useBuilderStore()
const { updateField, updateArrayItem, commitInlineEdit } = useInlineContent(() => props.component)
const s = computed(() => props.component.styles)
const c = computed(() => props.component.content as {
  title: string; subtitle: string; faqs: { id: string; question: string; answer: string }[]
})

const boxStyle = computed(() => ({
  backgroundColor: s.value.bgColor || undefined,
  color: s.value.textColor || undefined,
  paddingTop: s.value.paddingTop || undefined,
  paddingBottom: s.value.paddingBottom || undefined,
  paddingLeft: s.value.paddingLeft || undefined,
  paddingRight: s.value.paddingRight || undefined,
  backgroundImage: s.value.bgImage ? `url(${s.value.bgImage})` : undefined,
  backgroundSize: s.value.bgImage ? 'cover' : undefined,
  backgroundPosition: s.value.bgImage ? 'center' : undefined,
  borderRadius: s.value.borderRadius || undefined,
}))
</script>

<template>
  <section :style="boxStyle" :class="[s.textAlign, s.shadow, s.maxWidth]">
    <div class="max-w-4xl mx-auto px-4">
      <InlineText
        tag="h1"
        class="font-bold mb-4"
        :style="{ fontSize: s.titleFontSize || '36px' }"
        :model-value="c.title"
        :disabled="store.isPreview"
        placeholder="FAQ title"
        @update:model-value="updateField('title', $event)"
        @commit="commitInlineEdit"
      />
      <InlineText
        tag="p"
        class="mb-12 opacity-80"
        :style="{ fontSize: s.bodyFontSize || '18px' }"
        :model-value="c.subtitle"
        :disabled="store.isPreview"
        multiline
        placeholder="FAQ subtitle"
        @update:model-value="updateField('subtitle', $event)"
        @commit="commitInlineEdit"
      />
      <div v-for="(faq, index) in c.faqs" :key="faq.id" class="border-b border-gray-200 py-5">
        <InlineText
          tag="h3"
          class="text-lg font-semibold mb-2"
          :model-value="faq.question"
          :disabled="store.isPreview"
          placeholder="Question"
          @update:model-value="updateArrayItem('faqs', index, 'question', $event)"
          @commit="commitInlineEdit"
        />
        <InlineText
          tag="p"
          class="text-gray-600 leading-relaxed"
          :model-value="faq.answer"
          :disabled="store.isPreview"
          multiline
          placeholder="Answer"
          @update:model-value="updateArrayItem('faqs', index, 'answer', $event)"
          @commit="commitInlineEdit"
        />
      </div>
    </div>
  </section>
</template>
