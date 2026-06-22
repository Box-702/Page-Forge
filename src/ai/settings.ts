import type { AISettings } from './types'

export async function fetchHealth(): Promise<{ anthropic: boolean; stability: boolean }> {
  try {
    const res = await fetch('/api/ai/health')
    if (!res.ok) return { anthropic: false, stability: false }
    const data = await res.json() as { providers?: { anthropic?: boolean; stability?: boolean } }
    return {
      anthropic: !!data.providers?.anthropic,
      stability: !!data.providers?.stability,
    }
  } catch {
    return { anthropic: false, stability: false }
  }
}

/** @deprecated key is now stored server-side; this function returns an empty object. */
export function loadSettings(): AISettings {
  return {}
}

/** @deprecated key is now stored server-side; this is a no-op kept for type compatibility. */
export function saveSettings(_s: AISettings): void {
  // intentional no-op
}

export function maskKey(_key: string | undefined): string {
  return '后端托管'
}

export function isAnthropicConfigured(s: AISettings & { _anthropicReady?: boolean }): boolean {
  return !!s._anthropicReady
}

export function isStabilityConfigured(s: AISettings & { _stabilityReady?: boolean }): boolean {
  return !!s._stabilityReady
}