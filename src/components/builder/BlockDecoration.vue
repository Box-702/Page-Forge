<script setup lang="ts">
import { computed } from 'vue'
import type { DecorationVariant } from '@/types'
import { findDecoration } from '@/data/decorationRegistry'

const props = defineProps<{ variant: DecorationVariant | undefined }>()

const asset = computed(() => findDecoration(props.variant))
const styleObj = computed(() => asset.value ? { opacity: asset.value.opacity } : {})
const classObj = computed(() => asset.value ? asset.value.colorClass : '')
</script>

<template>
  <div
    v-if="asset"
    class="pointer-events-none absolute overflow-hidden select-none"
    :class="[asset.position, asset.size]"
    :style="styleObj"
    aria-hidden="true"
  >
    <div :class="['w-full h-full', classObj]" v-html="asset.raw" />
  </div>
</template>