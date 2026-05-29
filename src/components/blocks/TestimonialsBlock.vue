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
  title: string; subtitle: string; columns: number
  testimonials: { id: string; quote: string; name: string; title: string; avatarUrl: string }[]
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
        placeholder="Testimonials title"
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
        placeholder="Testimonials subtitle"
        @update:model-value="updateField('subtitle', $event)"
        @commit="commitInlineEdit"
      />
      <div :class="['grid gap-8', `md:grid-cols-${c.columns}`]">
        <div v-for="(item, index) in c.testimonials" :key="item.id" class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div class="text-gray-700 mb-4 italic">
            <span>"</span>
            <InlineText
              :model-value="item.quote"
              :disabled="store.isPreview"
              multiline
              placeholder="Quote"
              @update:model-value="updateArrayItem('testimonials', index, 'quote', $event)"
              @commit="commitInlineEdit"
            />
            <span>"</span>
          </div>
          <div class="flex items-center gap-3">
            <img v-if="item.avatarUrl" :src="item.avatarUrl" class="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="avatar" />
            <div v-else class="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0" />
            <div>
              <InlineText
                tag="p"
                class="text-sm font-semibold text-gray-900"
                :model-value="item.name"
                :disabled="store.isPreview"
                placeholder="Name"
                @update:model-value="updateArrayItem('testimonials', index, 'name', $event)"
                @commit="commitInlineEdit"
              />
              <InlineText
                tag="p"
                class="text-xs text-gray-500"
                :model-value="item.title"
                :disabled="store.isPreview"
                placeholder="Title"
                @update:model-value="updateArrayItem('testimonials', index, 'title', $event)"
                @commit="commitInlineEdit"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
