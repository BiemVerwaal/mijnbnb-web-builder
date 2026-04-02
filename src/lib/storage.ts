import type { SiteData } from '@/types'
import { createEmptySiteData } from '@/lib/template-engine'

const STORAGE_KEY = 'mijnbnb-web-builder'

export interface WebProject {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published'
  site_data: SiteData
  created_at: string
  updated_at: string
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 15)
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'mijn-bnb'
}

export function loadProjects(): WebProject[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveProjects(projects: WebProject[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function getProject(id: string): WebProject | null {
  return loadProjects().find(p => p.id === id) ?? null
}

export function createProject(name: string): WebProject {
  const projects = loadProjects()
  const project: WebProject = {
    id: generateId(),
    name,
    slug: slugify(name),
    status: 'draft',
    site_data: createEmptySiteData(name),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  projects.push(project)
  saveProjects(projects)
  return project
}

export function updateProject(id: string, patch: Partial<WebProject>): WebProject | null {
  const projects = loadProjects()
  const idx = projects.findIndex(p => p.id === id)
  if (idx === -1) return null
  projects[idx] = { ...projects[idx], ...patch, updated_at: new Date().toISOString() }
  saveProjects(projects)
  return projects[idx]
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter(p => p.id !== id)
  saveProjects(projects)
}
