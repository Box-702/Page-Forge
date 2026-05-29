# Landing Page Builder

Vue 3 落地页可视化搭建工具。拖拽式编辑，实时预览，导出静态 HTML。

## 技术栈

- **Vue 3** (Composition API + `<script setup>`)
- **TypeScript**
- **Pinia** (状态管理)
- **Tailwind CSS** (样式)
- **sortablejs** (拖拽排序)
- **Vite** (构建工具)

## 功能

- 8 种落地页块类型：Hero、Features、Pricing、CTA、Testimonials、FAQ、Footer、Row
- 拖拽排序（sortablejs）
- Row/Column 嵌套布局容器
- 实时编辑 + 即时预览
- 撤销/重做（Ctrl+Z / Ctrl+Y）
- localStorage 自动保存
- 导出静态 HTML 文件

## 快速开始

```bash
npm install
npm run dev
```

## 项目结构

```
src/
├── types/index.ts          # 类型定义
├── stores/builder.ts       # Pinia store
├── composables/            # useHistory, useLocalStorage, useDragDrop, useExport
├── utils/                  # defaults, htmlExport, treeHelpers
├── components/
│   ├── builder/            # 构建器 UI 组件
│   ├── blocks/             # 块渲染组件
│   └── editors/            # 编辑器组件
└── data/templates.ts       # 块模板定义
```

## 设计文档

详见 [DESIGN.md](./DESIGN.md)
