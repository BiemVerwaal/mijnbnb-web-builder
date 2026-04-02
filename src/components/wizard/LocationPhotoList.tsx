'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { ImageIcon, Check, RefreshCw, Loader2 } from 'lucide-react'
import { SourceBadge, PhotoPickerModal } from './PhotoPickerModal'
import type { PhotoResult } from './PhotoPickerModal'

/* ─── Types ────────────────────────────────────────────────────── */

interface WizardLocation {
  id: string
  name: string
  category: string
  latitude?: number
  longitude?: number
  image_reference?: string
  address?: string
  selected?: boolean
}

interface LocationPhotoListProps {
  locations: WizardLocation[]
  photoResults: Record<string, PhotoResult[]>
  loading: boolean
  loadingProgress: { done: number; total: number }
  stage?: string
  onPhotoSelect: (locationId: string, url: string) => void
  onRefresh: () => void
  onSearchMore: (query: string) => Promise<PhotoResult[]>
}

/* ─── Statusindicatoren ────────────────────────────────────────── */

function PhotoStatus({ location }: { location: WizardLocation }) {
  const hasPhoto = Boolean(location.image_reference)

  if (hasPhoto) {
    return <Check className="h-5 w-5 text-emerald-500" />
  }
  return <ImageIcon className="h-4 w-4 text-ink-soft/40" />
}

/* ─── Location Photo Card ──────────────────────────────────────── */

function LocationPhotoCard({
  location,
  photos,
  onPhotoSelect,
  onSearchMore,
}: {
  location: WizardLocation
  photos: PhotoResult[]
  onPhotoSelect: (url: string) => void
  onSearchMore: (query: string) => Promise<PhotoResult[]>
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const currentPhoto = location.image_reference
  const bestPhoto = photos[0]

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="group flex w-full items-center gap-4 rounded-[20px] border border-brand/10 bg-white p-3 text-left shadow-[0_8px_24px_rgba(15,53,60,0.04)] transition-all hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-[0_12px_30px_rgba(15,53,60,0.08)]"
      >
        {/* Thumbnail */}
        <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-brand/5">
          {currentPhoto ? (
            <Image src={currentPhoto} alt={location.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-6 w-6 text-ink-soft/30" />
            </div>
          )}
          {currentPhoto && bestPhoto && (
            <div className="absolute bottom-1 left-1">
              <SourceBadge source={bestPhoto.source} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-ink">{location.name}</p>
          <p className="truncate text-xs text-ink-soft">{location.address || location.category}</p>
          {currentPhoto ? (
            <p className="mt-1 text-[11px] font-bold text-emerald-600">Foto gekozen</p>
          ) : (
            <p className="mt-1 text-[11px] font-bold text-brand">Foto kiezen</p>
          )}
        </div>

        {/* Status icon */}
        <div className="flex-shrink-0">
          <PhotoStatus location={location} />
        </div>
      </button>

      {modalOpen && (
        <PhotoPickerModal
          locationName={location.name}
          locationAddress={location.address}
          locationCategory={location.category}
          currentPhoto={currentPhoto}
          suggestions={photos}
          onSelect={(url) => {
            onPhotoSelect(url)
            setModalOpen(false)
          }}
          onClose={() => setModalOpen(false)}
          onSearchMore={onSearchMore}
        />
      )}
    </>
  )
}

/* ─── Location Photo List ──────────────────────────────────────── */

export default function LocationPhotoList({
  locations,
  photoResults,
  loading,
  loadingProgress,
  stage,
  onPhotoSelect,
  onRefresh,
  onSearchMore,
}: LocationPhotoListProps) {
  const stats = useMemo(() => {
    const withPhoto = locations.filter((l) => l.image_reference).length
    const total = locations.length
    const pct = total > 0 ? Math.round((withPhoto / total) * 100) : 0
    return { withPhoto, total, pct }
  }, [locations])

  return (
    <div className="space-y-4">
      {/* Header met voortgangsbalk */}
      <div className="rounded-[20px] border border-brand/10 bg-brand/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-extrabold text-ink">
              📍 Locatiefoto&apos;s
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {stats.withPhoto} van {stats.total} locaties hebben een foto
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {loading ? 'Zoeken...' : 'Opnieuw zoeken'}
          </button>
        </div>

        {/* Voortgangsbalk */}
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-brand/10">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${loading ? Math.round((loadingProgress.done / Math.max(loadingProgress.total, 1)) * 100) : stats.pct}%` }}
            />
          </div>
          {loading && (
            <p className="mt-1 text-[11px] text-ink-soft">
              {loadingProgress.done} / {loadingProgress.total} locaties verwerkt...
            </p>
          )}
          {stage && (
            <p className="mt-1 text-xs font-bold text-brand animate-pulse">
              {stage}
            </p>
          )}
        </div>
      </div>

      {/* Locatie kaarten */}
      {locations.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-brand/20 bg-white/50 p-8 text-center text-sm text-ink-soft">
          Geen locaties geselecteerd. Ga terug naar de vorige stap om locaties te kiezen.
        </div>
      ) : (
        <div className="space-y-2">
          {locations.map((loc) => (
            <LocationPhotoCard
              key={loc.id}
              location={loc}
              photos={photoResults[loc.id] || []}
              onPhotoSelect={(url) => onPhotoSelect(loc.id, url)}
              onSearchMore={onSearchMore}
            />
          ))}
        </div>
      )}
    </div>
  )
}
