'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { WebProject } from '@/lib/storage'
import { getProject, updateProject } from '@/lib/storage'
import { generateHTML } from '@/lib/template-engine'
import { ArrowLeft, Download, Wand2, Globe, Smartphone, Monitor, Tablet, ExternalLink } from 'lucide-react'

type DeviceMode = 'phone' | 'tablet' | 'desktop'

export default function DisplayPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [project, setProject] = useState<WebProject | null>(null)
  const [html, setHtml] = useState<string>('')
  const [device, setDevice] = useState<DeviceMode>('phone')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()

  useEffect(() => {
    const proj = getProject(id)
    if (!proj) { router.push('/'); return }
    setProject(proj)
    const generated = generateHTML({
      name: proj.name,
      slug: proj.slug,
      site_data: proj.site_data,
    })
    setHtml(generated)
  }, [id, router])

  function handleDownload() {
    if (!project || !html) return
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name || 'mijn-bnb'}.html`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    updateProject(project.id, { status: 'published' })
    setProject(prev => prev ? { ...prev, status: 'published' } : prev)
  }

  function handleOpenNewTab() {
    if (!html) return
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#f8f4ec] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#145a63] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[#17313a]/60 text-sm font-medium">Laden…</p>
        </div>
      </div>
    )
  }

  const deviceStyles: Record<DeviceMode, string> = {
    phone: 'w-[375px] h-[700px]',
    tablet: 'w-[768px] h-[700px]',
    desktop: 'w-full max-w-[1200px] h-[700px]',
  }

  const deviceFrame: Record<DeviceMode, string> = {
    phone: 'rounded-[3rem] border-[12px] border-gray-800 shadow-2xl',
    tablet: 'rounded-[2rem] border-[10px] border-gray-800 shadow-2xl',
    desktop: 'rounded-xl border-2 border-gray-300 shadow-xl',
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_92%_-10%,rgba(230,125,77,0.12),transparent_30%),radial-gradient(circle_at_0%_10%,rgba(20,90,99,0.12),transparent_26%),#f8f4ec] flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-[#145a63]/10 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="p-2 rounded-xl hover:bg-[#145a63]/5 transition-colors text-gray-500 hover:text-[#145a63] flex-shrink-0">
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm md:text-base text-[#17313a] truncate">{project.name}</h1>
              <span className={`text-[10px] md:text-xs font-semibold ${project.status === 'published' ? 'text-green-600' : 'text-[#145a63]/55'}`}>
                {project.status === 'published' ? '● Gepubliceerd' : '● Concept'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Device switcher - hidden on small screens */}
            <div className="hidden md:flex items-center bg-[#145a63]/5 rounded-xl p-1 gap-0.5">
              {([
                { key: 'phone' as DeviceMode, icon: Smartphone, label: 'Telefoon' },
                { key: 'tablet' as DeviceMode, icon: Tablet, label: 'Tablet' },
                { key: 'desktop' as DeviceMode, icon: Monitor, label: 'Desktop' },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setDevice(key)}
                  className={`p-2 rounded-lg transition-all ${
                    device === key
                      ? 'bg-white text-[#145a63] shadow-sm'
                      : 'text-[#17313a]/40 hover:text-[#17313a]/70'
                  }`}
                  title={label}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>

            <Link
              href={`/wizard?projectId=${project.id}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#145a63]/5 text-[#145a63] hover:bg-[#145a63]/10 transition-all flex-1 sm:flex-none justify-center"
            >
              <Wand2 size={14} />
              <span className="hidden sm:inline">Bewerken in</span> Wizard
            </Link>

            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all flex-1 sm:flex-none justify-center shadow-md"
            >
              <ExternalLink size={15} />
              Open preview
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#145a63] text-white hover:bg-[#1e7d85] transition-all flex-1 sm:flex-none justify-center"
            >
              <Download size={14} />
              Download HTML
            </button>
          </div>
        </div>
      </header>

      {/* Preview */}
      <div className="flex-1 flex items-start justify-center p-4 md:p-8 overflow-auto">
        <div className={`${deviceStyles[device]} ${deviceFrame[device]} overflow-hidden bg-white mx-auto transition-all duration-300`}>
          {html ? (
            <iframe
              ref={iframeRef}
              srcDoc={html}
              className="w-full h-full border-0"
              title={`Preview: ${project.name}`}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-[#17313a]/40 text-sm">Preview wordt geladen…</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile device switcher - bottom bar */}
      <div className="flex md:hidden border-t border-[#145a63]/10 bg-white/90 backdrop-blur-xl">
        {([
          { key: 'phone' as DeviceMode, icon: Smartphone, label: 'Telefoon' },
          { key: 'tablet' as DeviceMode, icon: Tablet, label: 'Tablet' },
          { key: 'desktop' as DeviceMode, icon: Monitor, label: 'Desktop' },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setDevice(key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors ${
              device === key
                ? 'text-[#145a63] border-t-2 border-[#145a63] bg-[#145a63]/5'
                : 'text-[#17313a]/40'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
