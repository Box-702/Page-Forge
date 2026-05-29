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
  companyName: string; description: string; copyright: string
  links: { id: string; title: string; url: string }[]
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
  <footer :style="boxStyle" :class="[s.textAlign, s.shadow, s.maxWidth]">
    <div class="max-w-6xl mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div class="md:col-span-1">
          <InlineText
            tag="h3"
            class="text-lg font-bold mb-3"
            :model-value="c.companyName"
            :disabled="store.isPreview"
            placeholder="Company name"
            @update:model-value="updateField('companyName', $event)"
            @commit="commitInlineEdit"
          />
          <InlineText
            tag="p"
            class="text-sm opacity-70 leading-relaxed"
            :model-value="c.description"
            :disabled="store.isPreview"
            multiline
            placeholder="Footer description"
            @update:model-value="updateField('description', $event)"
            @commit="commitInlineEdit"
          />
        </div>
        <div class="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="(link, index) in c.links" :key="link.id">
            <a :href="link.url" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
              <InlineText
                :model-value="link.title"
                :disabled="store.isPreview"
                placeholder="Link"
                @update:model-value="updateArrayItem('links', index, 'title', $event)"
                @commit="commitInlineEdit"
              />
            </a>
          </div>
        </div>
      </div>
      <InlineText
        tag="div"
        class="border-t pt-6 text-sm opacity-50"
        :class="s.textColor ? 'border-current' : 'border-gray-700'"
        :model-value="c.copyright"
        :disabled="store.isPreview"
        placeholder="Copyright"
        @update:model-value="updateField('copyright', $event)"
        @commit="commitInlineEdit"
      />
    </div>
  </footer>
</template>
