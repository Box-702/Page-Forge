import type { DecorationVariant } from '@/types'
import blob1 from '@/assets/decorations/blobs/blob-1.svg?raw'
import blob2 from '@/assets/decorations/blobs/blob-2.svg?raw'
import blob3 from '@/assets/decorations/blobs/blob-3.svg?raw'
import blob4 from '@/assets/decorations/blobs/blob-4.svg?raw'
import wave1 from '@/assets/decorations/waves/wave-1.svg?raw'
import wave2 from '@/assets/decorations/waves/wave-2.svg?raw'
import mesh1 from '@/assets/decorations/mesh/mesh-1.svg?raw'
import mesh2 from '@/assets/decorations/mesh/mesh-2.svg?raw'
import mesh3 from '@/assets/decorations/mesh/mesh-3.svg?raw'
import mesh4 from '@/assets/decorations/mesh/mesh-4.svg?raw'
import noise1 from '@/assets/decorations/noise/noise-1.svg?raw'
import noise2 from '@/assets/decorations/noise/noise-2.svg?raw'
import squiggle1 from '@/assets/decorations/squiggles/squiggle-1.svg?raw'
import squiggle2 from '@/assets/decorations/squiggles/squiggle-2.svg?raw'

export type DecorationCategory = 'none' | 'blob' | 'glow' | 'wave' | 'mesh' | 'noise' | 'squiggle'

export interface DecorationAsset {
  variant: DecorationVariant
  label: string
  category: Exclude<DecorationCategory, 'none'>
  raw: string
  /** Tailwind classes for positioning the SVG inside the section */
  position: string
  /** Tailwind classes for sizing the SVG itself */
  size: string
  /** Opacity multiplier 0..1 */
  opacity: number
  /** Color hint for elements using currentColor; usually left undefined */
  colorClass?: string
}

const blobs: DecorationAsset[] = [
  { variant: 'blob-tl', label: '左上有色块', category: 'blob', raw: blob1, position: '-top-20 -left-20', size: 'w-72 h-72', opacity: 0.35 },
  { variant: 'blob-tr', label: '右上有色块', category: 'blob', raw: blob2, position: '-top-16 -right-24', size: 'w-80 h-80', opacity: 0.3 },
  { variant: 'blob-bl', label: '左下有色块', category: 'blob', raw: blob3, position: '-bottom-24 -left-16', size: 'w-72 h-72', opacity: 0.32 },
  { variant: 'blob-br', label: '右下有色块', category: 'blob', raw: blob4, position: '-bottom-20 -right-20', size: 'w-80 h-80', opacity: 0.35 },
]

const glows: DecorationAsset[] = [
  { variant: 'glow-tl', label: '左上光晕', category: 'glow', raw: mesh1, position: '-top-32 -left-32', size: 'w-96 h-96', opacity: 0.5 },
  { variant: 'glow-br', label: '右下光晕', category: 'glow', raw: mesh2, position: '-bottom-32 -right-32', size: 'w-96 h-96', opacity: 0.45 },
]

const waves: DecorationAsset[] = [
  { variant: 'wave-top',    label: '顶部波浪', category: 'wave', raw: wave1, position: 'top-0 left-0 right-0', size: 'w-full h-16', opacity: 0.25 },
  { variant: 'wave-bottom', label: '底部波浪', category: 'wave', raw: wave2, position: 'bottom-0 left-0 right-0', size: 'w-full h-16', opacity: 0.25 },
]

const meshes: DecorationAsset[] = [
  { variant: 'mesh-soft', label: '柔和 mesh', category: 'mesh', raw: mesh3, position: 'inset-0', size: 'w-full h-full', opacity: 0.4 },
  { variant: 'mesh-bold', label: '浓烈 mesh', category: 'mesh', raw: mesh4, position: 'inset-0', size: 'w-full h-full', opacity: 0.55 },
]

const noises: DecorationAsset[] = [
  { variant: 'noise-fine',   label: '细噪点', category: 'noise', raw: noise1, position: 'inset-0', size: 'w-full h-full', opacity: 0.18 },
  { variant: 'noise-coarse', label: '粗噪点', category: 'noise', raw: noise2, position: 'inset-0', size: 'w-full h-full', opacity: 0.22 },
]

const squiggles: DecorationAsset[] = [
  { variant: 'squiggle-tl', label: '左上涂鸦', category: 'squiggle', raw: squiggle1, position: 'top-4 left-4', size: 'w-40 h-40', opacity: 0.3, colorClass: 'text-blue-400' },
  { variant: 'squiggle-br', label: '右下涂鸦', category: 'squiggle', raw: squiggle2, position: 'bottom-4 right-4', size: 'w-40 h-40', opacity: 0.3, colorClass: 'text-purple-400' },
]

export const decorations: DecorationAsset[] = [
  ...blobs, ...glows, ...waves, ...meshes, ...noises, ...squiggles,
]

export function findDecoration(variant: DecorationVariant | undefined): DecorationAsset | undefined {
  if (!variant || variant === 'none') return undefined
  return decorations.find(d => d.variant === variant)
}

export const decorationCategories: { id: DecorationCategory; label: string }[] = [
  { id: 'blob',     label: '色块' },
  { id: 'glow',     label: '光晕' },
  { id: 'wave',     label: '波浪' },
  { id: 'mesh',     label: 'Mesh' },
  { id: 'noise',    label: '噪点' },
  { id: 'squiggle', label: '涂鸦' },
]