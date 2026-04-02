'use client'

import type { Project } from '@/types'
import Link from 'next/link'
import { Eye, EyeOff, Save, Globe, ArrowLeft, Check, Sparkles, Wand2 } from 'lucide-react'

interface EditorHeaderProps {
  project: Project
  saving: boolean
  saved: boolean
  previewMode: boolean
  onSave: () => void
  onSaveAsHtml?: () => void
  onPublish: () => void
  onTogglePreview: () => void
  onAiFill?: () => void
}

export default function EditorHeader({
  project,
  saving,
  saved,
  previewMode,
  onSave,
  onSaveAsHtml,
  onPublish,
  onTogglePreview,
  onAiFill,
}: EditorHeaderProps) {
  return (
    <header className="h-16 bg-white/88 backdrop-blur-xl border-b border-brand/10 flex items-center justify-between px-4 gap-3 flex-shrink-0 z-10 shadow-[0_10px_30px_rgba(15,53,60,0.05)]">
      {/* Left */}
      <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-brand/5 transition-colors text-gray-500 hover:text-brand">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-extrabold text-sm text-ink leading-none">{project.name}</h1>
            <span className={`text-xs font-semibold ${project.status === 'published' ? 'text-green-600' : 'text-brand/55'}`}>
              {project.status === 'published' ? '● Gepubliceerd' : '● Concept'}
            </span>
          </div>
        </div>

        {/* Right */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {/* Save status */}
        <span className={`text-xs font-medium transition-all ${saved ? 'text-green-500' : 'text-amber-500'}`}>
          {saving ? 'Opslaan…' : saved ? (
            <span className="flex items-center gap-1"><Check size={12} /> Opgeslagen</span>
          ) : 'Niet opgeslagen'}
        </span>

        {/* Preview toggle */}
        <button
          onClick={onTogglePreview}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            previewMode
              ? 'bg-brand text-white'
              : 'bg-brand/5 text-brand hover:bg-brand/10'
          }`}
        >
          {previewMode ? <EyeOff size={13} /> : <Eye size={13} />}
          {previewMode ? 'Editor' : 'Preview'}
        </button>



        {/* AI fill */}
        {onAiFill && (
          <button
            onClick={onAiFill}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
          >
            <Sparkles size={13} />
            AI Vulkaniseer
          </button>
        )}

        {/* Save */}
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-all"
        >
          <Save size={13} />
          Opslaan
        </button>

        {/* Publish */}
        {onSaveAsHtml && (
          <button
            onClick={onSaveAsHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
          >
            <Save size={13} />
            Sla op als HTML
          </button>
        )}

        <button
          onClick={onPublish}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-light transition-all"
        >
          <Globe size={13} />
          Publiceren
        </button>
      </div>
    </header>
  )
}
