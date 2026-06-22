import { ref } from 'vue'

const MAX_BYTES = 20 * 1024
const SUPPORTED_EXT = ['.txt', '.md', '.markdown', '.json']

export function useDocumentContext() {
  const documentName = ref<string | null>(null)
  const documentText = ref<string | null>(null)
  const error = ref<string | null>(null)

  function clear() {
    documentName.value = null
    documentText.value = null
    error.value = null
  }

  function isSupported(file: File): boolean {
    const lower = file.name.toLowerCase()
    return SUPPORTED_EXT.some((ext) => lower.endsWith(ext))
  }

  async function load(file: File): Promise<{ ok: boolean; error?: string }> {
    error.value = null
    if (!isSupported(file)) {
      error.value = `不支持的文件类型,仅支持 ${SUPPORTED_EXT.join(', ')}`
      return { ok: false, error: error.value }
    }
    if (file.size > MAX_BYTES) {
      error.value = `文件过大(${Math.round(file.size / 1024)} KB),上限 20 KB`
      return { ok: false, error: error.value }
    }
    try {
      const text = await file.text()
      documentName.value = file.name
      documentText.value = text
      return { ok: true }
    } catch (e) {
      error.value = (e as Error).message
      return { ok: false, error: error.value }
    }
  }

  return {
    documentName,
    documentText,
    error,
    load,
    clear,
    isSupported,
    maxBytes: MAX_BYTES,
  }
}