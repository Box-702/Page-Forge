import { Injectable, Logger } from '@nestjs/common'
import { ClaudeService } from '../claude.service'
import { SessionsService, type AgentSession } from './sessions.service'
import { buildAgentSystem, type AgentContext } from './prompts/agent.system'
import { TOOL_REGISTRY, executeGenerateBlocks, type ToolResult } from './tools/generateBlocks'
import type { ClaudeProxyDto } from '../ai.dto'

export interface AgentTurnRequest {
  sessionId?: string
  userMessage: string
  pageSummary?: string
  docContext?: string
}

const MAX_ITERATIONS = 4
const MAX_TOKENS_PER_TURN = 4096

interface LoopEvent {
  type: string
  [key: string]: any
}

/** Anthropic-compatible message (content can be string or content-block array). */
type Msg = { role: 'user' | 'assistant'; content: string | any[] }

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name)

  constructor(
    private readonly claude: ClaudeService,
    private readonly sessions: SessionsService,
  ) {}

  async *runTurn(req: AgentTurnRequest, signal?: AbortSignal): AsyncGenerator<LoopEvent> {
    let session: AgentSession
    if (req.sessionId && this.sessions.has(req.sessionId)) {
      session = this.sessions.get(req.sessionId)!
    } else if (req.sessionId) {
      yield { type: 'session_expired', sessionId: req.sessionId }
      session = this.sessions.create()
    } else {
      session = this.sessions.create()
    }

    yield { type: 'session', sessionId: session.id, messageCount: session.messages.length }

    session.messages.push({ role: 'user', content: req.userMessage } as Msg)
    session.updatedAt = Date.now()

    const ctx: AgentContext = {
      pageSummary: req.pageSummary,
      docContext: req.docContext,
    }
    const system = buildAgentSystem(ctx)

    let iter = 0
    while (iter < MAX_ITERATIONS) {
      iter++
      yield { type: 'iteration_start', iteration: iter }

      const dto: ClaudeProxyDto = {
        model: 'claude-sonnet-4-6',
        maxTokens: MAX_TOKENS_PER_TURN,
        system,
        messages: session.messages as any,
        tools: TOOL_REGISTRY as any,
      }

      let finalText = ''
      const toolUseBlocks: Array<{ id: string; name: string; input: any }> = []

      try {
        for await (const ev of this.claude.stream({ ...dto, signal })) {
          if (signal?.aborted) {
            yield { type: 'aborted' }
            return
          }
          if (ev.type === 'text_delta' && ev.text) {
            finalText += ev.text
            yield { type: 'text_delta', text: ev.text }
          } else if (ev.type === 'tool_use' && ev.name) {
            toolUseBlocks.push({ id: ev.id, name: ev.name, input: ev.input })
            yield { type: 'tool_call', id: ev.id, name: ev.name, input: ev.input }
          } else if (ev.type === 'message_end') {
            yield { type: 'message_end', stop_reason: ev.stop_reason, usage: ev.usage }
          } else if (ev.type === 'error') {
            yield { type: 'error', message: ev.message }
            return
          }
        }
      } catch (e) {
        yield { type: 'error', message: (e as Error).message }
        return
      }

      if (toolUseBlocks.length === 0) {
        session.messages.push({ role: 'assistant', content: finalText || '(空回复)' } as Msg)
        break
      }

      // Store assistant message as proper content-block array
      const assistantContent: any[] = []
      if (finalText) assistantContent.push({ type: 'text', text: finalText })
      for (const t of toolUseBlocks) {
        assistantContent.push({ type: 'tool_use', id: t.id, name: t.name, input: t.input })
      }
      session.messages.push({ role: 'assistant', content: assistantContent } as Msg)

      // Execute tools
      const toolResults: ToolResult[] = await Promise.all(
        toolUseBlocks.map((t) => this.executeTool(t.name, t.input)),
      )

      // Build tool_result content blocks
      const toolResultBlocks = toolUseBlocks.map((t, i) => {
        const r = toolResults[i]
        const resultText = r.ok
          ? JSON.stringify(r.data).slice(0, 4000)
          : `Error: ${r.error ?? '未知错误'}`
        return { type: 'tool_result', tool_use_id: t.id, content: resultText }
      })
      session.messages.push({ role: 'user', content: toolResultBlocks } as Msg)

      // Yield results to frontend
      for (const r of toolResults) {
        if (r.ok) {
          yield { type: 'tool_result', toolName: r.toolName, ok: true, data: r.data }
        } else {
          yield { type: 'tool_result', toolName: r.toolName, ok: false, error: r.error }
        }
      }

      const compactResult = this.sessions.maybeCompact(session.id)
      if (compactResult.compacted) {
        yield { type: 'context_compacted', droppedCount: compactResult.droppedCount }
      }
    }

    if (iter >= MAX_ITERATIONS) {
      yield { type: 'iteration_limit', max: MAX_ITERATIONS }
    }

    yield { type: 'done', sessionId: session.id, iterations: iter }
  }

  private async executeTool(name: string, input: any): Promise<ToolResult> {
    if (name === 'generate_blocks') {
      return executeGenerateBlocks(input ?? {})
    }
    return { toolName: name, ok: false, error: `未知工具: ${name}` }
  }
}
