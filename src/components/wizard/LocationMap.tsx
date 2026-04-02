'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'

/* ─── Types ────────────────────────────────────────────────────── */

interface MapLocation {
  id: string
  name: string
  category: string
  latitude?: number
  longitude?: number
  selected?: boolean
}

interface LocationMapProps {
  locations: MapLocation[]
  centerLat: number
  centerLng: number
  activeId: string | null
  onSelect: (id: string) => void
  onToggle?: (id: string) => void
}

/* ─── Helpers ──────────────────────────────────────────────────── */

function latLngToPixel(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  width: number,
  height: number,
  zoom: number
) {
  const scale = Math.pow(2, zoom) * 256
  const toMerc = (latVal: number) =>
    Math.log(Math.tan(Math.PI / 4 + (latVal * Math.PI) / 360)) / (Math.PI * 2)

  const cx = ((centerLng + 180) / 360) * scale
  const cy = (0.5 - toMerc(centerLat)) * scale
  const px = ((lng + 180) / 360) * scale
  const py = (0.5 - toMerc(lat)) * scale

  return {
    x: width / 2 + (px - cx),
    y: height / 2 + (py - cy),
  }
}

function fitZoom(
  locations: { latitude: number; longitude: number }[],
  width: number,
  height: number,
  centerLat: number,
  centerLng: number
): number {
  for (let z = 16; z >= 8; z--) {
    const allFit = locations.every((loc) => {
      const { x, y } = latLngToPixel(loc.latitude, loc.longitude, centerLat, centerLng, width, height, z)
      return x > 30 && x < width - 30 && y > 30 && y < height - 30
    })
    if (allFit) return z
  }
  return 10
}

const categoryColors: Record<string, string> = {
  restaurant: '#e67d4d',
  tourism: '#145a63',
  shops: '#6b9e3a',
}

/* ─── Component ────────────────────────────────────────────────── */

export default function LocationMap({
  locations,
  centerLat,
  centerLng,
  activeId,
  onSelect,
  onToggle,
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 600, height: 400 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ width, height })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const validLocations = useMemo(
    () =>
      locations.filter(
        (l) =>
          typeof l.latitude === 'number' &&
          typeof l.longitude === 'number' &&
          l.latitude !== 0 &&
          l.longitude !== 0
      ),
    [locations]
  )

  const zoom = useMemo(
    () =>
      validLocations.length > 0
        ? fitZoom(
            validLocations as { latitude: number; longitude: number }[],
            size.width,
            size.height,
            centerLat,
            centerLng
          )
        : 13,
    [validLocations, size.width, size.height, centerLat, centerLng]
  )

  // Tile berekeningen
  const tileUrl = (x: number, y: number, z: number) =>
    `https://tile.openstreetmap.org/${z}/${x}/${y}.png`

  const tiles = useMemo(() => {
    const scale = Math.pow(2, zoom)
    const toMerc = (lat: number) =>
      Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / (Math.PI * 2)

    const centerTileX = ((centerLng + 180) / 360) * scale
    const centerTileY = (0.5 - toMerc(centerLat)) * scale

    const tileCountX = Math.ceil(size.width / 256) + 2
    const tileCountY = Math.ceil(size.height / 256) + 2

    const startTileX = Math.floor(centerTileX - tileCountX / 2)
    const startTileY = Math.floor(centerTileY - tileCountY / 2)

    const offsetX = size.width / 2 - (centerTileX - startTileX) * 256
    const offsetY = size.height / 2 - (centerTileY - startTileY) * 256

    const result: { x: number; y: number; px: number; py: number; key: string }[] = []
    for (let dy = 0; dy < tileCountY; dy++) {
      for (let dx = 0; dx < tileCountX; dx++) {
        const tx = ((startTileX + dx) % scale + scale) % scale
        const ty = startTileY + dy
        if (ty < 0 || ty >= scale) continue
        result.push({
          x: tx,
          y: ty,
          px: offsetX + dx * 256,
          py: offsetY + dy * 256,
          key: `${zoom}-${tx}-${ty}`,
        })
      }
    }
    return result
  }, [centerLat, centerLng, zoom, size.width, size.height])

  const markers = useMemo(
    () =>
      validLocations.map((loc, idx) => {
        const { x, y } = latLngToPixel(
          loc.latitude!,
          loc.longitude!,
          centerLat,
          centerLng,
          size.width,
          size.height,
          zoom
        )
        return { ...loc, px: x, py: y, index: idx }
      }),
    [validLocations, centerLat, centerLng, size.width, size.height, zoom]
  )

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-[20px] overflow-hidden border border-brand/10 bg-brand/5"
      style={{ height: 380 }}
    >
      {/* OSM Tiles */}
      <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: 'none' }}>
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tileUrl(tile.x, tile.y, zoom)}
            alt=""
            width={256}
            height={256}
            loading="eager"
            className="absolute"
            style={{ left: tile.px, top: tile.py, width: 256, height: 256 }}
            draggable={false}
          />
        ))}
      </div>

      {/* BnB center marker */}
      <div
        className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
        style={{
          left: size.width / 2,
          top: size.height / 2,
        }}
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-white border-[3px] border-brand shadow-lg flex items-center justify-center">
            <span className="text-sm">🏠</span>
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            Jouw BnB
          </div>
        </div>
      </div>

      {/* Location markers */}
      {markers.map((m) => {
        const isActive = m.id === activeId
        const isSelected = m.selected !== false
        const color = categoryColors[m.category] ?? '#145a63'
        return (
          <button
            key={m.id}
            type="button"
            onClick={(e) => {
              if (onToggle && !e.shiftKey) {
                onToggle(m.id)
              } else {
                onSelect(m.id)
              }
            }}
            className={`absolute z-10 -translate-x-1/2 -translate-y-full transition-all ${isActive ? 'z-30 scale-125' : 'hover:scale-110 hover:z-20'} ${!isSelected ? 'opacity-40 grayscale' : ''}`}
            style={{ left: m.px, top: m.py }}
            title={`${m.name}${isSelected ? ' ✓' : ' (niet geselecteerd)'}`}
          >
            <div className="relative">
              <MapPin
                size={isActive ? 32 : 26}
                fill={isSelected ? color : '#999'}
                color="white"
                strokeWidth={1.5}
              />
              <span className="absolute top-[3px] left-1/2 -translate-x-1/2 text-[9px] font-black text-white">
                {m.index + 1}
              </span>
            </div>
            {isActive && (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ink text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow max-w-[140px] truncate">
                {m.name}
              </div>
            )}
          </button>
        )
      })}

      {/* Attribution */}
      <div className="absolute bottom-1 right-2 z-30 text-[9px] text-ink/50 bg-white/70 px-1.5 py-0.5 rounded">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap</a>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-30 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow-sm space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink">
          <MapPin size={12} fill="#e67d4d" color="white" strokeWidth={1.5} /> Restaurant
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink">
          <MapPin size={12} fill="#6b9e3a" color="white" strokeWidth={1.5} /> Voorziening
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink">
          <MapPin size={12} fill="#145a63" color="white" strokeWidth={1.5} /> Beleving
        </div>
      </div>
    </div>
  )
}
