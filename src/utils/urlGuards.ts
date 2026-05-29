const RELATIVE_PREFIXES = ['#', '/', './', '../']
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const SAFE_ASSET_PROTOCOLS = new Set(['http:', 'https:'])
const SAFE_DATA_IMAGE = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i

function isRelativeUrl(value: string): boolean {
  if (value.startsWith('//')) return false
  return RELATIVE_PREFIXES.some((prefix) => value.startsWith(prefix))
}

function hasSafeProtocol(value: string, protocols: Set<string>): boolean {
  try {
    return protocols.has(new URL(value).protocol)
  } catch {
    return false
  }
}

export function isSafeLinkUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  return isRelativeUrl(trimmed) || hasSafeProtocol(trimmed, SAFE_LINK_PROTOCOLS)
}

export function isSafeAssetUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  return isRelativeUrl(trimmed) || hasSafeProtocol(trimmed, SAFE_ASSET_PROTOCOLS) || SAFE_DATA_IMAGE.test(trimmed)
}

export function safeLinkUrl(value: string | undefined, fallback = '#'): string {
  const trimmed = (value || '').trim()
  if (!trimmed) return fallback
  return isSafeLinkUrl(trimmed) ? trimmed : fallback
}

export function safeAssetUrl(value: string | undefined): string {
  const trimmed = (value || '').trim()
  return isSafeAssetUrl(trimmed) ? trimmed : ''
}
