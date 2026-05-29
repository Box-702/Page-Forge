import type { PageComponent, PageSettings, SavedProject } from '@/types'

const PROJECTS_KEY = 'page-forge-projects'

export function useProjects() {
  function listProjects(): SavedProject[] {
    try {
      return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]') as SavedProject[]
    } catch {
      return []
    }
  }

  function saveProject(name: string, components: PageComponent[], pageSettings: PageSettings): SavedProject {
    const projects = listProjects()
    const now = new Date().toISOString()
    const project: SavedProject = {
      id: crypto.randomUUID(),
      name: name.trim() || pageSettings.title || 'Untitled project',
      updatedAt: now,
      version: 1,
      components: JSON.parse(JSON.stringify(components)),
      pageSettings: JSON.parse(JSON.stringify(pageSettings)),
    }
    localStorage.setItem(PROJECTS_KEY, JSON.stringify([project, ...projects]))
    return project
  }

  function deleteProject(id: string) {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(listProjects().filter((project) => project.id !== id)))
  }

  return { listProjects, saveProject, deleteProject }
}
