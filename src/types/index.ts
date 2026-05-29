export type BlockType = 'hero' | 'features' | 'pricing' | 'cta' | 'testimonials' | 'faq' | 'footer' | 'row'

export interface ComponentStyles {
  bgColor?: string
  textColor?: string
  titleFontSize?: string
  bodyFontSize?: string
  bgImage?: string
  borderRadius?: string
  paddingTop?: string
  paddingBottom?: string
  paddingLeft?: string
  paddingRight?: string
  shadow?: string
  textAlign?: string
  maxWidth?: string
}

export interface PageComponent {
  id: string
  type: BlockType
  content: Record<string, any>
  styles: ComponentStyles
  children?: PageComponent[]
}

export interface RowColumn {
  id: string
  width: string
  children: PageComponent[]
}

export interface PageSettings {
  primaryColor: string
  accentColor?: string
  surfaceColor?: string
  textColor?: string
  fontFamily: string
  backgroundColor: string
  title?: string
  description?: string
  ogImage?: string
  faviconUrl?: string
}

export interface ProjectData {
  version: 1
  components: PageComponent[]
  pageSettings: PageSettings
}

export interface SavedProject extends ProjectData {
  id: string
  name: string
  updatedAt: string
}

export interface HistoryEntry {
  components: PageComponent[]
  pageSettings: PageSettings
}
