<script setup lang="ts">
import { nextTick, ref, useAttrs, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string | number
  tag?: string
  disabled?: boolean
  multiline?: boolean
  placeholder?: string
}>(), {
  modelValue: '',
  tag: 'span',
  disabled: false,
  multiline: false,
  placeholder: 'Edit text',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  commit: []
}>()

const attrs = useAttrs()
const el = ref<HTMLElement | null>(null)
const isEditing = ref(false)
let startValue = ''

watch(
  () => props.modelValue,
  () => {
    if (!isEditing.value) syncText()
  },
  { immediate: true }
)

function syncText() {
  nextTick(() => {
    if (!el.value) return
    const next = String(props.modelValue ?? '')
    if (el.value.textContent !== next) el.value.textContent = next
  })
}

function onFocus() {
  if (props.disabled) return
  isEditing.value = true
  startValue = String(props.modelValue ?? '')
}

function onInput() {
  if (!el.value) return
  emit('update:modelValue', el.value.textContent || '')
}

function onBlur() {
  if (!isEditing.value) return
  isEditing.value = false
  const next = el.value?.textContent || ''
  if (next !== startValue) emit('commit')
  syncText()
}

function onKeydown(event: KeyboardEvent) {
  if (props.multiline) return
  if (event.key === 'Enter') {
    event.preventDefault()
    el.value?.blur()
  }
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}
</script>

<template>
  <component
    :is="tag"
    ref="el"
    v-bind="attrs"
    :contenteditable="disabled ? 'false' : 'plaintext-only'"
    :data-placeholder="placeholder"
    :class="[
      attrs.class,
      !disabled && 'rounded-sm outline-none transition-shadow hover:ring-2 hover:ring-blue-200 focus:ring-2 focus:ring-blue-400',
      !disabled && 'cursor-text',
      multiline && 'whitespace-pre-wrap',
    ]"
    @click.stop
    @focus="onFocus"
    @input="onInput"
    @blur="onBlur"
    @keydown="onKeydown"
    @paste="onPaste"
  />
</template>

<style scoped>
[contenteditable='plaintext-only']:empty::before {
  content: attr(data-placeholder);
  color: rgb(156 163 175);
}
</style>
