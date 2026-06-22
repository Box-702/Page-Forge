<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, toRef, watch } from 'vue'
import type { PageComponent, RowColumn } from '@/types'
import { useBuilderStore } from '@/stores/builder'
import { useBuilder } from '@/composables/useBuilder'
import { getRowColumns, normalizeRowComponent } from '@/utils/rowColumns'
import { useBlockStyle, animationClass } from '@/composables/useBlockStyle'
import ComponentWrapper from '../builder/ComponentWrapper.vue'
import BlockDecoration from '../builder/BlockDecoration.vue'
import Sortable from 'sortablejs'

const props = defineProps<{ component: PageComponent }>()
const store = useBuilderStore()
const { pushSnapshot } = useBuilder()
const s = computed(() => props.component.styles)
const c = computed(() => props.component.content)
const boxStyle = useBlockStyle(toRef(props, 'component'))
const animClass = computed(() => animationClass(s.value.animation))
const columns = computed(() => getRowColumns(normalizeRowComponent(props.component)))
const alignItems = computed(() => c.value.verticalAlign === 'top' ? 'start' : (c.value.verticalAlign || 'start'))
const colRefs = ref<(HTMLElement | null)[]>([])
let sortables: Sortable[] = []
const groupId = `row-${props.component.id}`

function initSortable() {
  destroySortable()
  colRefs.value.forEach((el) => {
    if (!el) return
    sortables.push(new Sortable(el, {
      group: { name: groupId, pull: true, put: true },
      animation: 150,
      handle: '.drag-handle',
      onEnd: onColumnReorder,
    }))
  })
}

function destroySortable() {
  sortables.forEach((sortable) => sortable.destroy())
  sortables = []
}

function onColumnReorder() {
  const nextColumns: RowColumn[] = columns.value.map((column, index) => {
    const el = colRefs.value[index]
    if (!el) return { ...column, children: [] }
    const ids = Array.from(el.querySelectorAll(':scope > [data-id]'))
      .map((node) => node.getAttribute('data-id'))
      .filter(Boolean) as string[]
    return {
      ...column,
      children: ids
        .map((id) => columns.value.flatMap((item) => item.children).find((child) => child.id === id))
        .filter(Boolean) as PageComponent[],
    }
  })

  store.updateComponent(props.component.id, {
    content: { ...c.value, columns: nextColumns, columnCount: nextColumns.length },
    children: undefined,
  })
  pushSnapshot()
}

function openAddBlock(columnId: string) {
  store.rowInsertTarget = { rowId: props.component.id, columnId }
  store.selectComponent(props.component.id)
  store.showAddModal = true
}

function setRef(el: any, index: number) {
  colRefs.value[index] = el as HTMLElement | null
}

onMounted(() => initSortable())
onUnmounted(() => destroySortable())
watch(() => columns.value.length, () => nextTick(initSortable))
</script>

<template>
  <section :style="boxStyle" :class="[s.textAlign, s.shadow, s.maxWidth, animClass]">
    <BlockDecoration :variant="s.decoration" />
    <div class="mx-auto max-w-6xl px-4">
      <div
        :class="['grid grid-cols-1', `md:grid-cols-${columns.length}`, `gap-${c.gap || '8'}`]"
        :style="{ alignItems }"
      >
        <div
          v-for="(column, index) in columns"
          :key="column.id"
          :ref="(el) => setRef(el, index)"
          class="space-y-4"
        >
          <ComponentWrapper
            v-for="child in column.children"
            :key="child.id"
            :component="child"
          />
          <button
            v-if="!store.isPreview"
            class="flex min-h-[80px] w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-xs text-gray-400 transition-colors hover:border-blue-300 hover:text-blue-600"
            @click.stop="openAddBlock(column.id)"
          >
            添加到第 {{ index + 1 }} 列
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
