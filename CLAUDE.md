# Page Forge

A Vue 3 visual landing page builder with drag sorting, nested rows, local persistence, undo/redo, and static HTML export.

## Tech Stack

- **Framework**: Vue 3 + TypeScript
- **State**: Pinia
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Drag & Drop**: SortableJS

## Project Structure

```
src/
├── types/index.ts          # Core types: PageComponent, PageSettings, ProjectData
├── stores/builder.ts       # Main Pinia store — components, pageSettings, history, UI state
├── composables/
│   ├── useBuilder.ts       # High-level component add/remove/duplicate/update
│   ├── useHistory.ts       # Undo/redo keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
│   ├── useLocalStorage.ts  # Debounced persistence to localStorage
│   ├── useDragDrop.ts      # SortableJS integration
│   ├── useEditor.ts        # Block editor logic
│   ├── useExport.ts        # Static HTML export
│   ├── useInlineContent.ts # Inline text editing
│   └── useProjects.ts      # Multi-project management
├── components/
│   ├── builder/            # Main UI shell
│   │   ├── BuilderLayout.vue     # Root layout (canvas + sidebars)
│   │   ├── BuilderCanvas.vue     # Central canvas for blocks
│   │   ├── Toolbar.vue           # Top toolbar (preview, undo/redo, export)
│   │   ├── RightSidebar.vue      # Right sidebar (content/style/page tabs)
│   │   └── ...
│   ├── blocks/             # Block renderers (read-only preview)
│   │   ├── HeroBlock.vue, CTABlock.vue, FeaturesBlock.vue, ...
│   │   └── RowBlock.vue          # Row/column layout container
│   └── editors/            # Block content editors (right sidebar forms)
│       ├── HeroEditor.vue, CTAEditor.vue, ...
├── utils/
│   ├── treeHelpers.ts      # Recursive find/update/remove/clone for component tree
│   ├── rowColumns.ts       # Row column normalization and helpers
│   ├── defaults.ts         # Default content factories per block type
│   └── htmlExport.ts       # Static HTML generation
└── data/templates.ts       # Predefined page templates
```

## Key Concepts

### Component Tree

Pages are a recursive tree of `PageComponent` nodes. Each component has:
- `id`: unique string
- `type`: BlockType ('hero' | 'features' | 'pricing' | 'cta' | 'testimonials' | 'faq' | 'footer' | 'row')
- `content`: block-specific data (title, subtitle, items, etc.)
- `styles`: visual overrides (bgColor, padding, borderRadius, etc.)
- `children?`: nested components (used by `row` type for columns)

The `row` type stores columns in `content.columns` as `RowColumn[]`, each with its own `children` array.

### State Management

`useBuilderStore` (Pinia) is the single source of truth:
- `components`: the page tree
- `pageSettings`: global page config (colors, fonts, title)
- `selectedId` / `hoveredId`: current selection
- `history` / `historyIndex`: undo/redo snapshots (max 20)

### Persistence

Data persists to `localStorage` via `useLocalStorage`. Saving is debounced. Multi-project support via `useProjects`.

### History (Undo/Redo)

Snapshots are taken on every mutation via `pushSnapshot()`. `Ctrl+Z` undoes, `Ctrl+Shift+Z` redoes.

## Commands

- `npm run dev` — start dev server
- `npm run build` — typecheck + production build
- `npm run typecheck` — typecheck only
- `npm run smoke` — run smoke tests (after build)
- `npm run check` — build + smoke
