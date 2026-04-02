'use client'

import { useState, useCallback, useEffect } from 'react'
import type { SiteData, Section, SiteTheme, Language } from '@/types'
import { GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, Palette, Type, RotateCcw, Check, ChevronDown as Caret } from 'lucide-react'
import { DEFAULT_CONTENT, DEFAULT_THEME } from '@/lib/template-engine'
import AppIcon from '@/components/ui/AppIcon'

interface EditorSidebarProps {
  activeTab: 'sections' | 'theme' | 'content'
  siteData: SiteData
  selectedSection: string | null
  onSelectSection: (id: string) => void
  onToggleSection: (id: string) => void
  onMoveSection: (id: string, dir: 'up' | 'down') => void
  onUpdateSiteData: (updater: (prev: SiteData) => SiteData) => void
}

export default function EditorSidebar({
  activeTab, siteData, selectedSection, onSelectSection,
  onToggleSection, onMoveSection, onUpdateSiteData,
}: EditorSidebarProps) {
  if (activeTab === 'sections') {
    return <SectionsList {...{ siteData, selectedSection, onSelectSection, onToggleSection, onMoveSection }} />
  }
  if (activeTab === 'theme') {
    return <ThemeEditor siteData={siteData} onUpdateSiteData={onUpdateSiteData} />
  }
  return <ContentEditor siteData={siteData} onUpdateSiteData={onUpdateSiteData} />
}

// ─── Sections List ─────────────────────────────────────────────────────────────

function SectionsList({ siteData, selectedSection, onSelectSection, onToggleSection, onMoveSection }: {
  siteData: SiteData
  selectedSection: string | null
  onSelectSection: (id: string) => void
  onToggleSection: (id: string) => void
  onMoveSection: (id: string, dir: 'up' | 'down') => void
}) {
  const sorted = [...siteData.sections].sort((a, b) => a.order - b.order)

  return (
    <div className="p-3 space-y-2">
      <div className="rounded-2xl bg-brand/5 border border-brand/10 px-3 py-2.5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand/70">Structuur</p>
        <p className="text-xs text-ink-soft mt-1">Klik op een sectie om te bewerken of verander de volgorde.</p>
      </div>
      {sorted.map((section, idx) => (
        <SectionRow
          key={section.id}
          section={section}
          isFirst={idx === 0}
          isLast={idx === sorted.length - 1}
          isSelected={selectedSection === section.id}
          onSelect={() => onSelectSection(section.id)}
          onToggle={() => onToggleSection(section.id)}
          onMoveUp={() => onMoveSection(section.id, 'up')}
          onMoveDown={() => onMoveSection(section.id, 'down')}
        />
      ))}
    </div>
  )
}

function SectionRow({ section, isFirst, isLast, isSelected, onSelect, onToggle, onMoveUp, onMoveDown }: {
  section: Section
  isFirst: boolean
  isLast: boolean
  isSelected: boolean
  onSelect: () => void
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded-xl border transition-all ${
        isSelected
          ? 'border-brand/25 bg-brand/5 shadow-[0_10px_30px_rgba(20,90,99,0.08)]'
          : section.visible
          ? 'border-gray-200/80 bg-white/95 hover:border-brand/20'
          : 'border-gray-100 bg-gray-50/70 opacity-60'
      }`}
    >
      <GripVertical size={14} className="text-gray-300 ml-1.5 flex-shrink-0" />

      <button onClick={onSelect} className="flex-1 flex items-center gap-2 py-2.5 px-1 text-left min-w-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/8 text-brand">
          <AppIcon name={sectionIcon(section.type)} className="h-4 w-4" />
        </span>
        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-brand' : 'text-ink'}`}>
          {sectionLabel(section.type)}
        </span>
      </button>

      <div className="flex items-center gap-0.5 mr-1.5">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-all"
        >
          <ChevronUp size={12} className="text-gray-500" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-all"
        >
          <ChevronDown size={12} className="text-gray-500" />
        </button>
        <button onClick={onToggle} className="p-1 rounded hover:bg-gray-100 transition-all">
          {section.visible
            ? <Eye size={12} className="text-green-500" />
            : <EyeOff size={12} className="text-gray-400" />
          }
        </button>
      </div>
    </div>
  )
}

// ─── Theme Editor ──────────────────────────────────────────────────────────────

const PRESETS: Array<Partial<SiteTheme> & { name: string; icon: string }> = [
  { name: 'Zee',      icon: '🌊', brand: '#145A63', brandLight: '#DFF0F3', accent: '#2CA87F', bg: '#F8FAF9', bgSoft: '#EEF6F8', ink: '#17313A', radius: 'round',  font: 'outfit'     },
  { name: 'Olijf',   icon: '🌿', brand: '#4A6741', brandLight: '#EDF3EC', accent: '#A67B5B', bg: '#F9FAF8', bgSoft: '#F0F4EF', ink: '#1E2820', radius: 'soft',   font: 'outfit'     },
  { name: 'Terra',   icon: '🏺', brand: '#9B4523', brandLight: '#F5EAE5', accent: '#D4875A', bg: '#FFFAF8', bgSoft: '#F7EDE7', ink: '#2E1A0E', radius: 'soft',   font: 'playfair'   },
  { name: 'Marine',  icon: '⛵', brand: '#1B3A5C', brandLight: '#E4EEF8', accent: '#4A90D9', bg: '#F8FAFC', bgSoft: '#EDF2F7', ink: '#1A2433', radius: 'sharp',  font: 'inter'      },
  { name: 'Lavend.', icon: '💜', brand: '#6B5B95', brandLight: '#F0EDF8', accent: '#B388FF', bg: '#FAFAF9', bgSoft: '#F2EEF8', ink: '#2D1B4E', radius: 'round',  font: 'montserrat' },
  { name: 'Koraal',  icon: '🪸', brand: '#C75B7A', brandLight: '#FCEEF3', accent: '#F97316', bg: '#FFF9FA', bgSoft: '#FAEEF2', ink: '#2E0D18', radius: 'round',  font: 'outfit'     },
  { name: 'Goud',    icon: '✨', brand: '#8B6914', brandLight: '#FDF6E3', accent: '#D4A017', bg: '#FFFEF9', bgSoft: '#FAF5E4', ink: '#2A1D05', radius: 'soft',   font: 'playfair'   },
  { name: 'Antrac.', icon: '🖤', brand: '#2D3748', brandLight: '#EDF2F7', accent: '#68D391', bg: '#F7FAFC', bgSoft: '#E8EFF5', ink: '#1A202C', radius: 'sharp',  font: 'inter'      },
]

const FONT_OPTIONS: Array<{ key: SiteTheme['font']; label: string; stack: string }> = [
  { key: 'outfit',     label: 'Outfit',      stack: "'Outfit',sans-serif"                      },
  { key: 'inter',      label: 'Inter',       stack: "'Inter',sans-serif"                        },
  { key: 'playfair',   label: 'Playfair',    stack: "'Playfair Display',Georgia,serif"          },
  { key: 'montserrat', label: 'Montserrat',  stack: "'Montserrat',sans-serif"                   },
  { key: 'system',     label: 'Systeem',     stack: "system-ui,-apple-system,sans-serif"        },
]

function ThemeEditor({ siteData, onUpdateSiteData }: { siteData: SiteData; onUpdateSiteData: (u: (prev: SiteData) => SiteData) => void }) {
  const { theme } = siteData
  const [openSection, setOpenSection] = useState<string>('presets')
  const [copied, setCopied] = useState<string | null>(null)

  const updateTheme = useCallback((patch: Partial<SiteTheme>) => {
    onUpdateSiteData(prev => ({ ...prev, theme: { ...prev.theme, ...patch } }))
  }, [onUpdateSiteData])

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const { name: _n, icon: _i, ...values } = preset
    updateTheme(values)
  }

  const resetTheme = () => updateTheme(DEFAULT_THEME)

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex).then(() => { setCopied(hex); setTimeout(() => setCopied(null), 1500) })
  }

  const toggle = (key: string) => setOpenSection(prev => prev === key ? '' : key)

  return (
    <div className="p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Palette size={13} className="text-brand" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-brand/70">Thema</span>
        </div>
        <button
          onClick={resetTheme}
          className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-brand transition-colors py-1 px-2 rounded-lg hover:bg-brand/5"
        >
          <RotateCcw size={10} /> Reset
        </button>
      </div>

      {/* Live mini preview */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="h-8 w-full flex items-center px-3 gap-2" style={{ background: theme.brand }}>
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <div className="flex-1 h-1.5 rounded-full bg-white/25" />
          <div className="w-10 h-4 rounded-full" style={{ background: theme.accent }} />
        </div>
        <div className="px-3 py-2.5 flex items-center gap-3" style={{ background: theme.bg }}>
          <div className="flex flex-col gap-1 flex-1">
            <div className="w-20 h-2 rounded-full" style={{ background: theme.ink, opacity: 0.8 }} />
            <div className="w-28 h-1.5 rounded-full" style={{ background: theme.ink, opacity: 0.3 }} />
          </div>
          <div className="h-6 px-3 rounded-full text-[10px] font-bold text-white flex items-center" style={{ background: theme.brand }}>Boek</div>
        </div>
        <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${theme.brand}, ${theme.accent})` }} />
      </div>

      {/* Stijlpakketten */}
      <ThemeSection title="Stijlpakketten" sectionKey="presets" open={openSection === 'presets'} onToggle={toggle}>
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map(preset => {
            const isActive = theme.brand === preset.brand && theme.accent === preset.accent
            return (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                title={preset.name}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all text-[10px] font-bold ${
                  isActive ? 'border-brand bg-brand/5 text-brand shadow-sm' : 'border-gray-100 bg-white hover:border-brand/20 text-ink-soft hover:shadow-sm'
                }`}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${preset.brand}, ${preset.accent})` }}
                >
                  {isActive && <Check size={12} />}
                </span>
                <span className="leading-tight text-center">{preset.name}</span>
              </button>
            )
          })}
        </div>
      </ThemeSection>

      {/* Kleuren */}
      <ThemeSection title="Kleuren" sectionKey="kleuren" open={openSection === 'kleuren'} onToggle={toggle}>
        <div className="space-y-2.5">
          {([
            ['brand',      'Primaire kleur'],
            ['brandLight', 'Lichte variant'],
            ['accent',     'Accentkleur'],
            ['bg',         'Achtergrond'],
            ['bgSoft',     'Achtergrond zacht'],
            ['ink',        'Tekstkleur'],
          ] as const).map(([key, label]) => (
            <ProColorRow
              key={key}
              label={label}
              value={(theme[key] as string) || '#000000'}
              onChange={v => updateTheme({ [key]: v })}
              isCopied={copied === ((theme[key] as string) || '#000000')}
              onCopy={() => copyHex((theme[key] as string) || '#000000')}
            />
          ))}
        </div>
      </ThemeSection>

      {/* Lettertype */}
      <ThemeSection title="Lettertype" sectionKey="font" open={openSection === 'font'} onToggle={toggle}>
        <div className="space-y-1.5">
          {FONT_OPTIONS.map(({ key, label, stack }) => (
            <button
              key={key}
              onClick={() => updateTheme({ font: key })}
              className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-all text-left ${
                theme.font === key
                  ? 'border-brand/30 bg-brand/5 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-brand/20 hover:shadow-sm'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${theme.font === key ? 'border-brand bg-brand' : 'border-gray-200'}`}>
                {theme.font === key && <Check size={10} className="text-white m-auto mt-0.5" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-ink" style={{ fontFamily: stack }}>{label}</span>
                <span className="text-[10px] text-ink-soft" style={{ fontFamily: stack }}>ABCabc 1234</span>
              </div>
            </button>
          ))}
        </div>
      </ThemeSection>

      {/* Hoeken + Dichtheid */}
      <ThemeSection title="Stijl" sectionKey="stijl" open={openSection === 'stijl'} onToggle={toggle}>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Hoeken</p>
            <div className="grid grid-cols-3 gap-1.5">
              {([['sharp', 'Scherp', '2px'], ['soft', 'Zacht', '10px'], ['round', 'Rond', '20px']] as const).map(([val, label, r]) => (
                <button
                  key={val}
                  onClick={() => updateTheme({ radius: val })}
                  className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl border transition-all ${
                    theme.radius === val ? 'border-brand bg-brand/5 text-brand' : 'border-gray-100 bg-white hover:border-brand/20 text-ink-soft'
                  }`}
                >
                  <div
                    className="w-8 h-5 border-2 border-current opacity-70"
                    style={{ borderRadius: r }}
                  />
                  <span className="text-[10px] font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Ruimte</p>
            <div className="grid grid-cols-3 gap-1.5">
              {([['compact', 'Compact', '2'], ['comfortable', 'Normaal', '4'], ['open', 'Ruim', '6']] as const).map(([val, label, bars]) => (
                <button
                  key={val}
                  onClick={() => updateTheme({ spacing: val })}
                  className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl border transition-all ${
                    (theme.spacing ?? 'comfortable') === val ? 'border-brand bg-brand/5 text-brand' : 'border-gray-100 bg-white hover:border-brand/20 text-ink-soft'
                  }`}
                >
                  <div className="flex flex-col gap-px w-6">
                    {Array.from({ length: Number(bars) }).map((_, i) => (
                      <div key={i} className="h-0.5 w-full rounded-full bg-current opacity-50" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ThemeSection>
    </div>
  )
}

function ThemeSection({ title, sectionKey, open, onToggle, children }: {
  title: string; sectionKey: string; open: boolean; onToggle: (key: string) => void; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-brand/10 bg-white/70 overflow-hidden">
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-brand/3 transition-colors"
      >
        <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-gray-500">{title}</span>
        <Caret size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pt-2.5 pb-3 border-t border-gray-100/70">{children}</div>}
    </div>
  )
}

function ProColorRow({ label, value, onChange, isCopied, onCopy }: {
  label: string; value: string; onChange: (v: string) => void; isCopied: boolean; onCopy: () => void
}) {
  const [hexInput, setHexInput] = useState(value)
  // Sync hex input when value changes externally (e.g. preset applied)
  useEffect(() => { setHexInput(value) }, [value])

  const handleHexChange = (v: string) => {
    setHexInput(v)
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v)
  }

  const handleColorPickerChange = (v: string) => {
    setHexInput(v)
    onChange(v)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={e => handleColorPickerChange(e.target.value)}
        className="w-7 h-7 rounded-lg cursor-pointer border border-gray-100 p-0.5 flex-shrink-0"
        title={label}
      />
      <div className="flex-1 min-w-0">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block leading-tight">{label}</label>
        <input
          type="text"
          value={hexInput}
          onChange={e => handleHexChange(e.target.value)}
          onBlur={() => { if (!/^#[0-9A-Fa-f]{6}$/.test(hexInput)) setHexInput(value) }}
          className="w-full text-xs font-mono text-ink bg-transparent border-none outline-none p-0 mt-0.5 leading-tight"
          maxLength={7}
          spellCheck={false}
        />
      </div>
      <button
        onClick={onCopy}
        title="Kopieer hex"
        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
      >
        {isCopied ? <Check size={10} className="text-green-500" /> : <span className="text-[9px] text-gray-300 font-bold">⎘</span>}
      </button>
    </div>
  )
}

// ─── Content Editor (Multilingual) ────────────────────────────────────────────

function ContentEditor({ siteData, onUpdateSiteData }: { siteData: SiteData; onUpdateSiteData: (u: (prev: SiteData) => SiteData) => void }) {
  const { languages, defaultLanguage, content } = siteData
  const settings = siteData.settings ?? {
    languageGateEnabled: true,
    settingsEnabled: true,
    textScaleEnabled: true,
    defaultDarkMode: false,
    defaultTextScale: 1,
    nearbyView: 'list' as const,
  }
  const lang = defaultLanguage as Language
  const c = content[lang] ?? DEFAULT_CONTENT.nl

  function updateContent(path: string[], value: string) {
    onUpdateSiteData(prev => {
      const langContent = { ...(prev.content[lang] ?? DEFAULT_CONTENT.nl) }
      // Simple two-level path update
      if (path.length === 2) {
        const [section, key] = path
        ;(langContent as Record<string, Record<string, string>>)[section] = {
          ...(langContent as Record<string, Record<string, string>>)[section],
          [key]: value,
        }
      }
      return { ...prev, content: { ...prev.content, [lang]: langContent } }
    })
  }

  function setDefaultLanguage(nextLang: Language) {
    onUpdateSiteData(prev => ({ ...prev, defaultLanguage: nextLang }))
  }

  function toggleSetting(key: keyof SiteData['settings']) {
    onUpdateSiteData(prev => ({
      ...prev,
      settings: {
        ...(prev.settings ?? settings),
        [key]: typeof (prev.settings ?? settings)[key] === 'boolean' ? !(prev.settings ?? settings)[key] : (prev.settings ?? settings)[key],
      },
    }))
  }

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2 rounded-2xl bg-brand/5 border border-brand/10 px-3 py-2">
        <Type size={12} className="text-brand" />
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand/70">Teksten</p>
        <div className="ml-auto flex gap-1">
          {languages.map(l => (
            <span key={l} className={`badge ${l === lang ? 'badge-brand' : 'badge-gray'}`}>
              {l.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <TextGroup title="App instellingen">
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-3 text-xs font-semibold text-ink-soft">
            <span>Taalpagina / language gate</span>
            <input type="checkbox" checked={settings.languageGateEnabled} onChange={() => toggleSetting('languageGateEnabled')} className="h-4 w-4 accent-brand" />
          </label>
          <label className="flex items-center justify-between gap-3 text-xs font-semibold text-ink-soft">
            <span>Settings-paneel</span>
            <input type="checkbox" checked={settings.settingsEnabled} onChange={() => toggleSetting('settingsEnabled')} className="h-4 w-4 accent-brand" />
          </label>
          <label className="flex items-center justify-between gap-3 text-xs font-semibold text-ink-soft">
            <span>Tekstgrootte slider</span>
            <input type="checkbox" checked={settings.textScaleEnabled} onChange={() => toggleSetting('textScaleEnabled')} className="h-4 w-4 accent-brand" />
          </label>
          <label className="flex items-center justify-between gap-3 text-xs font-semibold text-ink-soft">
            <span>Donkere modus standaard</span>
            <input type="checkbox" checked={settings.defaultDarkMode} onChange={() => toggleSetting('defaultDarkMode')} className="h-4 w-4 accent-brand" />
          </label>
        </div>
      </TextGroup>

      <TextGroup title="Taalinstellingen">
        <div className="grid grid-cols-2 gap-2">
          {languages.map(l => (
            <button
              key={l}
              onClick={() => setDefaultLanguage(l)}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                lang === l ? 'bg-brand text-white border-brand' : 'bg-white border-gray-200 text-ink-soft hover:border-brand/30'
              }`}
            >
              {l.toUpperCase()} {lang === l ? '• standaard' : ''}
            </button>
          ))}
        </div>
      </TextGroup>

      <TextGroup title="Meta">
        <TextField label="Sitenaam" value={c.meta.title} onChange={v => updateContent(['meta', 'title'], v)} />
        <TextField label="Ondertitel" value={c.meta.subtitle ?? ''} onChange={v => updateContent(['meta', 'subtitle'], v)} />
      </TextGroup>

      <TextGroup title="Hero">
        <TextField label="Hoofd tekst" value={c.hero.heading} onChange={v => updateContent(['hero', 'heading'], v)} />
        <TextField label="Sub tekst" value={c.hero.subheading ?? ''} onChange={v => updateContent(['hero', 'subheading'], v)} />
      </TextGroup>

      <TextGroup title="Navigatie">
        <TextField label="Welkom" value={c.nav.welcome} onChange={v => updateContent(['nav', 'welcome'], v)} />
        <TextField label="Huis" value={c.nav.house} onChange={v => updateContent(['nav', 'house'], v)} />
        <TextField label="Fotos" value={c.nav.photos} onChange={v => updateContent(['nav', 'photos'], v)} />
        <TextField label="Omgeving" value={c.nav.area} onChange={v => updateContent(['nav', 'area'], v)} />
        <TextField label="Info" value={c.nav.info} onChange={v => updateContent(['nav', 'info'], v)} />
      </TextGroup>
    </div>
  )
}

function TextGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand/10 bg-white/70 p-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider block mb-0.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
      />
    </div>
  )
}

function sectionIcon(type: Section['type']): string {
  const e: Record<string, string> = {
    hero: 'hero', 'quick-links': 'link', 'house-info': 'house', photos: 'camera',
    area: 'map', restaurants: 'utensils', booking: 'book', contact: 'phone',
    'custom-text': 'text', spacer: 'spacer',
  }
  return e[type] ?? 'info'
}

function sectionLabel(type: Section['type']): string {
  const l: Record<string, string> = {
    hero: 'Hero banner', 'quick-links': 'Snelle links', 'house-info': 'Huisinfo',
    photos: "Foto's", area: 'Omgeving', restaurants: 'Restaurants',
    booking: 'Boeken', contact: 'Contact', 'custom-text': 'Eigen tekst', spacer: 'Ruimte',
  }
  return l[type] ?? type
}
