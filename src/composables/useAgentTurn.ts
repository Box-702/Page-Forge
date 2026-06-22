import { ref, computed } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import { useAgentStore } from '@/stores/agent'
import { useSession } from './useSession'

export interface PageSummary {
  blockCount: number
  blockTypes: string[]
  text: string
}

function summarize(builder: ReturnType<typeof useBuilderStore>): PageSummary {
  const blocks = builder.components
  const blockTypes = blocks.map((b) => b.type)
  const titles = blocks
    .map((b) => {
      const c: any = b.content
      return c?.title || c?.companyName || ''
    })
    .filter(Boolean)
    .slice(0, 6)
  return {
    blockCount: blocks.length,
    blockTypes,
    text: titles.length > 0
      ? `当前页面有 ${blocks.length} 个 block(${blockTypes.join(', ')}),标题:${titles.join(' / ')}`
      : '(画布为空)',
  }
}

export function useAgentTurn() {
  const builder = useBuilderStore()
  const agent = useAgentStore()
  const session = useSession()

  const abortCtrl = ref<AbortController | null>(null)
  const isStreaming = computed(() => agent.isStreaming)
  /** Generation counter prevents stale finally-block from applying data after rapid abort→send */
  let generation = 0

  async function send(userMessage: string, docContext?: string) {
    if (!userMessage.trim() || agent.isStreaming) return
    agent.error = null
    agent.sessionExpired = false

    agent.pushUser(userMessage)
    agent.isStreaming = true

    generation++
    const myGeneration = generation

    const ctrl = new AbortController()
    abortCtrl.value = ctrl

    const assistantId = agent.startAssistant()
    const accumulatedToolCalls: any[] = []
    let lastRationale = ''
    let replaceExisting = false
    let generatedBlocks: any[] = []

    try {
      const res = await fetch('/api/agent/turn', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: agent.sessionId,
          userMessage,
          pageSummary: summarize(builder).text,
          docContext: agent.documentText ?? docContext,
        }),
        signal: ctrl.signal,
      })

      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => '')
        throw new Error(`代理返回 ${res.status}: ${txt.slice(0, 200)}`)
      }

      agent.sessionId = session.currentSessionId.value

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buf = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })

        let idx: number
        while ((idx = buf.indexOf('\n\n')) !== -1) {
          const frame = buf.slice(0, idx)
          buf = buf.slice(idx + 2)
          const evt = parseFrame(frame)
          if (evt) handleEvent(evt, myGeneration)
        }
      }

      // Flush trailing frame (stream may end without trailing \n\n)
      if (buf.trim()) {
        const evt = parseFrame(buf)
        if (evt) handleEvent(evt, myGeneration)
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        // user cancelled — don't set error
      } else {
        agent.error = (e as Error).message
      }
    } finally {
      // Only apply state if this is still the active generation
      if (myGeneration === generation) {
        agent.isStreaming = false
        agent.finishAssistant(assistantId, accumulatedToolCalls)
        if (generatedBlocks.length > 0) {
          builder.previewAgentEdit({
            rationale: lastRationale,
            replaceExisting,
            blocks: generatedBlocks,
          })
        }
      }
    }

    function handleEvent(evt: any, gen: number) {
      if (gen !== generation) return // stale generation — discard
      const t = evt.type
      if (t === 'session') {
        agent.sessionId = evt.sessionId
        session.currentSessionId.value = evt.sessionId
        try { localStorage.setItem('page-forge-agent-session', evt.sessionId) } catch { /* */ }
      } else if (t === 'session_expired') {
        agent.sessionExpired = true
        // Auto-create new session — the backend already does this, but we clear local state
        agent.messages = []
        agent.pushUser(`[会话已过期,自动新建]`)
      } else if (t === 'text_delta' && evt.text) {
        agent.appendAssistantDelta(assistantId, evt.text)
      } else if (t === 'tool_call') {
        const toolCall = {
          id: evt.id,
          name: evt.name,
          input: evt.input,
        }
        accumulatedToolCalls.push(toolCall)
        if (evt.name === 'generate_blocks' && evt.input) {
          lastRationale = evt.input.rationale || ''
          replaceExisting = !!evt.input.replaceExisting
          generatedBlocks = Array.isArray(evt.input.blocks) ? evt.input.blocks : []
        }
      } else if (t === 'tool_result' && evt.ok === false) {
        agent.appendAssistantDelta(
          assistantId,
          `\n\n[工具 ${evt.toolName} 执行失败: ${evt.error ?? '未知错误'}]`,
        )
      } else if (t === 'error') {
        agent.error = evt.message
        agent.appendAssistantDelta(assistantId, `\n\n⚠ ${evt.message}`)
      } else if (t === 'iteration_limit') {
        agent.appendAssistantDelta(assistantId, `\n\n(达到最大迭代次数 ${evt.max},已停止)`)
      } else if (t === 'context_compacted') {
        agent.appendAssistantDelta(assistantId, `\n\n[已压缩 ${evt.droppedCount} 条早期消息]`)
      }
    }
  }

  function abort() {
    if (abortCtrl.value) {
      abortCtrl.value.abort()
      abortCtrl.value = null
    }
    generation++ // invalidate any in-flight handleEvent
    agent.isStreaming = false
  }

  return { send, abort, isStreaming }
}

function parseFrame(frame: string): any | null {
  let dataLine = ''
  for (const line of frame.split('\n')) {
    if (line.startsWith('data:')) dataLine += line.slice(5).trim()
  }
  if (!dataLine) return null
  try { return JSON.parse(dataLine) } catch { return null }
}
