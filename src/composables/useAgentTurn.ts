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

  async function send(userMessage: string, docContext?: string) {
    if (!userMessage.trim() || agent.isStreaming) return
    agent.error = null
    agent.lastToolCalls = []
    agent.sessionExpired = false

    agent.pushUser(userMessage)
    agent.isStreaming = true

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
          if (!evt) continue
          handleEvent(evt)
        }
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        // user cancelled
      } else {
        agent.error = (e as Error).message
      }
    } finally {
      agent.isStreaming = false
      agent.finishAssistant(assistantId, accumulatedToolCalls)
      // 工具提议落库后,弹给用户预览
      if (generatedBlocks.length > 0) {
        builder.previewAgentEdit({
          rationale: lastRationale,
          replaceExisting,
          blocks: generatedBlocks,
        })
      }
    }

    function handleEvent(evt: any) {
      const t = evt.type
      if (t === 'session') {
        agent.sessionId = evt.sessionId
        session.currentSessionId.value = evt.sessionId
        try { localStorage.setItem('page-forge-agent-session', evt.sessionId) } catch { /* */ }
      } else if (t === 'session_expired') {
        agent.sessionExpired = true
      } else if (t === 'text_delta' && evt.text) {
        agent.appendAssistantDelta(assistantId, evt.text)
      } else if (t === 'tool_call') {
        accumulatedToolCalls.push({
          id: evt.id,
          name: evt.name,
          input: evt.input,
        })
        if (evt.name === 'generate_blocks' && evt.input) {
          lastRationale = evt.input.rationale || ''
          replaceExisting = !!evt.input.replaceExisting
          generatedBlocks = Array.isArray(evt.input.blocks) ? evt.input.blocks : []
        }
      } else if (t === 'tool_result' && !evt.ok) {
        // tool 执行失败,append 一条说明
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