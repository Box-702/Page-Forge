import { Injectable, Logger } from '@nestjs/common'
import type { ClaudeMessage } from '../ai.dto'

export interface AgentSession {
  id: string
  messages: ClaudeMessage[]
  createdAt: number
  updatedAt: number
  /** 累计滚动摘要(超过 12 轮时把更早的对话压成 1 条 system message) */
  rollingSummary?: string
}

const MAX_VERBATIM_MESSAGES = 12
const SUMMARIZE_TRIGGER = 14

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name)
  private readonly sessions = new Map<string, AgentSession>()

  create(): AgentSession {
    const id = randomSessionId()
    const now = Date.now()
    const session: AgentSession = {
      id,
      messages: [],
      createdAt: now,
      updatedAt: now,
    }
    this.sessions.set(id, session)
    return session
  }

  get(id: string): AgentSession | undefined {
    return this.sessions.get(id)
  }

  has(id: string): boolean {
    return this.sessions.has(id)
  }

  delete(id: string): boolean {
    return this.sessions.delete(id)
  }

  list(): { id: string; updatedAt: number }[] {
    return Array.from(this.sessions.values()).map((s) => ({ id: s.id, updatedAt: s.updatedAt }))
  }

  appendUserMessage(id: string, message: ClaudeMessage): AgentSession {
    const session = this.require(id)
    session.messages.push(message)
    session.updatedAt = Date.now()
    return session
  }

  appendAssistantMessage(id: string, message: ClaudeMessage): AgentSession {
    const session = this.require(id)
    session.messages.push(message)
    session.updatedAt = Date.now()
    return session
  }

  /**
   * 如果消息数超过阈值,把前面 N 条压成一条摘要 + 删除。
   * 维护 user/assistant 交替:摘要作为 assistant 消息插入。
   */
  maybeCompact(id: string): { compacted: boolean; droppedCount: number } {
    const session = this.require(id)
    if (session.messages.length < SUMMARIZE_TRIGGER) return { compacted: false, droppedCount: 0 }
    const toDrop = session.messages.length - MAX_VERBATIM_MESSAGES
    if (toDrop <= 0) return { compacted: false, droppedCount: 0 }

    const dropped = session.messages.splice(0, toDrop)
    const summary = summarizeLocally(dropped, session.rollingSummary)
    session.rollingSummary = summary

    // Insert as assistant message (maintains alternation with next user message)
    session.messages.unshift({
      role: 'assistant',
      content: `[对话历史摘要]\n${summary}\n\n(以下为近 ${MAX_VERBATIM_MESSAGES} 轮对话原文)`,
    } as any)
    return { compacted: true, droppedCount: toDrop }
  }

  private require(id: string): AgentSession {
    const s = this.sessions.get(id)
    if (!s) {
      const err: any = new Error(`session ${id} 不存在或已过期`)
      err.status = 410
      throw err
    }
    return s
  }
}

function randomSessionId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/**
 * 本地粗粒度摘要(不调 LLM)。v1 只保留用户意图 + 工具调用过的动作名。
 * 后续可以替换为 Claude 摘要,但对当前 MVP 足够。
 */
function summarizeLocally(dropped: ClaudeMessage[], prev?: string): string {
  const lines: string[] = []
  if (prev) lines.push(prev)
  for (const m of dropped) {
    const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    if (m.role === 'user') {
      const snippet = content.slice(0, 80).replace(/\s+/g, ' ').trim()
      lines.push(`用户: ${snippet}${content.length > 80 ? '…' : ''}`)
    } else if (m.role === 'assistant') {
      const tcMatch = content.match(/\[tool_use\][^\n]*name=([a-z_]+)/g)
      if (tcMatch) {
        for (const t of tcMatch) lines.push(`Agent 调用工具: ${t}`)
      }
    }
  }
  return lines.join('\n').slice(0, 1200)
}
