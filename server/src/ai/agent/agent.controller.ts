import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { AgentService } from './agent.service'
import { SessionsService } from './sessions.service'
import { MultiReviewService } from './multi-review.service'
import { VariantsService } from './variants.service'
import { initSse, writeSse, endSse } from './stream'

interface TurnRequestBody {
  sessionId?: string
  userMessage: string
  pageSummary?: string
  docContext?: string
}

interface ReviewRequestBody {
  pageTitle?: string
  blocks: Array<{ id: string; type: string; content: any }>
}

interface PersonaRequestBody extends ReviewRequestBody {
  persona: string
}

interface VariantsRequestBody {
  brief: string
  currentPage?: { title?: string; blockCount?: number; blockTypes?: string[] }
}

@Controller('agent')
export class AgentController {
  constructor(
    private readonly agent: AgentService,
    private readonly sessions: SessionsService,
    private readonly multiReview: MultiReviewService,
    private readonly variants: VariantsService,
  ) {}

  /**
   * SSE 流式多轮 agent。
   * 前端 POST { sessionId?, userMessage, pageSummary?, docContext? }
   * 接收 event 流:text_delta / tool_call / tool_result / session / session_expired /
   *             iteration_start / iteration_limit / context_compacted / message_end /
   *             aborted / error / done
   */
  @Post('turn')
  @HttpCode(HttpStatus.OK)
  async turn(
    @Body() body: TurnRequestBody,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    initSse(res)

    const abortCtrl = new AbortController()
    req.on('close', () => {
      if (!abortCtrl.signal.aborted) abortCtrl.abort()
    })

    try {
      for await (const event of this.agent.runTurn(body, abortCtrl.signal)) {
        writeSse(res, event.type, event)
      }
      writeSse(res, 'done', { ok: true })
    } catch (err) {
      const status = (err as any)?.status
      if (status === 410) {
        writeSse(res, 'session_expired', { message: (err as Error).message })
      } else {
        writeSse(res, 'error', { message: (err as Error).message })
      }
    } finally {
      endSse(res)
    }
  }

  @Get('session')
  getSession(@Query('id') id: string, @Res() res: any) {
    if (!id) return res.json({ ok: false, error: 'missing id' })
    const s = this.sessions.get(id)
    if (!s) return res.status(410).json({ ok: false, status: 410, error: 'session not found' })
    return res.json({
      ok: true,
      sessionId: s.id,
      messageCount: s.messages.length,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })
  }

  @Post('session/new')
  @HttpCode(HttpStatus.OK)
  newSession() {
    const s = this.sessions.create()
    return { ok: true, sessionId: s.id }
  }

  @Get('sessions')
  listSessions() {
    return { ok: true, sessions: this.sessions.list() }
  }

  /**
   * M3: 多角色评审(3 个并行 Haiku 调用)。
   * 前端 POST { pageTitle?, blocks: [{ id, type, content }] }
   * 返回 { ok, review: MergedReview }
   */
  @Post('multi-review')
  @HttpCode(HttpStatus.OK)
  async multiReviewEndpoint(@Body() body: ReviewRequestBody) {
    if (!this.multiReview.isConfigured()) {
      return { ok: false, error: '后端 ANTHROPIC_API_KEY 未配置' }
    }
    try {
      const review = await this.multiReview.run({
        pageTitle: body.pageTitle,
        blocks: (body.blocks || []).map((b) => ({
          id: b.id,
          type: b.type,
          preview: stringifyBlock(b.content),
        })),
      })
      return { ok: true, review }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  }

  /**
   * M3: 单 persona 模拟。
   * 前端 POST { persona: "30 岁独立开发者重视隐私", blocks: [...] }
   */
  @Post('persona')
  @HttpCode(HttpStatus.OK)
  async personaEndpoint(@Body() body: PersonaRequestBody) {
    if (!this.multiReview.isConfigured()) {
      return { ok: false, error: '后端 ANTHROPIC_API_KEY 未配置' }
    }
    if (!body.persona?.trim()) {
      return { ok: false, error: 'persona 不能为空' }
    }
    try {
      const persona = await this.multiReview.runSinglePersona(body.persona.trim(), {
        pageTitle: body.pageTitle,
        blocks: (body.blocks || []).map((b) => ({
          id: b.id,
          type: b.type,
          preview: stringifyBlock(b.content),
        })),
      })
      return { ok: true, persona }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  }

  /**
   * M4: A/B 变体生成。
   * 前端 POST { brief, currentPage? }
   * 返回 { ok, variants: [...3 个不同 strategy 的完整 ProjectData + 元信息] }
   */
  @Post('variants')
  @HttpCode(HttpStatus.OK)
  async variantsEndpoint(@Body() body: VariantsRequestBody) {
    if (!body.brief?.trim()) {
      return { ok: false, error: 'brief 不能为空' }
    }
    if (!this.variants.isConfigured()) {
      return { ok: false, error: '后端 ANTHROPIC_API_KEY 未配置' }
    }
    try {
      const summaries = await this.variants.generate(body.brief.trim(), body.currentPage)
      const expanded = summaries.map((s) => ({
        ...s,
        projectData: this.variants.expand(s, body.brief.trim()),
      }))
      return { ok: true, variants: expanded }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  }
}

function stringifyBlock(content: any): string {
  if (!content || typeof content !== 'object') return ''
  const lines: string[] = []
  for (const [k, v] of Object.entries(content)) {
    if (k === 'backgroundType') continue
    if (v == null || v === '') continue
    if (typeof v === 'string') lines.push(`${k}: ${v.slice(0, 80)}`)
    else if (Array.isArray(v)) lines.push(`${k}: [${v.length} 项]`)
    else lines.push(`${k}: ${JSON.stringify(v).slice(0, 60)}`)
  }
  return lines.join(' | ').slice(0, 600)
}