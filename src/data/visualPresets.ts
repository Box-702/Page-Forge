export interface VisualPreset {
  id: string
  label: string
  gradient: string
}

export const gradientPresets: VisualPreset[] = [
  { id: 'aurora',   label: '极光',   gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' },
  { id: 'sunset',   label: '日落',   gradient: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)' },
  { id: 'ocean',    label: '海洋',   gradient: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)' },
  { id: 'forest',   label: '森林',   gradient: 'linear-gradient(135deg,#0ba360 0%,#3cba92 100%)' },
  { id: 'cosmic',   label: '宇宙',   gradient: 'linear-gradient(135deg,#1e3c72 0%,#2a5298 100%)' },
  { id: 'peach',    label: '蜜桃',   gradient: 'linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)' },
  { id: 'lemon',    label: '柠檬',   gradient: 'linear-gradient(135deg,#fdfc47 0%,#24fe41 100%)' },
  { id: 'lavender', label: '薰衣草', gradient: 'linear-gradient(135deg,#c471f5 0%,#fa71cd 100%)' },
  { id: 'mint',     label: '薄荷',   gradient: 'linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)' },
  { id: 'noir',     label: '暗夜',   gradient: 'linear-gradient(135deg,#232526 0%,#414345 100%)' },
]

export function findPresetById(id: string | undefined): VisualPreset | undefined {
  if (!id) return undefined
  return gradientPresets.find(p => p.id === id)
}