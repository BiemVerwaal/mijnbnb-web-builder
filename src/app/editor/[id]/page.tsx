'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { SiteData, Section } from '@/types'
import type { WebProject } from '@/lib/storage'
import { getProject, updateProject } from '@/lib/storage'
import { generateHTML } from '@/lib/template-engine'
import EditorSidebar from '@/components/editor/EditorSidebar'
import EditorPreview from '@/components/editor/EditorPreview'
import EditorHeader from '@/components/editor/EditorHeader'
import SectionEditor from '@/components/editor/SectionEditor'
import { LayoutList, Eye, PenSquare } from 'lucide-react'

type MobilePanel = 'sidebar' | 'preview' | 'editor'

interface EditorPageProps {
  params: { id: string }
}

export default function EditorPage({ params }: EditorPageProps) {
  const { id } = params
  const [project, setProject] = useState<WebProject | null>(null)
  const [siteData, setSiteData] = useState<SiteData | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [activeTab, setActiveTab] = useState<'sections' | 'theme' | 'content'>('sections')
  const [previewMode, setPreviewMode] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('preview')
  const router = useRouter()

  useEffect(() => {
    const proj = getProject(id)
    if (!proj) { router.push('/'); return }
    setProject(proj)
    setSiteData(proj.site_data)
  }, [id, router])

  const updateSiteData = useCallback((updater: (prev: SiteData) => SiteData) => {
    setSiteData(prev => {
      if (!prev) return prev
      const next = updater(prev)
      setSaved(false)
      return next
    })
  }, [])

  const updateSection = useCallback((sectionId: string, newData: Partial<Section>) => {
    updateSiteData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, ...newData } : s),
    }))
  }, [updateSiteData])

  const moveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    updateSiteData(prev => {
      const sections = [...prev.sections].sort((a, b) => a.order - b.order)
      const idx = sections.findIndex(s => s.id === sectionId)
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= sections.length) return prev
      ;[sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]]
      return { ...prev, sections: sections.map((s, i) => ({ ...s, order: i })) }
    })
  }, [updateSiteData])

  const toggleSection = useCallback((sectionId: string) => {
    updateSiteData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, visible: !s.visible } : s),
    }))
  }, [updateSiteData])

  const handlePreviewSettingsChange = useCallback((patch: {
    defaultLanguage?: SiteData['defaultLanguage']
    settings?: Partial<SiteData['settings']>
  }) => {
    updateSiteData(prev => ({
      ...prev,
      ...(patch.defaultLanguage ? { defaultLanguage: patch.defaultLanguage } : {}),
      ...(patch.settings ? { settings: { ...prev.settings, ...patch.settings } } : {}),
    }))
  }, [updateSiteData])

  function handleSave() {
    if (!project || !siteData) return
    setSaving(true)
    updateProject(project.id, { site_data: siteData })
    setSaving(false)
    setSaved(true)
  }

  function handlePublish() {
    if (!project || !siteData) return
    handleSave()
    // Genereer en download HTML
    handleSaveAsHtml()
    updateProject(project.id, { status: 'published' })
    setProject(prev => prev ? { ...prev, status: 'published' } : prev)
  }

  function handleSaveAsHtml() {
    if (!project || !siteData) return
    const html = generateHTML({
      name: project.name,
      slug: project.slug,
      site_data: siteData,
    })
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name || 'export'}.html`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (!project || !siteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-ink-soft text-sm font-medium">Editor laden…</p>
        </div>
      </div>
    )
  }

  const selectedSectionObj = selectedSection
    ? siteData.sections.find(s => s.id === selectedSection) ?? null
    : null

  // When selecting a section, switch to editor panel on mobile
  const handleSelectSection = useCallback((sectionId: string | null) => {
    setSelectedSection(sectionId)
    if (sectionId && window.innerWidth < 768) {
      setMobilePanel('editor')
    }
  }, [])

  // Map WebProject to the Project interface EditorHeader expects
  const headerProject = {
    ...project,
    user_id: '',
    published_url: undefined,
    thumbnail_url: undefined,
  }

  return (
    <div className="flex flex-col h-screen bg-[radial-gradient(circle_at_92%_-10%,rgba(230,125,77,0.12),transparent_30%),radial-gradient(circle_at_0%_10%,rgba(20,90,99,0.12),transparent_26%),#f8f4ec] overflow-hidden">
      <EditorHeader
        project={headerProject}
        saving={saving}
        saved={saved}
        previewMode={previewMode}
        onSave={handleSave}
        onPublish={handlePublish}
        onTogglePreview={() => setPreviewMode(p => !p)}
        onSaveAsHtml={handleSaveAsHtml}
      />

      {/* Mobile Tab Bar */}
      {!previewMode && (
        <div className="flex md:hidden border-b border-brand/10 bg-white/90 backdrop-blur-xl">
          {([
            { key: 'sidebar' as MobilePanel, icon: LayoutList, label: 'Secties' },
            { key: 'preview' as MobilePanel, icon: Eye, label: 'Preview' },
            { key: 'editor' as MobilePanel, icon: PenSquare, label: 'Bewerken' },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setMobilePanel(key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors ${
                mobilePanel === key
                  ? 'text-brand border-b-2 border-brand bg-brand/5'
                  : 'text-ink-soft'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Desktop: always visible, Mobile: panel toggle */}
        {!previewMode && (
          <aside className={`${
            mobilePanel === 'sidebar' ? 'flex' : 'hidden'
          } md:flex w-full md:w-72 bg-white/88 backdrop-blur-xl border-r border-brand/10 flex-col overflow-hidden flex-shrink-0 shadow-[12px_0_40px_rgba(15,53,60,0.04)]`}>
            {/* Tabs */}
            <div className="flex border-b border-brand/10 flex-shrink-0 px-2 pt-2">
              {(['sections', 'theme', 'content'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-xs font-bold transition-colors rounded-t-2xl ${
                    activeTab === tab
                      ? 'text-brand bg-brand/5 border-b-2 border-brand'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {tab === 'sections' ? 'Secties' : tab === 'theme' ? 'Thema' : 'Teksten'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              <EditorSidebar
                activeTab={activeTab}
                siteData={siteData}
                selectedSection={selectedSection}
                onSelectSection={handleSelectSection}
                onToggleSection={toggleSection}
                onMoveSection={moveSection}
                onUpdateSiteData={updateSiteData}
              />
            </div>
          </aside>
        )}

        {/* Center: Preview - Desktop: always visible, Mobile: panel toggle */}
        <main className={`${
          previewMode ? 'flex' : mobilePanel === 'preview' ? 'flex' : 'hidden md:flex'
        } flex-1 overflow-y-auto p-4 md:p-6 items-start justify-center`}>
          <div className="w-full max-w-sm">
            <p className="text-xs text-center font-semibold text-brand/60 mb-3 tracking-wide hidden md:block">Live preview — klik op een sectie om te bewerken</p>
            <EditorPreview
              siteData={siteData}
              selectedSection={selectedSection}
              onSelectSection={handleSelectSection}
              onSettingsChange={handlePreviewSettingsChange}
            />
          </div>
        </main>

        {/* Right Panel: Section Editor - Desktop: always visible, Mobile: panel toggle */}
        {!previewMode && selectedSectionObj && (
          <aside className={`${
            mobilePanel === 'editor' ? 'flex' : 'hidden md:flex'
          } w-full md:w-80 bg-white/88 backdrop-blur-xl border-l border-brand/10 overflow-y-auto flex-shrink-0 shadow-[-12px_0_40px_rgba(15,53,60,0.04)] flex-col`}>
            <SectionEditor
              section={selectedSectionObj}
              siteData={siteData}
              onUpdate={(data) => updateSection(selectedSectionObj.id, { data })}
              onClose={() => { setSelectedSection(null); setMobilePanel('preview') }}
            />
          </aside>
        )}

        {/* Empty right panel hint - only on desktop */}
        {!previewMode && !selectedSectionObj && (
          <>
            {/* Desktop empty hint */}
            <aside className="hidden md:flex w-80 bg-white/88 backdrop-blur-xl border-l border-brand/10 flex-shrink-0 items-center justify-center p-6 shadow-[-12px_0_40px_rgba(15,53,60,0.04)]">
              <div className="text-center text-ink-soft">
                <div className="text-4xl mb-3">👈</div>
                <p className="text-sm font-semibold">Selecteer een sectie</p>
                <p className="text-xs mt-1 text-ink-soft/60">Klik op een sectie in de lijst of in de preview om te bewerken</p>
              </div>
            </aside>
            {/* Mobile empty editor panel */}
            {mobilePanel === 'editor' && (
              <div className="flex md:hidden flex-1 items-center justify-center p-6">
                <div className="text-center text-ink-soft">
                  <div className="text-4xl mb-3">👆</div>
                  <p className="text-sm font-semibold">Selecteer eerst een sectie</p>
                  <p className="text-xs mt-1 text-ink-soft/60">Ga naar Secties of Preview en selecteer een sectie om te bewerken</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
