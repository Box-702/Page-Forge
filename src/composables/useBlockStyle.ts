import { computed, type ComputedRef, type CSSProperties, type Ref } from 'vue'
import type { AnimationKind, PageComponent } from '@/types'

export type BlockStyle = CSSProperties

/**
 * Build the merged CSSStyleDeclaration-like object for a block.
 *
 * Priority: bgGradient > bgImage > bgColor.
 * Overlay is rendered as a sibling ::before via the BlockDecoration wrapper,
 * not here, because inline styles can't express pseudo-elements.
 */
export function useBlockStyle(component: Ref<PageComponent>): ComputedRef<BlockStyle> {
  return computed(() => {
    const s = component.value.styles
    const out: BlockStyle = {
      paddingTop: s.paddingTop,
      paddingBottom: s.paddingBottom,
      paddingLeft: s.paddingLeft,
      paddingRight: s.paddingRight,
      color: s.textColor,
      borderRadius: s.borderRadius,
    }
    if (s.bgGradient) {
      out.backgroundImage = s.bgGradient
      out.backgroundSize = 'cover'
      out.backgroundPosition = 'center'
    } else if (s.bgImage) {
      out.backgroundImage = `url(${s.bgImage})`
      out.backgroundSize = 'cover'
      out.backgroundPosition = 'center'
    } else if (s.bgColor) {
      out.backgroundColor = s.bgColor
    }
    if (s.bgAttachment === 'fixed') out.backgroundAttachment = 'fixed'
    if (s.decoration && s.decoration !== 'none') out.position = 'relative'
    return out
  })
}

/** Map an animation kind to a Tailwind class for the editor preview. */
export function animationClass(kind: AnimationKind | undefined): string {
  switch (kind) {
    case 'fade-in': return 'animate-[pf-fade-in_0.6s_ease-out_both]'
    case 'slide-up': return 'animate-[pf-slide-up_0.6s_ease-out_both]'
    case 'float': return 'animate-[pf-float_3s_ease-in-out_infinite]'
    default: return ''
  }
}

/** Plain class for the exported HTML (keyframes live in <style> there). */
export function animationExportClass(kind: AnimationKind | undefined): string {
  return kind && kind !== 'none' ? `pf-${kind}` : ''
}