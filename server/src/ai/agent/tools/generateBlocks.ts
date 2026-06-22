import type { BlockSpec } from '../prompts/blockGuide'

export interface AgentTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface ToolResult {
  toolName: string
  ok: boolean
  data?: any
  error?: string
}

export const GENERATE_BLOCKS_TOOL: AgentTool = {
  name: 'generate_blocks',
  description:
    '生成 1 个或多个完整的 PageComponent block。可以是新增、也可以是完整替换当前页面。返回后用户在画布预览,确认后才应用。',
  input_schema: {
    type: 'object',
    properties: {
      rationale: {
        type: 'string',
        description: '为什么要这样设计(展示给用户的简短说明,1-2 句话)',
      },
      replaceExisting: {
        type: 'boolean',
        description: 'true = 完全替换当前画布;false = 追加到末尾(默认 false)',
      },
      blocks: {
        type: 'array',
        description: '完整 block 数组,每个元素必须包含 id/type/content/styles',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: {
              type: 'string',
              enum: ['hero', 'features', 'pricing', 'cta', 'testimonials', 'faq', 'footer', 'row'],
            },
            content: { type: 'object' },
            styles: { type: 'object' },
          },
          required: ['id', 'type', 'content'],
        },
      },
    },
    required: ['blocks', 'rationale'],
  },
}

/**
 * 执行 generate_blocks 工具。服务端不直接修改任何状态,
 * 只校验 + 返回结构化结果,前端 preview 后由用户确认。
 */
export async function executeGenerateBlocks(input: {
  rationale?: string
  replaceExisting?: boolean
  blocks: BlockSpec[]
}): Promise<ToolResult> {
  try {
    if (!Array.isArray(input.blocks) || input.blocks.length === 0) {
      return { toolName: GENERATE_BLOCKS_TOOL.name, ok: false, error: 'blocks 必须是非空数组' }
    }
    if (input.blocks.length > 12) {
      return {
        toolName: GENERATE_BLOCKS_TOOL.name,
        ok: false,
        error: '一次最多 12 个 block,用户消化不了更多',
      }
    }
    const validTypes = new Set(['hero', 'features', 'pricing', 'cta', 'testimonials', 'faq', 'footer', 'row'])
    const sanitized = input.blocks.map((b) => {
      if (!validTypes.has(b.type)) {
        throw new Error(`未知 block type: ${b.type}`)
      }
      if (!b.id || typeof b.id !== 'string') {
        b.id = randomId()
      }
      if (!b.content || typeof b.content !== 'object') {
        throw new Error(`block ${b.id} 缺少 content`)
      }
      return {
        id: b.id,
        type: b.type,
        content: b.content,
        styles: b.styles ?? {},
      } as BlockSpec
    })
    return {
      toolName: GENERATE_BLOCKS_TOOL.name,
      ok: true,
      data: {
        rationale: input.rationale ?? '',
        replaceExisting: !!input.replaceExisting,
        blocks: sanitized,
      },
    }
  } catch (e) {
    return { toolName: GENERATE_BLOCKS_TOOL.name, ok: false, error: (e as Error).message }
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

export const TOOL_REGISTRY: AgentTool[] = [GENERATE_BLOCKS_TOOL]
