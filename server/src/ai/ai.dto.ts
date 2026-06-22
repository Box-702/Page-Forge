export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | any[]
}

export interface ClaudeTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export class ClaudeProxyDto {
  model?: 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001' | 'claude-opus-4-8'
  system?: string
  messages!: ClaudeMessage[]
  tools?: ClaudeTool[]
  tool_choice?: { type: 'tool'; name: string } | { type: 'auto' }
  maxTokens?: number
}

export class ImageProxyDto {
  prompt!: string
  width?: number
  height?: number
  steps?: number
  cfg_scale?: number
}

export interface ClaudeContentBlock {
  type: 'text' | 'tool_use'
  text?: string
  id?: string
  name?: string
  input?: any
}

export interface ClaudeResponse {
  content: ClaudeContentBlock[]
  stop_reason: string | null
  usage?: { input_tokens: number; output_tokens: number }
}