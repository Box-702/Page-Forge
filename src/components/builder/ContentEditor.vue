<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import HeroEditor from '../editors/HeroEditor.vue'
import FeaturesEditor from '../editors/FeaturesEditor.vue'
import CTAEditor from '../editors/CTAEditor.vue'
import PricingEditor from '../editors/PricingEditor.vue'
import TestimonialsEditor from '../editors/TestimonialsEditor.vue'
import FaqEditor from '../editors/FaqEditor.vue'
import FooterEditor from '../editors/FooterEditor.vue'
import RowEditor from '../editors/RowEditor.vue'

const store = useBuilderStore()
const type = computed(() => store.selectedComponent?.type ?? null)
</script>

<template>
  <HeroEditor v-if="type === 'hero'" />
  <FeaturesEditor v-else-if="type === 'features'" />
  <PricingEditor v-else-if="type === 'pricing'" />
  <CTAEditor v-else-if="type === 'cta'" />
  <TestimonialsEditor v-else-if="type === 'testimonials'" />
  <FaqEditor v-else-if="type === 'faq'" />
  <FooterEditor v-else-if="type === 'footer'" />
  <RowEditor v-else-if="type === 'row'" />
</template>
