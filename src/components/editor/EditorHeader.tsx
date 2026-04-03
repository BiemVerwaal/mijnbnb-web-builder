'use client'

import { useState } from 'react'
import type { Project } from '@/types'
import Link from 'next/link'
import { Eye, EyeOff, Save, Globe, ArrowLeft, Check, Sparkles, Wand2, Menu, X } from 'lucide-react'

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
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white/88 backdrop-blur-xl border-b border-brand/10 flex-shrink-0 z-10 shadow-[0_10px_30px_rgba(15,53,60,0.05)]">
      <div className="h-14 md:h-16 flex items-center justify-between px-3 md:px-4 gap-2 md:gap-3">
        {/* Left */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Link href="/" className="p-1.5 md:p-2 rounded-xl hover:bg-brand/5 transition-colors text-gray-500 hover:text-brand flex-shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="font-extrabold text-xs md:text-sm text-ink leading-none truncate">{project.name}</h1>
            <span className={`text-[10px] md:text-xs font-semibold ${project.status === 'published' ? 'text-green-600' : 'text-brand/55'}`}>
              {project.status === 'published' ? '● Gepubliceerd' : '● Concept'}
            </span>
          </div>
        </div>

        {/* Right - Desktop */}
        <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
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

          <Link
            href={`/wizard?projectId=${project.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand/5 text-brand hover:bg-brand/10 transition-all"
          >
            <Wand2 size={13} />
            Wizard
          </Link>

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

          {/* Save as HTML */}
          {onSaveAsHtml && (
            <button
              onClick={onSaveAsHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
            >
              <Save size={13} />
              HTML
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

        {/* Right - Mobile: save status + quick save + hamburger */}
        <div className="flex md:hidden items-center gap-1.5">
          <span className={`text-[10px] font-medium ${saved ? 'text-green-500' : 'text-amber-500'}`}>
            {saving ? '…' : saved ? <Check size={12} /> : '●'}
          </span>
          <button
            onClick={onSave}
            disabled={saving}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <Save size={16} />
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand/10 bg-white/95 backdrop-blur-xl px-3 py-2 flex flex-col gap-1">
          <button
            onClick={() => { onTogglePreview(); setMenuOpen(false) }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              previewMode ? 'bg-brand text-white' : 'bg-brand/5 text-brand'
            }`}
          >
            {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
            {previewMode ? 'Terug naar editor' : 'Volledig scherm preview'}
          </button>
          <Link
            href={`/wizard?projectId=${project.id}`}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-brand/5 text-brand"
            onClick={() => setMenuOpen(false)}
          >
            <Wand2 size={14} />
            Wizard
          </Link>
          {onAiFill && (
            <button
              onClick={() => { onAiFill(); setMenuOpen(false) }}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-purple-100 text-purple-700"
            >
              <Sparkles size={14} />
              AI Vulkaniseer
            </button>
          )}
          {onSaveAsHtml && (
            <button
              onClick={() => { onSaveAsHtml(); setMenuOpen(false) }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-100 text-blue-700"
            >
              <Save size={14} />
              Sla op als HTML
            </button>
          )}
          <button
            onClick={() => { onPublish(); setMenuOpen(false) }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-brand text-white"
          >
            <Globe size={14} />
            Publiceren
          </button>
        </div>
      )}
    </header>
  )
}
