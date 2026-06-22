export interface AISettings {
  anthropicKey?: string
  stabilityKey?: string
}

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
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

export interface ClaudeRequest {
  model?: 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001' | 'claude-opus-4-8'
  system?: string
  messages: ClaudeMessage[]
  tools?: ClaudeTool[]
  tool_choice?: { type: 'tool'; name: string } | { type: 'auto' }
  maxTokens?: number
  signal?: AbortSignal
}

export interface ClaudeResponse {
  content: Array<{ type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: any }>
  stop_reason: string | null
  usage?: { input_tokens: number; output_tokens: number }
}

export interface StabilityRequest {
  prompt: string
  width?: number
  height?: number
  steps?: number
  cfg_scale?: number
  signal?: AbortSignal
}