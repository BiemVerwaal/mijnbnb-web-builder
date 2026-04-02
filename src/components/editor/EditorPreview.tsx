'use client'

import { useEffect, useRef } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import type { SiteData } from '@/types'
import { generateHTML } from '@/lib/template-engine'

interface EditorPreviewProps {
  siteData: SiteData
  selectedSection: string | null
  onSelectSection: (id: string) => void
  onSettingsChange: (patch: {
    defaultLanguage?: SiteData['defaultLanguage']
    settings?: Partial<SiteData['settings']>
  }) => void
  showDeviceFrame?: boolean
}

export default function EditorPreview({ siteData, selectedSection, onSelectSection, onSettingsChange, showDeviceFrame = true }: EditorPreviewProps) {
  const viewportWidth = 393
  const viewportHeight = 852
  const safeTop = 58
  const safeBottom = 26
  const previewNavHeight = 72
  const previewScale = 0.75
  const screenWidth = Math.round(viewportWidth * previewScale)
  const screenHeight = Math.round(viewportHeight * previewScale)
  const content = siteData.content[siteData.defaultLanguage] ?? Object.values(siteData.content)[0]
  const previewSections = [
    { id: 'hero', label: content?.nav?.welcome ?? 'Welkom', icon: 'house' },
    { id: 'house-info', label: content?.nav?.house ?? 'Huis', icon: 'building' },
    { id: 'photos', label: content?.nav?.photos ?? "Foto's", icon: 'image' },
    { id: 'area', label: content?.nav?.area ?? 'Nabijheid', icon: 'map' },
    { id: 'contact', label: content?.nav?.info ?? 'Informatie', icon: 'info' },
  ].filter((item) => siteData.sections.some((section) => section.id === item.id && section.visible))

  const iframeRef = useRef<HTMLIFrameElement>(null)

  const sectionToTab: Record<string, string> = {
    hero: 'welcome',
    'house-info': 'house',
    photos: 'photos',
    area: 'area',
    contact: 'contact',
  }

  const postMessage = (message: any) => {
    const iframeWindow = iframeRef.current?.contentWindow
    if (iframeWindow) {
      iframeWindow.postMessage(message, '*')
    }
  }

  const navigateToSection = (sectionId: string) => {
    onSelectSection(sectionId)
    const tab = sectionToTab[sectionId]
    if (tab) postMessage({ type: 'switch-tab', tab })
  }

  useEffect(() => {
    if (!selectedSection) return
    const tab = sectionToTab[selectedSection]
    if (tab) {
      postMessage({ type: 'switch-tab', tab })
    }
  }, [selectedSection])

  const html = generateHTML({
    name: siteData.meta.title,
    slug: '',
    site_data: siteData,
  })

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data as {
        type?: string
        sectionId?: string
        defaultLanguage?: SiteData['defaultLanguage']
        settings?: Partial<SiteData['settings']>
      } | null

      if (data?.type === 'preview-select-section' && data.sectionId) {
        onSelectSection(data.sectionId)
        return
      }

      if (data?.type === 'preview-settings-change') {
        onSettingsChange({
          ...(data.defaultLanguage ? { defaultLanguage: data.defaultLanguage } : {}),
          ...(data.settings ? { settings: data.settings } : {}),
        })
        return
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onSelectSection, onSettingsChange])


  if (!showDeviceFrame) {
    return (
      <div className="w-full max-w-[390px] mx-auto">
        <iframe
          ref={iframeRef}
          srcDoc={html}
          className="w-full border-0"
          style={{ height: `${screenHeight}px`, minHeight: '700px' }}
          title="Preview"
        />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Phone frame */}
      <div className="mx-auto w-fit">
        <div className="relative rounded-[64px] bg-[linear-gradient(160deg,#84786b_0%,#b3a79a_18%,#5f564f_46%,#2f3438_72%,#111417_100%)] p-[10px] shadow-[0_40px_120px_rgba(15,53,60,0.32)] ring-1 ring-white/25 before:pointer-events-none before:absolute before:inset-[2px] before:rounded-[60px] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0.02)_20%,rgba(0,0,0,0.16)_75%,rgba(255,255,255,0.05))] before:content-['']">
          <span className="absolute -left-[3px] top-24 h-12 w-[4px] rounded-full bg-black/35 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" />
          <span className="absolute -left-[3px] top-40 h-20 w-[4px] rounded-full bg-black/35 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" />
          <span className="absolute -left-[3px] top-64 h-20 w-[4px] rounded-full bg-black/35 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" />
          <span className="absolute -right-[3px] top-36 h-28 w-[4px] rounded-full bg-[#6d6156] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" />
          <span className="absolute -left-[5px] top-56 h-24 w-[6px] rounded-full bg-[#4c4035] shadow-[0_0_0_1px_rgba(255,255,255,0.1)]" />

          <div className="relative rounded-[54px] bg-[#060708] p-[6px] ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div
              className="relative overflow-hidden rounded-[48px] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              style={{ width: `${screenWidth}px`, height: `${screenHeight}px` }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.995),rgba(255,255,255,0.97)_48%,rgba(255,255,255,0.94))]"
                style={{ height: `${Math.round(safeTop * previewScale)}px` }}
              />

              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-[10px]">
                <div className="relative flex h-8 w-[126px] items-center justify-end rounded-full bg-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_8px_18px_rgba(0,0,0,0.35)]">
                  <span className="absolute left-5 h-3 w-3 rounded-full bg-[#15171a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]" />
                  <span className="absolute left-[23px] top-[9px] h-1 w-1 rounded-full bg-sky-300/45" />
                  <span className="mr-4 h-4 w-4 rounded-full border border-white/10 bg-[#111214] shadow-[inset_0_1px_2px_rgba(255,255,255,0.12)]" />
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-6 pt-3 text-[10px] font-semibold text-black/55">
                <span>9:41</span>
                <span className="tracking-[0.18em]">5G</span>
              </div>

              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10"
                style={{ height: `${Math.round(safeTop * previewScale)}px` }}
              >
                <div className="absolute inset-x-6 bottom-3 h-px bg-black/6" />
              </div>

                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.99))]"
                  style={{ height: `${Math.round((safeBottom + previewNavHeight) * previewScale) + 8}px` }}
                />

              {previewSections.length ? (
                <div className="absolute inset-x-0 bottom-0 z-20 border-t border-[#d8d1c6] bg-[#f3eee5] px-2 pb-4 pt-2">
                  <div className="grid grid-cols-5 gap-1">
                  {previewSections.map((section) => {
                    const active = selectedSection === section.id
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => navigateToSection(section.id)}
                        className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all ${
                          active
                            ? 'text-[#1f6974]'
                            : 'text-[#8d8a85] hover:text-[#1f6974]'
                        }`}
                      >
                        <AppIcon name={section.icon} size={16} strokeWidth={2.4} />
                        <span className="truncate text-[10px] font-extrabold leading-none">{section.label}</span>
                      </button>
                    )
                  })}
                  </div>
                </div>
              ) : null}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-2">
                <div className="h-1.5 w-28 rounded-full bg-black/20 shadow-[0_1px_0_rgba(255,255,255,0.45)]" />
              </div>

              <div
                className="absolute inset-x-0 z-[1] overflow-hidden"
                style={{
                  top: `${Math.round(safeTop * previewScale)}px`,
                  bottom: `${Math.round((safeBottom + previewNavHeight) * previewScale)}px`,
                  clipPath: 'inset(0 round 0 0 34px 34px)',
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-3 bg-[linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,255,255,0))]" />
                <iframe
                  ref={iframeRef}
                  srcDoc={html}
                  className="block border-0 origin-top-left bg-white"
                  style={{
                    width: `${viewportWidth}px`,
                    height: `${viewportHeight}px`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                  }}
                  title="Preview"
                />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-10 top-2 h-px bg-white/10" />
            <div className="pointer-events-none absolute inset-x-16 top-3 h-[2px] rounded-full bg-white/8" />
          </div>
        </div>
      </div>
    </div>
  )
}
