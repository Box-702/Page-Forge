import { Injectable, Logger } from '@nestjs/common'
import { ClaudeService } from '../claude.service'
import { SessionsService, type AgentSession } from './sessions.service'
import { buildAgentSystem, type AgentContext } from './prompts/agent.system'
import { TOOL_REGISTRY, executeGenerateBlocks, type ToolResult } from './tools/generateBlocks'
import type { ClaudeMessage, ClaudeProxyDto } from '../ai.dto'

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

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name)

  constructor(
    private readonly claude: ClaudeService,
    private readonly sessions: SessionsService,
  ) {}

  /**
   * 多步 agent loop。yield 给 controller 一个一个 emit 到 SSE。
   *
   * 流程:
   *   1. 拿到/创建 session,把 userMessage 追加
   *   2. 调 Claude,stream 收集 events
   *   3. 若 Claude 调了 tool:execute,tool_result 喂回,继续 iter
   *   4. 若 Claude 没调 tool(给了 final text)→ 写入 session,退出 loop
   *   5. iter >= MAX_ITERATIONS → 强制退出
   */
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

    session.messages.push({ role: 'user', content: req.userMessage })
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
        messages: session.messages,
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

      // 把这一轮的 assistant 消息存到 session(用 SDK 风格的 content block 表达)
      if (toolUseBlocks.length === 0) {
        session.messages.push({ role: 'assistant', content: finalText || '(空回复)' })
        break
      }

      // 构造 assistant 消息(含 tool_use)和对应的 tool_result user 消息
      const assistantContent = buildAssistantContent(finalText, toolUseBlocks)
      session.messages.push({ role: 'assistant', content: assistantContent as any })

      // 执行所有 tool_use,并行
      const toolResults: ToolResult[] = await Promise.all(
        toolUseBlocks.map((t) => this.executeTool(t.name, t.input)),
      )

      // 把 tool_result 喂回给 Claude
      const toolResultContent = buildToolResultContent(toolUseBlocks, toolResults)
      session.messages.push({ role: 'user', content: toolResultContent as any })

      // 通知前端 agent 提议了什么(等用户确认 / 自动进下一轮)
      for (const r of toolResults) {
        if (r.ok) {
          yield {
            type: 'tool_result',
            toolName: r.toolName,
            ok: true,
            data: r.data,
          }
        } else {
          yield {
            type: 'tool_result',
            toolName: r.toolName,
            ok: false,
            error: r.error,
          }
        }
      }

      // 滚动压缩(若有需要)
      const compactResult = this.sessions.maybeCompact(session.id)
      if (compactResult.compacted) {
        yield {
          type: 'context_compacted',
          droppedCount: compactResult.droppedCount,
        }
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

/**
 * 构造 SDK 风格的 assistant 消息: text + tool_use blocks。
 * v1 简化版:tool_use 不带完整 input JSON 序列化,我们只用 stored as plain text for now,
 * 因为下轮 Claude 只需要看到完整的 tool_use + tool_result 配对。
 */
function buildAssistantContent(text: string, toolUses: Array<{ id: string; name: string; input: any }>): string {
  const lines: string[] = []
  if (text) lines.push(text)
  for (const t of toolUses) {
    lines.push(`[tool_use] id=${t.id} name=${t.name} input=${JSON.stringify(t.input)}`)
  }
  return lines.join('\n')
}

function buildToolResultContent(
  toolUses: Array<{ id: string; name: string; input: any }>,
  results: ToolResult[],
): string {
  const blocks = toolUses.map((t, i) => {
    const r = results[i]
    const payload = r.ok
      ? `OK ${JSON.stringify(r.data).slice(0, 800)}`
      : `ERROR ${r.error ?? '未知错误'}`
    return `[tool_result] id=${t.id} ${payload}`
  })
  return blocks.join('\n')
}
