'use client'

import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, Upload, Link2, Search, Check, AlertTriangle, ImageIcon, ExternalLink } from 'lucide-react'

/* ─── Types ────────────────────────────────────────────────────── */

export interface PhotoResult {
  url: string
  source: 'wikimedia' | 'geosearch' | 'unsplash' | 'pexels' | 'stock' | 'booking' | 'tripadvisor' | 'web'
  confidence: 'high' | 'medium' | 'low'
  attribution?: string
}

export interface PhotoPickerModalProps {
  locationName: string
  locationAddress?: string
  locationCategory?: string
  currentPhoto?: string
  suggestions: PhotoResult[]
  onSelect: (url: string) => void
  onClose: () => void
  onSearchMore: (query: string) => Promise<PhotoResult[]>
}

/* ─── Confidence badge ─────────────────────────────────────────── */

const confidenceConfig = {
  high: { label: 'Betrouwbaar', color: 'bg-emerald-100 text-emerald-700', dots: 3 },
  medium: { label: 'Redelijk', color: 'bg-amber-100 text-amber-700', dots: 2 },
  low: { label: 'Stockfoto', color: 'bg-red-100 text-red-600', dots: 1 },
} as const

export function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const config = confidenceConfig[level]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${config.color}`}>
      <span className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= config.dots ? 'bg-current' : 'bg-current/20'}`} />
        ))}
      </span>
      {config.label}
    </span>
  )
}

/* ─── Source badge ──────────────────────────────────────────────── */

const sourceLabels: Record<string, string> = {
  wikimedia: 'Wikimedia',
  geosearch: 'Wikimedia nabij',
  unsplash: 'Unsplash',
  pexels: 'Pexels',
  stock: 'Stockfoto',
  booking: 'Booking.com',
  tripadvisor: 'TripAdvisor',
  web: 'Web',
  duckduckgo: 'DuckDuckGo',
  flickr: 'Flickr',
}

const SEARCH_SOURCES = [
  { key: 'duckduckgo', label: 'DuckDuckGo', emoji: '🦆' },
  { key: 'flickr', label: 'Flickr', emoji: '📸' },
  { key: 'booking', label: 'Booking', emoji: '🏨' },
  { key: 'tripadvisor', label: 'TripAdvisor', emoji: '✈️' },
  { key: 'wikimedia', label: 'Wikimedia', emoji: '📚' },
  { key: 'unsplash', label: 'Unsplash', emoji: '📷' },
  { key: 'pexels', label: 'Pexels', emoji: '🎨' },
] as const

type SearchSourceKey = typeof SEARCH_SOURCES[number]['key']

export function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-ink backdrop-blur-sm">
      {sourceLabels[source] || source}
    </span>
  )
}

/* ─── Photo Picker Modal ──────────────────────────────────────── */

export function PhotoPickerModal({
  locationName,
  locationAddress,
  locationCategory,
  currentPhoto,
  suggestions,
  onSelect,
  onClose,
  onSearchMore,
}: PhotoPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState(locationName)
  const [searchResults, setSearchResults] = useState<PhotoResult[]>([])
  const [searching, setSearching] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [activeTab, setActiveTab] = useState<'suggestions' | 'search' | 'url'>('suggestions')
  const [selectedSources, setSelectedSources] = useState<Set<SearchSourceKey>>(
    () => new Set<SearchSourceKey>(['duckduckgo', 'flickr', 'wikimedia']),
  )
  const [smartVariants, setSmartVariants] = useState<string[]>([])
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({})

  const toggleSource = useCallback((key: SearchSourceKey) => {
    setSelectedSources((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const handleSmartSearch = useCallback(async () => {
    if (!searchQuery.trim() || selectedSources.size === 0) return
    setSearching(true)
    setSmartVariants([])
    setSourceCounts({})
    try {
      const res = await fetch('/api/smart-photo-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          sources: Array.from(selectedSources),
          context: { address: locationAddress, category: locationCategory },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const photos: PhotoResult[] = (data.photos ?? []).map((p: Record<string, unknown>) => ({
          url: p.url as string,
          source: (p.source as string) || 'web',
          confidence: (p.confidence as string) || 'low',
          attribution: p.attribution as string | undefined,
        }))
        setSearchResults(photos)
        setSmartVariants(data.variants ?? [])
        setSourceCounts(data.sourceCounts ?? {})
      }
    } finally {
      setSearching(false)
    }
  }, [searchQuery, selectedSources, locationAddress, locationCategory])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const results = await onSearchMore(searchQuery.trim())
      setSearchResults(results)
    } finally {
      setSearching(false)
    }
  }, [searchQuery, onSearchMore])

  const handleUrlSubmit = useCallback(() => {
    const url = urlInput.trim()
    if (url && /^https?:\/\//.test(url)) {
      onSelect(url)
    }
  }, [urlInput, onSelect])

  const allSuggestions = activeTab === 'search' ? searchResults : suggestions

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[28px] border border-brand/10 bg-white shadow-[0_30px_80px_rgba(15,53,60,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand/10 px-6 py-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand/55">Foto kiezen</p>
            <h3 className="text-lg font-extrabold text-ink">{locationName}</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-ink-soft transition-colors hover:bg-brand/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Huidige foto */}
        {currentPhoto && (
          <div className="border-b border-brand/10 px-6 py-3">
            <p className="mb-2 text-xs font-bold text-ink-soft">Huidige foto</p>
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-24 overflow-hidden rounded-xl">
                <Image src={currentPhoto} alt={locationName} fill className="object-cover" unoptimized />
              </div>
              <Check className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-brand/10 px-6 pt-3">
          {[
            { key: 'suggestions', label: 'Suggesties', icon: ImageIcon },
            { key: 'search', label: 'Zoeken', icon: Search },
            { key: 'url', label: 'URL plakken', icon: Link2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                activeTab === key
                  ? 'border-b-2 border-brand bg-brand/5 text-brand'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'url' ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-soft">Plak een link naar een foto (URL):</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  placeholder="https://..."
                  className="flex-1 rounded-xl border border-brand/20 bg-white px-4 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim() || !/^https?:\/\//.test(urlInput.trim())}
                  className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40"
                >
                  Toevoegen
                </button>
              </div>
              {urlInput.trim() && /^https?:\/\//.test(urlInput.trim()) && (
                <div className="relative mt-3 h-40 w-full overflow-hidden rounded-xl bg-brand/5">
                  <Image src={urlInput.trim()} alt="Preview" fill className="object-contain" unoptimized />
                </div>
              )}
            </div>
          ) : (
            <>
              {activeTab === 'search' && (
                <div className="mb-4 space-y-3">
                  {/* Bronkiezer */}
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-brand/50 mb-2">
                      Zoek met
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SEARCH_SOURCES.map(({ key, label, emoji }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleSource(key)}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                            selectedSources.has(key)
                              ? 'bg-brand text-white shadow-sm'
                              : 'bg-brand/5 text-brand/60 hover:bg-brand/10'
                          }`}
                        >
                          <span>{emoji}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Zoekveld */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
                      placeholder="Zoek op naam, adres of trefwoord..."
                      className="flex-1 rounded-xl border border-brand/20 bg-white px-4 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    <button
                      onClick={handleSmartSearch}
                      disabled={searching || selectedSources.size === 0}
                      className="btn-primary px-4 py-2.5 text-sm whitespace-nowrap disabled:opacity-40"
                    >
                      {searching ? 'Slim zoeken\u2026' : '\uD83D\uDE80 Slim zoeken'}
                    </button>
                  </div>

                  {/* Loading indicator */}
                  {searching && (
                    <p className="text-[11px] text-brand/50 animate-pulse">
                      Zoeken via {Array.from(selectedSources).map((s) => sourceLabels[s] || s).join(', ')}\u2026
                    </p>
                  )}

                  {/* Slimme varianten + broncounts (na zoekopdracht) */}
                  {smartVariants.length > 0 && (
                    <div className="rounded-xl bg-brand/5 px-3 py-2 space-y-1.5">
                      <p className="text-[11px] font-bold text-brand/60">
                        Automatisch gezocht op:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {smartVariants.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setSearchQuery(v)}
                            className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-ink-soft border border-brand/10 hover:border-brand/30 transition-colors"
                          >
                            {`\u201C${v}\u201D`}
                          </button>
                        ))}
                      </div>
                      {Object.keys(sourceCounts).length > 0 && (
                        <p className="text-[10px] text-brand/50">
                          {Object.entries(sourceCounts)
                            .filter(([, c]) => c > 0)
                            .map(([s, c]) => `${sourceLabels[s] || s}: ${c}`)
                            .join(' \u00B7 ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {allSuggestions.length === 0 ? (
                <div className="py-8 text-center text-sm text-ink-soft">
                  {activeTab === 'search'
                    ? searching
                      ? 'Foto\'s zoeken...'
                      : 'Gebruik de zoekbalk om foto\'s te vinden.'
                    : 'Geen foto\'s gevonden voor deze locatie.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {allSuggestions.map((photo, i) => (
                    <button
                      key={`${photo.url}-${i}`}
                      onClick={() => onSelect(photo.url)}
                      className="group relative overflow-hidden rounded-2xl border-2 border-transparent bg-brand/5 transition-all hover:border-brand hover:shadow-lg"
                    >
                      <div className="relative aspect-[4/3]">
                        <Image src={photo.url} alt={locationName} fill className="object-cover" unoptimized />
                        <div className="absolute left-2 top-2">
                          <SourceBadge source={photo.source} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-brand/30 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand">
                            Selecteer
                          </span>
                        </div>
                      </div>
                      {photo.attribution && (
                        <p className="truncate px-2 py-1.5 text-[10px] text-ink-soft">{photo.attribution}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
