'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, Link2, X, GripVertical, ImageIcon, Plus } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/* ─── Types ────────────────────────────────────────────────────── */

export type PhotoCategory = 'bnb-main' | 'room' | 'facility' | 'local-area'

export interface WizardPhoto {
  id: string
  url: string
  category: PhotoCategory
  caption?: string
  alt?: string
}

interface CategoryConfig {
  key: PhotoCategory
  label: string
  description: string
  icon: string
}

const categories: CategoryConfig[] = [
  { key: 'bnb-main', label: 'Hoofdfoto', description: 'De eerste foto die gasten zien', icon: '🏠' },
  { key: 'room', label: 'Kamers', description: 'Slaapkamers en ruimtes', icon: '🛏️' },
  { key: 'facility', label: 'Voorzieningen', description: 'Keuken, badkamer, tuin, etc.', icon: '🏗️' },
  { key: 'local-area', label: 'Omgeving', description: 'Uitzicht en buurt', icon: '🌅' },
]

interface BnbPhotoPanelProps {
  photos: WizardPhoto[]
  onPhotosChange: (photos: WizardPhoto[]) => void
}

/* ─── Sortable Photo Item ──────────────────────────────────────── */

function SortablePhotoItem({
  photo,
  onRemove,
  onCaptionChange,
}: {
  photo: WizardPhoto
  onRemove: () => void
  onCaptionChange: (caption: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-brand/10 bg-brand/5">
        <Image src={photo.url} alt={photo.alt || ''} fill className="object-cover" unoptimized />

        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute left-1 top-1 rounded-lg bg-white/80 p-1 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100"
          title="Sleep om te herordenen"
        >
          <GripVertical className="h-3.5 w-3.5 text-ink-soft" />
        </button>

        {/* Delete */}
        <button
          onClick={onRemove}
          className="absolute right-1 top-1 rounded-lg bg-white/80 p-1 opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-red-50 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5 text-red-500" />
        </button>
      </div>

      {/* Caption */}
      <input
        type="text"
        value={photo.caption || ''}
        onChange={(e) => onCaptionChange(e.target.value)}
        placeholder="Bijschrift..."
        className="mt-1.5 w-full rounded-lg border border-brand/10 bg-white px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-soft/50 focus:border-brand focus:outline-none"
      />
    </div>
  )
}

/* ─── Photo Category Section ───────────────────────────────────── */

function PhotoCategorySection({
  config,
  photos,
  onAdd,
  onRemove,
  onReorder,
  onCaptionChange,
}: {
  config: CategoryConfig
  photos: WizardPhoto[]
  onAdd: (url: string) => void
  onRemove: (id: string) => void
  onReorder: (from: number, to: number) => void
  onCaptionChange: (id: string, caption: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = photos.findIndex((p) => p.id === active.id)
    const newIndex = photos.findIndex((p) => p.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onAdd(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  function handleUrlAdd() {
    const url = urlInput.trim()
    if (url && /^https?:\/\//.test(url)) {
      onAdd(url)
      setUrlInput('')
      setShowUrlInput(false)
    }
  }

  return (
    <div className="rounded-[20px] border border-brand/10 bg-white p-4 shadow-[0_8px_24px_rgba(15,53,60,0.04)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{config.icon}</span>
          <div>
            <p className="text-sm font-extrabold text-ink">{config.label}</p>
            <p className="text-[11px] text-ink-soft">{config.description}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="rounded-lg border border-brand/10 bg-brand/5 p-1.5 text-brand transition-colors hover:bg-brand/10"
            title="URL plakken"
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-brand/10 bg-brand/5 p-1.5 text-brand transition-colors hover:bg-brand/10"
            title="Upload foto"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
        </div>
      </div>

      {/* URL input */}
      {showUrlInput && (
        <div className="mt-3 flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
            placeholder="https://..."
            className="flex-1 rounded-xl border border-brand/20 bg-white px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
          />
          <button onClick={handleUrlAdd} className="btn-primary px-3 py-2 text-xs">
            Toevoegen
          </button>
        </div>
      )}

      {/* Photo grid met drag-and-drop */}
      <div className="mt-3">
        {photos.length === 0 ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/15 bg-brand/[0.02] px-4 py-6 text-xs font-bold text-ink-soft transition-colors hover:border-brand/30 hover:bg-brand/5"
          >
            <Plus className="h-4 w-4" />
            Foto toevoegen
          </button>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {photos.map((photo) => (
                  <SortablePhotoItem
                    key={photo.id}
                    photo={photo}
                    onRemove={() => onRemove(photo.id)}
                    onCaptionChange={(caption) => onCaptionChange(photo.id, caption)}
                  />
                ))}
                {/* Add button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-brand/15 bg-brand/[0.02] transition-colors hover:border-brand/30 hover:bg-brand/5"
                >
                  <Plus className="h-5 w-5 text-ink-soft/50" />
                </button>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

/* ─── Main Panel ───────────────────────────────────────────────── */

export default function BnbPhotoPanel({ photos, onPhotosChange }: BnbPhotoPanelProps) {
  const addPhoto = useCallback(
    (category: PhotoCategory, url: string) => {
      const newPhoto: WizardPhoto = {
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url,
        category,
      }
      onPhotosChange([...photos, newPhoto])
    },
    [photos, onPhotosChange]
  )

  const removePhoto = useCallback(
    (id: string) => {
      onPhotosChange(photos.filter((p) => p.id !== id))
    },
    [photos, onPhotosChange]
  )

  const reorderPhotos = useCallback(
    (category: PhotoCategory, fromIndex: number, toIndex: number) => {
      const catPhotos = photos.filter((p) => p.category === category)
      const otherPhotos = photos.filter((p) => p.category !== category)
      const reordered = arrayMove(catPhotos, fromIndex, toIndex)
      onPhotosChange([...otherPhotos, ...reordered])
    },
    [photos, onPhotosChange]
  )

  const updateCaption = useCallback(
    (id: string, caption: string) => {
      onPhotosChange(photos.map((p) => (p.id === id ? { ...p, caption } : p)))
    },
    [photos, onPhotosChange]
  )

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-brand/10 bg-brand/5 p-4">
        <p className="text-sm font-extrabold text-ink">🏠 B&B Foto&apos;s</p>
        <p className="mt-0.5 text-xs text-ink-soft">
          Upload foto&apos;s van je accommodatie per categorie. Sleep om te herordenen.
        </p>
      </div>

      {categories.map((config) => {
        const catPhotos = photos.filter((p) => p.category === config.key)
        return (
          <PhotoCategorySection
            key={config.key}
            config={config}
            photos={catPhotos}
            onAdd={(url) => addPhoto(config.key, url)}
            onRemove={removePhoto}
            onReorder={(from, to) => reorderPhotos(config.key, from, to)}
            onCaptionChange={updateCaption}
          />
        )
      })}
    </div>
  )
}
