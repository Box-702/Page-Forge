# Landing Page Builder - 设计文档

## 项目定位

一个 Vue 3 落地页搭建工具，拖拽式编辑，实时预览，导出静态 HTML。专注 SaaS 产品落地页场景，8 种块类型，支持嵌套容器布局。

**简历展示点：** Vue3 组合式 API + Pinia 状态管理 + sortablejs 真拖拽 + JSON 数据模型 + 嵌套组件渲染引擎 + 撤销重做 + localStorage 持久化 + HTML 导出。

## 与原项目的核心差异

| 原项目 (vue-website-page-builder) | 本项目 |
|----------|-------------|
| HTML 字符串存在 store 里 (`v-html`) | JSON 数据存在 store 里 (专用渲染组件) |
| 编辑 = 操作 DOM classList | 编辑 = v-model 更新 store |
| 3380 行 service 类 | 5 个小 composable |
| npm 包 (独立 Pinia 实例 + 插件系统) | 独立应用 (标准 Pinia) |
| 按钮上下移动排序 | sortablejs 拖拽排序 |
| 纯扁平 section | Row/Column 嵌套容器 |
| 12 种语言、50+ 内容类型 | 仅中文、8 种块类型 |
| 集成 TipTap 富文本 | 简单 input/textarea |
| 通用页面构建器 | 专注 SaaS 落地页 |

## 核心架构决策

### 1. JSON 数据模型

原项目 store 存的是 `{ id, html_code, title }`——一根 HTML 字符串。我们存的是结构化 JSON：

```typescript
interface PageComponent {
  id: string
  type: 'hero' | 'features' | 'pricing' | 'cta' | 'testimonials' | 'faq' | 'footer' | 'row'
  content: Record<string, any>   // 每种块类型有各自的字段
  styles: ComponentStyles         // 通用样式属性
  children?: PageComponent[]      // 仅 Row 容器使用
}
```

**优势：**
- 编辑时 v-model 绑定到 store 属性，不需要 DOM 解析
- 撤销重做用 `structuredClone()` 快照 JSON，不需要抓取 DOM
- 导出 HTML 从 JSON 构建，不依赖运行时 DOM
- 类型安全，IDE 有完整提示

### 2. 专用渲染组件

每种块类型有独立的 Vue 渲染组件 (`HeroBlock.vue` 等)，接收数据作为 props。不用 `v-html`。

**优势：**
- 完整的 Vue 响应式，改数据即时重渲染
- 可以加动画、交互逻辑
- 渲染组件和编辑面板读取同一个 store 数据，天然同步

### 3. 拖拽排序

用 sortablejs 实现真正的拖拽。v1 仅顶层画布可拖拽，Row 内部用上下按钮调整顺序。

### 4. 无 Service 类

原项目的 `PageBuilderService` 类 3380 行。我们把逻辑拆成 5 个 composable，每个 50-150 行：
- `useHistory` — 撤销重做
- `useLocalStorage` — 自动保存/加载
- `useDragDrop` — sortablejs 集成
- `useExport` — HTML 导出
- `useBuilder` — 便捷方法封装

## 类型定义

```typescript
// 块类型
type BlockType = 'hero' | 'features' | 'pricing' | 'cta' | 'testimonials' | 'faq' | 'footer' | 'row'

// 核心数据模型
interface PageComponent {
  id: string                    // crypto.randomUUID()
  type: BlockType
  content: Record<string, any>  // 每种类型的字段见下方
  styles: ComponentStyles
  children?: PageComponent[]    // 仅 Row 使用
}

interface ComponentStyles {
  backgroundColor?: string      // Tailwind 类，如 'bg-white'
  paddingTop?: string           // 如 'pt-16'
  paddingBottom?: string        // 如 'pb-16'
  textColor?: string            // 如 'text-white'
  maxWidth?: string             // 如 'max-w-6xl'
  borderRadius?: string         // 如 'rounded-lg'
  shadow?: string               // 如 'shadow-md'
  paddingLeft?: string          // 如 'pl-8'、'pl-[32px]'
  paddingRight?: string         // 如 'pr-8'、'pr-[32px]'
  textAlign?: string            // 如 'text-center'、'text-left'
  fontSize?: string             // 如 'text-[48px]'、'text-[16px]'
}

// 页面全局设置
interface PageSettings {
  primaryColor: string          // 主题色 hex
  fontFamily: string            // 字体
  backgroundColor: string
}

// 历史快照
interface HistoryEntry {
  components: PageComponent[]
  pageSettings: PageSettings
}
```

### 各块类型的 content 字段

**Hero:**
```typescript
{
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  alignment: 'left' | 'center'
  backgroundType: 'color' | 'gradient'
  imageUrl: string              // 右侧/左侧配图（可选）
}
```

**Features:**
```typescript
{
  title: string
  subtitle: string
  features: { id: string, icon: string, title: string, description: string }[]
  columns: 2 | 3 | 4
}
```

**Pricing:**
```typescript
{
  title: string
  subtitle: string
  currency: string
  plans: {
    id: string
    name: string
    price: string
    period: string
    description: string
    features: string[]
    highlighted: boolean
    ctaText: string
  }[]
}
```

**CTA:**
```typescript
{
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
}
```

**Testimonials:**
```typescript
{
  title: string
  subtitle: string
  testimonials: { id: string, quote: string, name: string, title: string, avatarUrl: string }[]
  columns: 2 | 3
}
```

**FAQ:**
```typescript
{
  title: string
  subtitle: string
  faqs: { id: string, question: string, answer: string }[]
}
```

**Footer:**
```typescript
{
  companyName: string
  description: string
  copyright: string
  links: { title: string, url: string }[]
}
```

**Row:**
```typescript
{
  columnCount: 1 | 2 | 3 | 4
  columnWidths: string[]    // 如 ['1/2', '1/2']，比例
  gap: string               // 如 '8'
  verticalAlign: 'top' | 'center' | 'stretch'
}
```

## Pinia Store 设计

```typescript
// src/stores/builder.ts
interface BuilderState {
  // 核心数据
  components: PageComponent[]
  pageSettings: PageSettings
  selectedId: string | null
  hoveredId: string | null

  // 历史
  history: HistoryEntry[]
  historyIndex: number
  MAX_HISTORY: 20

  // UI
  isPreview: boolean
  showAddModal: boolean
  sidebarTab: 'content' | 'style'
}
```

**Getters:** `selectedComponent`, `canUndo`, `canRedo`
**Actions:** `selectComponent`, `addComponent`, `updateComponent`, `removeComponent`, `duplicateComponent`, `reorderComponents`, `undo`, `redo`, `saveHistory`, `loadFromStorage`, `saveToStorage`

## 组件树

```
App.vue
└── BuilderLayout.vue                     [三栏布局外壳]
    ├── Toolbar.vue                       [撤销/重做/预览/导出/添加块]
    ├── BuilderCanvas.vue                 [sortablejs 容器]
    │   └── ComponentWrapper.vue          [v-for，选中边框，拖拽手柄，操作按钮]
    │       └── ComponentRenderer.vue     [switch type → 渲染对应块组件]
    │           ├── HeroBlock.vue
    │           ├── FeaturesBlock.vue
    │           ├── PricingBlock.vue
    │           ├── CTABlock.vue
    │           ├── TestimonialsBlock.vue
    │           ├── FaqBlock.vue
    │           ├── FooterBlock.vue
    │           └── RowBlock.vue          [递归：渲染 N 列，每列递归渲染子组件]
    ├── RightSidebar.vue                  [选中组件时显示]
    │   ├── StyleEditor.vue              [背景色/内边距，所有组件通用]
    │   └── ContentEditor.vue            [根据 type 分发到对应编辑器]
    │       ├── HeroEditor.vue
    │       ├── FeaturesEditor.vue
    │       ├── PricingEditor.vue
    │       ├── CTAEditor.vue
    │       ├── TestimonialsEditor.vue
    │       ├── FaqEditor.vue
    │       ├── FooterEditor.vue
    │       └── RowEditor.vue
    └── AddBlockModal.vue                 [块类型网格]
```

## 文件结构

```
landing-page-builder/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── DESIGN.md                          # 本文件
└── src/
    ├── main.ts
    ├── App.vue
    ├── style.css
    ├── types/
    │   └── index.ts
    ├── stores/
    │   └── builder.ts
    ├── composables/
    │   ├── useHistory.ts
    │   ├── useLocalStorage.ts
    │   ├── useDragDrop.ts
    │   ├── useExport.ts
    │   ├── useBuilder.ts
    │   └── useEditor.ts
    ├── utils/
    │   ├── defaults.ts
    │   ├── htmlExport.ts
    │   └── treeHelpers.ts
    ├── components/
    │   ├── builder/
    │   │   ├── BuilderLayout.vue
    │   │   ├── BuilderCanvas.vue
    │   │   ├── ComponentWrapper.vue
    │   │   ├── ComponentRenderer.vue
    │   │   ├── Toolbar.vue
    │   │   ├── RightSidebar.vue
    │   │   ├── StyleEditor.vue
    │   │   ├── ContentEditor.vue
    │   │   └── AddBlockModal.vue
    │   ├── blocks/
    │   │   ├── HeroBlock.vue
    │   │   ├── FeaturesBlock.vue
    │   │   ├── PricingBlock.vue
    │   │   ├── CTABlock.vue
    │   │   ├── TestimonialsBlock.vue
    │   │   ├── FaqBlock.vue
    │   │   ├── FooterBlock.vue
    │   │   └── RowBlock.vue
    │   └── editors/
    │       ├── HeroEditor.vue
    │       ├── FeaturesEditor.vue
    │       ├── PricingEditor.vue
    │       ├── CTAEditor.vue
    │       ├── TestimonialsEditor.vue
    │       ├── FaqEditor.vue
    │       ├── FooterEditor.vue
    │       └── RowEditor.vue
    └── data/
        └── templates.ts
```

约 40 个文件。原项目约 80+。

## 数据流

```
用户操作                        Store                        持久化
=======                        =====                        =====

[添加块]
  点击块类型
    → createHeroDefaults()
    → store.addComponent()  ────→ 组件数组更新
    → 画布重渲染               ────→ localStorage 自动保存

[拖拽排序]
  拖拽手柄
    → sortablejs onEnd
    → store.reorderComponents() ──→ 组件数组重排
    → 画布列表重渲染            ────→ localStorage 自动保存

[选中组件]
  点击 ComponentWrapper
    → store.selectComponent(id) ──→ selectedId 更新
    → 蓝色选中边框出现
    → RightSidebar 显示对应编辑器

[编辑属性]
  在编辑器输入
    → v-model 更新 store 中的 content
    → 渲染组件实时更新（同一个响应式对象）
    → 自动保存

[撤销]
  Ctrl+Z
    → store.undo()
    → restoreSnapshot(history[index])
    → 整个画布重建
```

## 实现阶段 (8 步)

### Phase 1: 项目脚手架
- Vite + Vue 3 + TypeScript 初始化
- 安装依赖：pinia, sortablejs, @types/sortablejs, tailwindcss, postcss, autoprefixer
- 配置 tailwind, postcss, tsconfig
- 创建目录结构

### Phase 2: 类型 + Store
- 全部类型定义
- Pinia store（完整 state/getters/actions）
- treeHelpers（树的增删查）
- defaults（各块类型的默认数据工厂函数）

### Phase 3: 构建器外壳
- BuilderLayout（三栏布局）
- Toolbar（按钮占位）
- AddBlockModal（块类型网格）
- BuilderCanvas（空画布 + 占位提示）
- ComponentWrapper（选中框 + 删除/复制按钮）
- ComponentRenderer（switch type，先只渲染类型名）

### Phase 4: 首批 3 种块 + 编辑器
- HeroBlock + HeroEditor
- CTABlock + CTAEditor
- FeaturesBlock + FeaturesEditor
- RightSidebar + StyleEditor + ContentEditor

### Phase 5: 剩余 5 种块 + 编辑器
- PricingBlock + PricingEditor
- TestimonialsBlock + TestimonialsEditor
- FaqBlock + FaqEditor
- FooterBlock + FooterEditor

### Phase 6: Row/Column 嵌套容器
- RowBlock（渲染列 + 递归渲染子组件）
- RowEditor（列数/宽度/间距/对齐）

### Phase 7: 拖拽排序
- useDragDrop composable（sortablejs 集成）
- ComponentWrapper 拖拽手柄
- 顶层画布拖拽排序

### Phase 8: 持久化 + 历史 + 导出
- useLocalStorage（debounce 自动保存）
- useHistory（撤销/重做 + Ctrl+Z/Ctrl+Y）
- useExport + htmlExport.ts（下载 HTML 文件）
- 预览模式

## 验证清单

1. `npm run dev` — 应用正常加载，显示空画布 + 工具栏
2. 点击"添加块" → 弹窗展示 8 种块类型
3. 添加 Hero → 画布显示默认内容的 Hero
4. 点击 Hero → 蓝色选中边框 + 右侧面板显示 HeroEditor
5. 编辑标题 → HeroBlock 实时更新
6. 拖拽 Hero 到新位置
7. 添加 Features 块，编辑 features 列表
8. 添加 Row（2列），在列内添加其他块
9. Ctrl+Z 撤销，Ctrl+Y 重做
10. 刷新页面 → 从 localStorage 恢复
11. 点击导出 → 下载 HTML 文件，浏览器打开正常
12. `npm run build` → 构建成功
