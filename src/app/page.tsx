'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Eye, Globe, Wand2 } from 'lucide-react'
import type { WebProject } from '@/lib/storage'
import { loadProjects, createProject, deleteProject } from '@/lib/storage'

export default function HomePage() {
  const [projects, setProjects] = useState<WebProject[]>([])
  const [newName, setNewName] = useState('')
  const [showNew, setShowNew] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setProjects(loadProjects())
  }, [])

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    const project = createProject(name)
    setProjects(loadProjects())
    setNewName('')
    setShowNew(false)
    router.push(`/display/${project.id}`)
  }

  function handleDelete(id: string) {
    if (!confirm('Weet je zeker dat je dit project wilt verwijderen?')) return
    deleteProject(id)
    setProjects(loadProjects())
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/88 backdrop-blur-xl border-b border-brand/10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-brand flex items-center justify-center flex-shrink-0">
              <Globe size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-ink">Mijn-BnB Web Builder</h1>
              <p className="text-[11px] sm:text-xs text-ink-soft font-medium">Bouw je gast-app direct in de browser</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => router.push('/wizard')}
              className="btn-secondary flex-1 sm:flex-none text-xs sm:text-sm"
            >
              <Wand2 size={14} /> Wizard
            </button>
            <button
              onClick={() => setShowNew(true)}
              className="btn-primary flex-1 sm:flex-none text-xs sm:text-sm"
            >
              <Plus size={14} /> Nieuw project
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* New Project Dialog */}
        {showNew && (
          <div className="card mb-6">
            <h2 className="font-bold text-sm text-ink mb-3">Nieuw project aanmaken</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="input flex-1"
                placeholder="Naam van je BnB..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleCreate} className="btn-primary flex-1 sm:flex-none" disabled={!newName.trim()}>
                  Aanmaken
                </button>
                <button onClick={() => { setShowNew(false); setNewName('') }} className="btn-ghost">
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project List */}
        {projects.length === 0 && !showNew ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="text-5xl sm:text-6xl mb-4">🏠</div>
            <h2 className="text-lg sm:text-xl font-bold text-ink mb-2">Nog geen projecten</h2>
            <p className="text-ink-soft mb-6 text-sm">Maak je eerste BnB gast-app aan om te beginnen.</p>
            <button onClick={() => setShowNew(true)} className="btn-primary">
              <Plus size={16} /> Eerste project aanmaken
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <div key={project.id} className="card group hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-ink">{project.name}</h3>
                    <span className={`text-xs font-semibold ${project.status === 'published' ? 'text-green-600' : 'text-brand/55'}`}>
                      {project.status === 'published' ? '● Gepubliceerd' : '● Concept'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-ink-soft mb-4">
                  Laatst bewerkt: {new Date(project.updated_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/display/${project.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-light transition-all"
                  >
                    <Eye size={12} /> Bekijken
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Verwijderen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
