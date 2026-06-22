import type { PageComponent, PageSettings, ProjectData } from '@/types'
import { buildHTML } from '@/utils/htmlExport'

export function useExport() {
  function generateHTML(components: PageComponent[], pageSettings: PageSettings): string {
    return buildHTML(components, pageSettings)
  }

  function downloadHTML(components: PageComponent[], pageSettings: PageSettings) {
    const html = generateHTML(components, pageSettings)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'landing-page.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function downloadProject(components: PageComponent[], pageSettings: PageSettings) {
    const data: ProjectData = { version: 1, components, pageSettings }
    downloadJSON(data, 'page-forge-project.json')
  }

  async function readProjectFile(file: File): Promise<ProjectData> {
    const text = await file.text()
    const data = JSON.parse(text) as ProjectData
    if (!Array.isArray(data.components) || !data.pageSettings) {
      throw new Error('Invalid Page Forge project file.')
    }
    return { version: 1, components: data.components, pageSettings: data.pageSettings }
  }

  function downloadJSON(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return { generateHTML, downloadHTML, downloadProject, readProjectFile }
}
