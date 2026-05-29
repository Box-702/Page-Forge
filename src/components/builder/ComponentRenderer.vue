<script setup lang="ts">
import type { PageComponent } from '@/types'
import HeroBlock from '../blocks/HeroBlock.vue'
import CTABlock from '../blocks/CTABlock.vue'
import FeaturesBlock from '../blocks/FeaturesBlock.vue'
import PricingBlock from '../blocks/PricingBlock.vue'
import TestimonialsBlock from '../blocks/TestimonialsBlock.vue'
import FaqBlock from '../blocks/FaqBlock.vue'
import FooterBlock from '../blocks/FooterBlock.vue'
import RowBlock from '../blocks/RowBlock.vue'

defineProps<{
  component: PageComponent
}>()
</script>

<template>
  <HeroBlock v-if="component.type === 'hero'" :component="component" />
  <FeaturesBlock v-else-if="component.type === 'features'" :component="component" />
  <PricingBlock v-else-if="component.type === 'pricing'" :component="component" />
  <CTABlock v-else-if="component.type === 'cta'" :component="component" />
  <TestimonialsBlock v-else-if="component.type === 'testimonials'" :component="component" />
  <FaqBlock v-else-if="component.type === 'faq'" :component="component" />
  <FooterBlock v-else-if="component.type === 'footer'" :component="component" />
  <RowBlock v-else-if="component.type === 'row'" :component="component" />
  <div v-else class="text-gray-400 text-sm py-4">未知块类型：{{ component.type }}</div>
</template>
