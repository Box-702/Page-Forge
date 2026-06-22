# Page Forge

A Vue 3 visual landing page builder with drag sorting, nested rows, local persistence, undo/redo, static HTML export, and an AI agent powered by Anthropic Claude.

## Tech Stack

- **Frontend**: Vue 3 + TypeScript + Pinia + Tailwind CSS + Vite + SortableJS
- **Backend**: NestJS 10 (Node.js) + `@anthropic-ai/sdk`
- **AI Providers**: Anthropic Claude (text/reasoning) + Stability AI (image generation)

## Project Structure

```
├── src/                              # Vue 3 frontend
│   ├── types/index.ts                # PageComponent, PageSettings, ComponentStyles
│   ├── stores/
│   │   ├── builder.ts                # Main store — components, pageSettings, history, UI state
│   │   ├── agent.ts                  # Agent state — messages, streaming, sessionId, document
│   │   └── ai.ts                     # AI health state — backend reachable, provider status
│   ├── ai/
│   │   ├── types.ts                  # Shared AI types
│   │   ├── settings.ts               # fetchHealth() — probes backend health
│   │   ├── providers/
│   │   │   ├── anthropic.ts          # callClaude() — proxy via /api/ai/claude
│   │   │   └── stability.ts          # generateImage() — proxy via /api/ai/image
│   │   ├── prompts/
│   │   │   ├── rewriteBlock.ts       # REWRITE_TOOL + buildRewritePrompt()
│   │   │   └── generatePage.ts       # PAGE_TOOL + buildPagePrompt()
│   │   ├── reviewApi.ts              # callMultiReview() / callPersona()
│   │   ├── variantsApi.ts            # callVariants()
│   │   └── diagnosticsApi.ts         # callDiagnostics()
│   ├── composables/
│   │   ├── useAgentTurn.ts           # Multi-turn agent: SSE stream + session + generation counter
│   │   ├── useSession.ts             # localStorage-backed sessionId
│   │   ├── useDocumentContext.ts     # File upload (md/txt/json), 20KB cap
│   │   ├── useBlockStyle.ts          # Shared boxStyle for all blocks (gradient/image/color)
│   │   ├── useBuilder.ts             # Component add/remove/duplicate
│   │   ├── useHistory.ts             # Ctrl+Z / Ctrl+Shift+Z
│   │   ├── useLocalStorage.ts        # Debounced localStorage persistence
│   │   ├── useDragDrop.ts            # SortableJS integration
│   │   ├── useEditor.ts              # Block editor logic
│   │   ├── useExport.ts              # Static HTML export
│   │   ├── useInlineContent.ts       # Inline text editing
│   │   └── useProjects.ts            # Multi-project management
│   ├── components/
│   │   ├── builder/
│   │   │   ├── AgentPanel.vue        # AI agent chat panel (right docked sidebar)
│   │   │   ├── BuilderLayout.vue     # Root layout (canvas + sidebar + modals)
│   │   │   ├── BuilderCanvas.vue     # Central canvas for blocks
│   │   │   ├── Toolbar.vue           # Top toolbar (preview, undo/redo, export, Agent)
│   │   │   ├── RightSidebar.vue      # Content/style/page tabs
│   │   │   ├── StyleEditor.vue       # Style panel (gradients, decorations, animations)
│   │   │   ├── BlockDecoration.vue   # Decoration renderer (decoration SVG overlays)
│   │   │   ├── DecorationPicker.vue  # Decoration picker UI (category grid)
│   │   │   ├── PersonaReviewCard.vue # Multi-persona review display
│   │   │   ├── VariantPreviewModal.vue # A/B variant preview (3-up layout)
│   │   │   ├── AISettingsModal.vue   # Backend health / key status display
│   │   │   ├── AIPageModal.vue       # AI page generation modal
│   │   │   ├── AIRewriteModal.vue    # AI block rewrite modal (legacy)
│   │   │   ├── AIImageModal.vue      # AI image generation modal
│   │   │   ├── AIRewriteButton.vue   # AI rewrite button → opens AgentPanel
│   │   │   └── InlineText.vue        # contenteditable inline text
│   │   ├── blocks/                   # Block renderers (read-only preview)
│   │   │   ├── HeroBlock.vue
│   │   │   ├── FeaturesBlock.vue
│   │   │   ├── PricingBlock.vue
│   │   │   ├── CTABlock.vue
│   │   │   ├── TestimonialsBlock.vue
│   │   │   ├── FaqBlock.vue          # Uses h2 for title (fixed from h1)
│   │   │   ├── FooterBlock.vue
│   │   │   └── RowBlock.vue          # Multi-column layout container
│   │   └── editors/                  # Block content editors (sidebar forms)
│   │       ├── HeroEditor.vue, FeaturesEditor.vue, etc.
│   ├── data/
│   │   ├── templates.ts              # Predefined page templates
│   │   ├── decorationRegistry.ts     # Decoration SVG registry (6 categories, 14 assets)
│   │   └── visualPresets.ts          # Gradient presets
│   ├── assets/decorations/           # SVG decoration files
│   │   ├── blobs/ (4), waves/ (2), mesh/ (4), noise/ (2), squiggles/ (2)
│   └── utils/
│       ├── treeHelpers.ts            # Recursive find/update/remove/clone (row-aware, no redundant normalization)
│       ├── rowColumns.ts             # Row column normalization
│       ├── defaults.ts               # Default content factories per block type
│       ├── htmlExport.ts             # Static HTML generation (includes decorations inline, bgOverlay / urlGuards)
│       └── urlGuards.ts              # URL security validation for export
│
├── server/                           # NestJS backend (AI proxy + agent)
│   ├── src/
│   │   ├── main.ts                   # NestJS bootstrap, CORS, /api prefix
│   │   ├── app.module.ts             # Root module (ConfigModule, AIModule, AgentModule, DiagnosticsModule)
│   │   ├── ai/
│   │   │   ├── ai.module.ts          # DI: exports ClaudeService + StabilityService
│   │   │   ├── ai.controller.ts      # POST /ai/claude, POST /ai/image, GET /ai/health
│   │   │   ├── ai.dto.ts             # DTOs + response types
│   │   │   ├── claude.service.ts     # @anthropic-ai/sdk wrapper (blocking + stream)
│   │   │   └── stability.service.ts  # Stability AI proxy
│   │   ├── ai/agent/
│   │   │   ├── agent.module.ts
│   │   │   ├── agent.controller.ts   # POST /agent/turn (SSE), GET /agent/session, POST /agent/multi-review, POST /agent/persona, POST /agent/variants
│   │   │   ├── agent.service.ts      # Multi-step tool_use loop (proper Anthropic content blocks)
│   │   │   ├── sessions.service.ts   # In-memory Map<sessionId, Message[]>, rolling compaction
│   │   │   ├── stream.ts             # SSE helpers (initSse, writeSse, endSse)
│   │   │   ├── multi-review.service.ts # 3 parallel Haiku persona reviews
│   │   │   ├── variants.service.ts   # 3-variant A/B generation (Sonnet)
│   │   │   ├── prompts/
│   │   │   │   ├── agent.system.ts   # Main system prompt + buildAgentSystem()
│   │   │   │   ├── blockGuide.ts     # BLOCK_GUIDE_TEXT + BlockSpec
│   │   │   │   └── reviewRubric.ts   # 6-category review rubric + MergeReview
│   │   │   └── tools/
│   │   │       └── generateBlocks.ts # generate_blocks tool definition + executeGenerateBlocks()
│   │   └── ai/diagnostics/
│   │       ├── diagnostics.module.ts
│   │       ├── diagnostics.controller.ts # POST /diagnostics/run
│   │       └── diagnostics.service.ts    # Pure Node static analysis (SEO/a11y/headings/CTA/placeholder)
│   ├── .env.example                  # ANTHROPIC_API_KEY, STABILITY_API_KEY, PORT, CORS_ORIGINS
│   ├── .gitignore
│   ├── nest-cli.json
│   └── tsconfig.json
│
├── package.json                      # Root scripts + concurrently
├── vite.config.ts                    # Vite config + SSE-safe /api proxy
├── CLAUDE.md                         # This file
└── scripts/smoke.mjs                 # Build smoke test
```

## Agent System Architecture

### Multi-turn conversation
- **Backend session**: In-memory `Map<sessionId, Message[]>`. `POST /api/agent/turn` is a single SSE call per turn. Messages accumulate. Session auto-created; client localStorage only stores `sessionId`.
- **Tool use loop**: Backend calls Claude with `tools: [generate_blocks]`. Claude returns `tool_use` → backend executes → feeds `tool_result` as structured content block back → Claude continues. Max 4 iterations.
- **Content block format**: Assistant messages with tool_use are stored as `[{type:'text', text:'...'}, {type:'tool_use', id, name, input}]`. Tool results are `[{type:'tool_result', tool_use_id, content}]`.

### Agent commands
| Command | What it does | Backend endpoint |
|---|---|---|
| *(natural language)* | Multi-turn agent loop with tool use | `POST /api/agent/turn` (SSE) |
| `/review` | 3 parallel Haiku persona reviews (marketer/designer/copywriter) | `POST /api/agent/multi-review` |
| `/persona <desc>` | Simulate target user persona feedback | `POST /api/agent/persona` |
| `/variants [brief]` | Generate 3 A/B variants (conversion/trust/feature) | `POST /api/agent/variants` |
| `/diagnose` | Pure-Node SEO/a11y/heading/CTA diagnostics | `POST /api/diagnostics/run` |

### Agent ↔ Builder integration
- Agent tool calls (`generate_blocks`) → `previewAgentEdit()` in builder store (pending)
- User clicks "应用" → `commitAgentEdit()` → `pushSnapshot()` (supports Ctrl+Z undo)
- `/variants` applies directly via `applyVariant()` (also `pushSnapshot`)
- Diagnosis fix requests → sent as natural language to agent loop

### Backend provider setup
- Keys in `server/.env` (never exposed to browser)
- `ANTHROPIC_API_KEY`: Required for agent features. Used for all Claude calls.
- `STABILITY_API_KEY`: Optional. Used for AI image generation only.
- `PORT`: Backend port (default 3000)
- `CORS_ORIGINS`: Allowed origins (default `*` for dev)

## Commands

```bash
# Development (runs frontend + backend in parallel)
npm run dev

# Frontend only
npm run dev:web              # Vite dev server (port 5173, proxies /api to :3000)
npm run build                # Frontend typecheck + production build
npm run typecheck            # Frontend typecheck only
npm run smoke                # Smoke test (post-build, checks dist/index.html)

# Backend only
cd server
npm run dev                  # NestJS watch mode
npm run build                # TypeScript compile
npm run start                # Run compiled dist/main.js
npm run typecheck            # Typecheck only

# Combined
npm run build:all            # Build server + frontend
npm run typecheck:all        # Typecheck both
npm run check                # Frontend build + smoke
```

## Key Design Decisions

- **Tool results are Anthropic-structured**: `tool_use_id` content blocks in messages, not plain text strings. Claude interprets them correctly on subsequent iterations.
- **Abort signal propagated to SDK**: `AbortController.signal` passed to `messages.stream({ signal })`. Client disconnect cancels the Anthropic API call.
- **SSE trailing frame flushed**: Parser drains remaining buffer after stream ends to avoid losing final frame.
- **Generation counter in useAgentTurn**: Prevents stale `finally` blocks from applying data after rapid abort → send sequences.
- **Session compaction maintains user/assistant alternation**: Summary inserted as `role: 'assistant'` to preserve message format.
- **`!env.example` in .gitignore**: Template env file is committed; actual `.env` is excluded.
