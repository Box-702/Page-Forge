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
  title: string; subtitle: string; features: { id: string; icon: string; title: string; description: string }[]; columns: number
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
    <div class="max-w-6xl mx-auto px-4">
      <InlineText
        tag="h2"
        class="font-bold mb-4"
        :style="{ fontSize: s.titleFontSize || '36px' }"
        :model-value="c.title"
        :disabled="store.isPreview"
        placeholder="Features title"
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
        placeholder="Features subtitle"
        @update:model-value="updateField('subtitle', $event)"
        @commit="commitInlineEdit"
      />
      <div :class="['grid gap-8', `md:grid-cols-${c.columns}`]">
        <div v-for="(f, index) in c.features" :key="f.id" class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <img v-if="f.icon && (f.icon.startsWith('http://') || f.icon.startsWith('https://'))" :src="f.icon" class="w-12 h-12 object-contain mb-3" alt="icon" />
          <span v-else class="text-3xl mb-3 block">{{ f.icon }}</span>
          <InlineText
            tag="h3"
            class="text-lg font-semibold text-gray-900 mb-2"
            :model-value="f.title"
            :disabled="store.isPreview"
            placeholder="Feature title"
            @update:model-value="updateArrayItem('features', index, 'title', $event)"
            @commit="commitInlineEdit"
          />
          <InlineText
            tag="p"
            class="text-gray-600 text-sm leading-relaxed"
            :model-value="f.description"
            :disabled="store.isPreview"
            multiline
            placeholder="Feature description"
            @update:model-value="updateArrayItem('features', index, 'description', $event)"
            @commit="commitInlineEdit"
          />
        </div>
      </div>
    </div>
  </section>
</template>
