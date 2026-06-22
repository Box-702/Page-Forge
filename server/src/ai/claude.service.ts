import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import type { ClaudeProxyDto, ClaudeResponse } from './ai.dto'

const ANTHROPIC_VERSION = '2023-06-01'

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name)
  private readonly apiKey: string | undefined
  private client: Anthropic | null = null

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ANTHROPIC_API_KEY')?.trim() || undefined
    if (!this.apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not set — Claude calls will fail until configured.')
    } else {
      this.client = new Anthropic({ apiKey: this.apiKey })
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-ant-')
  }

  /**
   * Blocking call. Kept for backward compat with /api/ai/claude.
   */
  async call(dto: ClaudeProxyDto): Promise<ClaudeResponse> {
    if (!this.isConfigured() || !this.client) {
      throw new ServiceUnavailableException(
        'Anthropic API key not configured on server. Set ANTHROPIC_API_KEY in server/.env.',
      )
    }
    try {
      const res = await this.client.messages.create({
        model: dto.model ?? 'claude-sonnet-4-6',
        max_tokens: dto.maxTokens ?? 2048,
        system: dto.system,
        messages: dto.messages as any,
        tools: dto.tools as any,
        tool_choice: dto.tool_choice as any,
      })
      return res as unknown as ClaudeResponse
    } catch (err) {
      this.logger.error('Anthropic call failed', err)
      throw new ServiceUnavailableException(
        `Anthropic API error: ${(err as Error).message}`,
      )
    }
  }

  /**
   * Async iterable of normalized events. Used by the agent SSE endpoint.
   *
   * Event shapes:
   *   { type: 'text_delta', text: string }
   *   { type: 'tool_use',    id, name, input }
   *   { type: 'message_end', stop_reason, usage }
   *   { type: 'error',       message }
   */
  async *stream(dto: ClaudeProxyDto & { signal?: AbortSignal }): AsyncGenerator<any> {
    if (!this.isConfigured() || !this.client) {
      throw new ServiceUnavailableException(
        'Anthropic API key not configured on server. Set ANTHROPIC_API_KEY in server/.env.',
      )
    }
    let stream
    try {
      stream = this.client.messages.stream({
        model: dto.model ?? 'claude-sonnet-4-6',
        max_tokens: dto.maxTokens ?? 4096,
        system: dto.system,
        messages: dto.messages as any,
        tools: dto.tools as any,
        tool_choice: dto.tool_choice as any,
      })
    } catch (err) {
      this.logger.error('Failed to open Anthropic stream', err)
      throw new ServiceUnavailableException(`Anthropic stream error: ${(err as Error).message}`)
    }

    if (dto.signal) {
      dto.signal.addEventListener('abort', () => {
        try { (stream as any).controller?.abort?.() } catch { /* ignore */ }
      })
    }

    try {
      for await (const event of stream as any) {
        const t = event?.type
        if (t === 'content_block_start') {
          const block = event.content_block
          if (block?.type === 'tool_use') {
            yield { type: 'tool_use_start', id: block.id, name: block.name }
          }
        } else if (t === 'content_block_delta') {
          const delta = event.delta
          if (delta?.type === 'text_delta') {
            yield { type: 'text_delta', text: delta.text }
          } else if (delta?.type === 'input_json_delta') {
            yield { type: 'tool_input_delta', id: event.index !== undefined ? `idx:${event.index}` : undefined, partial: delta.partial_json }
          }
        } else if (t === 'content_block_stop') {
          // Tool input fully accumulated — emit tool_use event from stream.message
        } else if (t === 'message_stop') {
          const msg = await stream.finalMessage().catch(() => null)
          yield {
            type: 'message_end',
            stop_reason: msg?.stop_reason ?? null,
            usage: msg?.usage ?? null,
          }
        }
      }
    } catch (err) {
      this.logger.error('Anthropic stream errored mid-flight', err)
      yield { type: 'error', message: (err as Error).message }
    }

    // After the SDK finishes emitting events, drain finalMessage once to extract
    // complete tool_use blocks so the agent loop can dispatch them.
    try {
      const final = await stream.finalMessage()
      for (const block of final.content ?? []) {
        if (block.type === 'tool_use') {
          yield { type: 'tool_use', id: block.id, name: block.name, input: block.input }
        }
      }
    } catch { /* swallow — finalMessage may throw on abort */ }
  }
}