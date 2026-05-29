import { onMounted, onUnmounted, type Ref } from 'vue'
import Sortable from 'sortablejs'

/**
 * 拖拽排序 —— sortablejs 封装
 * @param listRef  容器 DOM 的模板引用
 * @param onReorder  排序完成后的回调，接收新顺序的 ID 列表
 */
export function useDragDrop(listRef: Ref<HTMLElement | null>, onReorder: (newOrder: string[]) => void) {
  let sortable: Sortable | null = null

  onMounted(() => {
    if (!listRef.value) return
    sortable = new Sortable(listRef.value, {
      animation: 200,         // 动画 200ms
      handle: '.drag-handle', // 只有拖拽手柄可拖动
      onEnd() {
        const order = sortable!.toArray()  // 获取排序后的元素 ID 数组
        onReorder(order)
      },
    })
  })

  /** 组件卸载时销毁 sortable 实例 */
  onUnmounted(() => {
    sortable?.destroy()
  })

  return { sortable }
}
