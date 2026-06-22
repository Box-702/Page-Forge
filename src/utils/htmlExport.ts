import type { PageComponent, PageSettings } from '@/types'
import { getRowColumns, normalizeRowComponent } from './rowColumns'
import { safeAssetUrl, safeLinkUrl } from './urlGuards'
import { findDecoration } from '@/data/decorationRegistry'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** 行内 style 字符串(颜色/间距/圆角) */
function boxStyle(s: Record<string, any>): string {
  const parts: string[] = []
  if (s.bgGradient) {
    parts.push(`background-image:${s.bgGradient}`)
    parts.push('background-size:cover')
    parts.push('background-position:center')
  } else if (s.bgImage) {
    const bgImage = safeAssetUrl(s.bgImage)
    if (bgImage) {
      parts.push(`background-image:url("${bgImage.replace(/"/g, '%22')}")`)
      parts.push('background-size:cover')
      parts.push('background-position:center')
    }
  }
  if (!s.bgGradient && s.bgColor) parts.push(`background-color:${s.bgColor}`)
  if (s.bgAttachment === 'fixed') parts.push('background-attachment:fixed')
  if (s.textColor) parts.push(`color:${s.textColor}`)
  if (s.paddingTop) parts.push(`padding-top:${s.paddingTop}`)
  if (s.paddingBottom) parts.push(`padding-bottom:${s.paddingBottom}`)
  if (s.paddingLeft) parts.push(`padding-left:${s.paddingLeft}`)
  if (s.paddingRight) parts.push(`padding-right:${s.paddingRight}`)
  if (s.borderRadius) parts.push(`border-radius:${s.borderRadius}`)
  if (s.decoration && s.decoration !== 'none') parts.push('position:relative;overflow:hidden')
  return parts.join(';')
}

function animationClass(s: Record<string, any>): string {
  return s.animation && s.animation !== 'none' ? `pf-${s.animation}` : ''
}

function decorationHtml(s: Record<string, any>): string {
  const asset = findDecoration(s.decoration)
  if (!asset) return ''
  const wrapperStyle = `position:absolute;${cssPosition(asset.position)};${cssSize(asset.size)};opacity:${asset.opacity};pointer-events:none;overflow:hidden;`
  const color = asset.colorClass ? cssColorFromClass(asset.colorClass) : 'currentColor'
  const innerStyle = `width:100%;height:100%;color:${color};`
  return `<div style="${wrapperStyle}" aria-hidden="true"><div style="${innerStyle}">${asset.raw}</div></div>`
}

function cssPosition(tw: string): string {
  const NEG = (n: number) => `-${n * 0.25}rem`
  const POS = (n: number) => `${n * 0.25}rem`
  const out: string[] = []
  const tokens = tw.split(/\s+/)
  for (const t of tokens) {
    const m = t.match(/^(-?)(\w+)-(-?\d+)$/)
    if (!m) continue
    const [, neg, side, num] = m
    const px = parseInt(num)
    const val = neg ? NEG(px) : POS(px)
    if (side === 'top') out.push(`top:${val}`)
    else if (side === 'bottom') out.push(`bottom:${val}`)
    else if (side === 'left') out.push(`left:${val}`)
    else if (side === 'right') out.push(`right:${val}`)
  }
  if (tw.includes('inset-0')) out.push('top:0;right:0;bottom:0;left:0')
  return out.join(';')
}

function cssSize(tw: string): string {
  const tokens = tw.split(/\s+/)
  const out: string[] = []
  for (const t of tokens) {
    const m = t.match(/^(w|h)-(.+)$/)
    if (!m) continue
    const [, dim, val] = m
    out.push(`${dim === 'w' ? 'width' : 'height'}:${twToSize(val)}`)
  }
  return out.join(';')
}

function twToSize(v: string): string {
  if (v === 'full') return '100%'
  if (v === 'screen') return '100vh'
  const m = v.match(/^(\d+)$/)
  if (!m) return 'auto'
  return `${parseInt(m[1]) * 0.25}rem`
}

function cssColorFromClass(cls: string): string {
  if (cls.includes('blue-400')) return '#60a5fa'
  if (cls.includes('purple-400')) return '#c084fc'
  if (cls.includes('pink-400')) return '#f472b6'
  return '#60a5fa'
}

/** 保留的 Tailwind class */
function twClass(s: Record<string, any>): string {
  return [s.textAlign, s.shadow, s.maxWidth].filter(Boolean).join(' ')
}

function titleStyle(s: Record<string, any>): string {
  return s.titleFontSize ? `font-size:${s.titleFontSize}` : ''
}

function bodyStyle(s: Record<string, any>): string {
  return s.bodyFontSize ? `font-size:${s.bodyFontSize}` : ''
}

function ctaClass(variant: string | undefined, context: 'hero' | 'cta' = 'hero'): string {
  if (variant === 'dark') return 'bg-gray-900 text-white hover:bg-gray-800'
  if (variant === 'light') return 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50'
  if (variant === 'outline') return 'bg-transparent text-white ring-1 ring-white/60 hover:bg-white/10'
  return context === 'cta'
    ? 'bg-white text-blue-600 hover:bg-blue-50'
    : 'bg-blue-600 text-white hover:bg-blue-700'
}

function renderHero(c: Record<string, any>, s: Record<string, any>): string {
  const btn = c.ctaText ? `<a href="${esc(safeLinkUrl(c.ctaLink))}" class="inline-block px-8 py-3 font-medium rounded-lg ${ctaClass(c.ctaVariant)}">${esc(c.ctaText)}</a>` : ''
  const imageUrl = safeAssetUrl(c.imageUrl)
  const img = imageUrl ? `<div class="flex-1 flex justify-center"><img src="${esc(imageUrl)}" alt="Hero" class="max-w-full h-auto rounded-lg shadow-lg"></div>` : ''
  return `
<section style="${boxStyle(s)}" class="${twClass(s)} ${animationClass(s)}">
  ${decorationHtml(s)}
  <div class="max-w-6xl mx-auto px-4">
    <div class="flex flex-col md:flex-row items-center gap-8${c.alignment === 'center' ? ' text-center' : ''}">
      <div class="flex-1">
        <h1 class="font-bold mb-4" style="${titleStyle(s)}">${esc(c.title || '')}</h1>
        <p class="mb-8 max-w-2xl" style="${bodyStyle(s)}">${esc(c.subtitle || '')}</p>
        ${btn}
      </div>
      ${img}
    </div>
  </div>
</section>`
}

function renderFeatures(c: Record<string, any>, s: Record<string, any>): string {
  const cards = (c.features || []).map((f: any) => `
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      ${f.icon && (f.icon.startsWith('http://') || f.icon.startsWith('https://')) ? `<img src="${esc(f.icon)}" class="w-12 h-12 object-contain mb-3" alt="icon">` : `<span class="text-3xl mb-3 block">${esc(f.icon || '')}</span>`}
      <h3 class="text-lg font-semibold text-gray-900 mb-2">${esc(f.title || '')}</h3>
      <p class="text-gray-600 text-sm">${esc(f.description || '')}</p>
    </div>`).join('')
  return `
<section style="${boxStyle(s)}" class="${twClass(s)} ${animationClass(s)}">
  ${decorationHtml(s)}
  <div class="max-w-6xl mx-auto px-4">
    <h2 class="font-bold mb-4" style="${titleStyle(s)}">${esc(c.title || '')}</h2>
    <p class="mb-12 max-w-2xl" style="${bodyStyle(s)}">${esc(c.subtitle || '')}</p>
    <div class="grid gap-8 md:grid-cols-${c.columns || 3}">${cards}</div>
  </div>
</section>`
}

function renderPricing(c: Record<string, any>, s: Record<string, any>): string {
  const cards = (c.plans || []).map((p: any) => {
    const hl = p.highlighted ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-white text-gray-900 border-gray-200 shadow-sm'
    const feats = (p.features || []).map((f: string) => `<li class="flex items-center gap-2 text-sm ${p.highlighted ? 'text-blue-50' : 'text-gray-600'}"><span>: </span> ${esc(f)}</li>`).join('')
    return `
    <div class="rounded-xl p-8 border ${hl}">
      <h3 class="text-xl font-bold mb-2">${esc(p.name || '')}</h3>
      <p class="text-sm mb-4 ${p.highlighted ? 'text-blue-100' : 'text-gray-500'}">${esc(p.description || '')}</p>
      <div class="mb-6"><span class="text-4xl font-bold">${esc(c.currency || '')}${esc(p.price || '')}</span><span class="text-sm ${p.highlighted ? 'text-blue-200' : 'text-gray-400'}">${esc(p.period || '')}</span></div>
      <ul class="space-y-3 mb-8">${feats}</ul>
      <a href="#" class="block text-center py-3 rounded-lg font-medium ${p.highlighted ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}">${esc(p.ctaText || '')}</a>
    </div>`
  }).join('')
  return `
<section style="${boxStyle(s)}" class="${twClass(s)} ${animationClass(s)}">
  ${decorationHtml(s)}
  <div class="max-w-6xl mx-auto px-4">
    <h2 class="font-bold mb-4" style="${titleStyle(s)}">${esc(c.title || '')}</h2>
    <p class="mb-12 max-w-2xl" style="${bodyStyle(s)}">${esc(c.subtitle || '')}</p>
    <div class="grid gap-8 md:grid-cols-3 items-start">${cards}</div>
  </div>
</section>`
}

function renderCTA(c: Record<string, any>, s: Record<string, any>): string {
  return `
<section style="${boxStyle(s)}" class="${twClass(s)} ${animationClass(s)}">
  ${decorationHtml(s)}
  <div class="max-w-4xl mx-auto px-4 text-center">
    <h2 class="font-bold mb-4" style="${titleStyle(s)}">${esc(c.title || '')}</h2>
    <p class="mb-8 opacity-90" style="${bodyStyle(s)}">${esc(c.subtitle || '')}</p>
    ${c.ctaText ? `<a href="${esc(safeLinkUrl(c.ctaLink))}" class="inline-block px-8 py-3 font-medium rounded-lg ${ctaClass(c.ctaVariant, 'cta')}">${esc(c.ctaText)}</a>` : ''}
  </div>
</section>`
}

function renderTestimonials(c: Record<string, any>, s: Record<string, any>): string {
  const cards = (c.testimonials || []).map((t: any) => {
    const avatarUrl = safeAssetUrl(t.avatarUrl)
    return `
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <p class="text-gray-700 mb-4 italic">"${esc(t.quote || '')}"</p>
      <div class="flex items-center gap-3">
        ${avatarUrl ? `<img src="${esc(avatarUrl)}" class="w-10 h-10 rounded-full object-cover" alt="avatar">` : '<div class="w-10 h-10 rounded-full bg-gray-300"></div>'}
        <div><p class="text-sm font-semibold text-gray-900">${esc(t.name || '')}</p><p class="text-xs text-gray-500">${esc(t.title || '')}</p></div>
      </div>
    </div>`
  }).join('')
  return `
<section style="${boxStyle(s)}" class="${twClass(s)} ${animationClass(s)}">
  ${decorationHtml(s)}
  <div class="max-w-6xl mx-auto px-4">
    <h2 class="font-bold mb-4" style="${titleStyle(s)}">${esc(c.title || '')}</h2>
    <p class="mb-12 max-w-2xl" style="${bodyStyle(s)}">${esc(c.subtitle || '')}</p>
    <div class="grid gap-8 md:grid-cols-${c.columns || 3}">${cards}</div>
  </div>
</section>`
}

function renderFaq(c: Record<string, any>, s: Record<string, any>): string {
  const items = (c.faqs || []).map((f: any) => `
    <div class="border-b border-gray-200 py-5">
      <h3 class="text-lg font-semibold mb-2">${esc(f.question || '')}</h3>
      <p class="text-gray-600">${esc(f.answer || '')}</p>
    </div>`).join('')
  return `
<section style="${boxStyle(s)}" class="${twClass(s)} ${animationClass(s)}">
  ${decorationHtml(s)}
  <div class="max-w-4xl mx-auto px-4">
    <h2 class="font-bold mb-4" style="${titleStyle(s)}">${esc(c.title || '')}</h2>
    <p class="mb-12 opacity-80" style="${bodyStyle(s)}">${esc(c.subtitle || '')}</p>
    ${items}
  </div>
</section>`
}

function renderFooter(c: Record<string, any>, s: Record<string, any>): string {
  const links = (c.links || []).map((l: any) => `<a href="${esc(safeLinkUrl(l.url))}" class="text-sm opacity-70 hover:opacity-100">${esc(l.title || '')}</a>`).join('')
  return `
<footer style="${boxStyle(s)}" class="${twClass(s)} ${animationClass(s)}">
  ${decorationHtml(s)}
  <div class="max-w-6xl mx-auto px-4">
    <div class="flex flex-wrap justify-between gap-8 mb-8">
      <div class="max-w-xs"><h3 class="text-lg font-bold mb-3">${esc(c.companyName || '')}</h3><p class="text-sm opacity-70">${esc(c.description || '')}</p></div>
      <div class="flex flex-wrap gap-6">${links}</div>
    </div>
    <div class="border-t border-current/20 pt-6 text-sm opacity-50">${esc(c.copyright || '')}</div>
  </div>
</footer>`
}

function renderRow(comp: PageComponent): string {
  const normalized = normalizeRowComponent(comp)
  const c = normalized.content
  const s = normalized.styles
  const columns = getRowColumns(normalized)
  const colsHtml = columns.map((column) =>
    `<div class="space-y-4">${column.children.map(child => renderComponent(child)).join('')}</div>`
  ).join('')
  const alignItems = c.verticalAlign === 'top' ? 'start' : (c.verticalAlign || 'start')
  return `
<section style="${boxStyle(s)}" class="${twClass(s)} ${animationClass(s)}">
  ${decorationHtml(s)}
  <div class="max-w-6xl mx-auto px-4">
    <div class="grid grid-cols-1 md:grid-cols-${columns.length} gap-${c.gap || '8'}" style="align-items:${esc(alignItems)}">${colsHtml}</div>
  </div>
</section>`
}

function renderComponent(comp: PageComponent): string {
  switch (comp.type) {
    case 'hero': return renderHero(comp.content, comp.styles)
    case 'features': return renderFeatures(comp.content, comp.styles)
    case 'pricing': return renderPricing(comp.content, comp.styles)
    case 'cta': return renderCTA(comp.content, comp.styles)
    case 'testimonials': return renderTestimonials(comp.content, comp.styles)
    case 'faq': return renderFaq(comp.content, comp.styles)
    case 'footer': return renderFooter(comp.content, comp.styles)
    case 'row': return renderRow(comp)
    default: return ''
  }
}

export function buildHTML(components: PageComponent[], pageSettings: PageSettings): string {
  const body = components.map(renderComponent).join('\n')
  const ogImage = safeAssetUrl(pageSettings.ogImage)
  const faviconUrl = safeAssetUrl(pageSettings.faviconUrl)
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(pageSettings.title || 'Landing Page')}</title>
  <meta name="description" content="${esc(pageSettings.description || '')}">
  <meta property="og:title" content="${esc(pageSettings.title || 'Landing Page')}">
  <meta property="og:description" content="${esc(pageSettings.description || '')}">
  ${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
  ${faviconUrl ? `<link rel="icon" href="${esc(faviconUrl)}">` : ''}
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    :root {
      --pf-primary: ${esc(pageSettings.primaryColor)};
      --pf-accent: ${esc(pageSettings.accentColor || '#0f172a')};
      --pf-surface: ${esc(pageSettings.surfaceColor || '#ffffff')};
      --pf-text: ${esc(pageSettings.textColor || '#111827')};
    }
    body { font-family: ${esc(pageSettings.fontFamily)}; background-color: ${esc(pageSettings.backgroundColor)}; color: var(--pf-text); }
    @keyframes pf-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pf-slide-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pf-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    .pf-fade-in { animation: pf-fade-in 0.6s ease-out both; }
    .pf-slide-up { animation: pf-slide-up 0.6s ease-out both; }
    .pf-float { animation: pf-float 3s ease-in-out infinite; }
  </style>
</head>
<body style="background-color:${esc(pageSettings.backgroundColor)}">
${body}
</body>
</html>`
}
