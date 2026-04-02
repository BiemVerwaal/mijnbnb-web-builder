import { NextRequest, NextResponse } from 'next/server'

/* ─── Types ────────────────────────────────────────────────────── */

interface LocationInput {
  id?: string
  name: string
  latitude?: number
  longitude?: number
  lat?: number
  lng?: number
  category?: string
  wikidataId?: string
  wikimediaCommons?: string
  address?: string
}

interface PhotoResult {
  url: string
  source: 'wikimedia' | 'geosearch' | 'unsplash' | 'pexels' | 'stock' | 'booking' | 'tripadvisor' | 'web'
  confidence: 'high' | 'medium' | 'low'
  attribution?: string
}

/* ─── Wikimedia helpers ──────────────────────────────────────── */

function resolveWikimediaFile(value?: string): string {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  const normalized = trimmed.startsWith('File:') ? trimmed.slice(5) : trimmed
  if (!normalized || normalized.startsWith('Category:')) return ''
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(normalized.replace(/ /g, '_'))}?width=800`
}

async function fetchWikidataImage(wikidataId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(wikidataId)}.json`,
      { headers: { 'User-Agent': 'mijn-bnb/1.0 (guest app builder)' }, cache: 'no-store' }
    )
    if (!res.ok) return ''
    const json = await res.json() as {
      entities?: Record<string, { claims?: { P18?: Array<{ mainsnak?: { datavalue?: { value?: string } } }> } }>
    }
    const entity = json.entities?.[wikidataId]
    const fileName = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
    if (typeof fileName !== 'string') return ''
    return resolveWikimediaFile(`File:${fileName}`)
  } catch {
    return ''
  }
}

async function wikimediaGeosearch(lat: number, lon: number, radius = 500, limit = 8): Promise<PhotoResult[]> {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=geosearch&ggscoord=${lat}|${lon}&ggsradius=${radius}&ggslimit=${limit}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json`,
      { headers: { 'User-Agent': 'mijn-bnb/1.0 (guest app builder)' }, cache: 'no-store' }
    )
    if (!res.ok) return []
    const json = await res.json() as {
      query?: { pages?: Record<string, {
        imageinfo?: Array<{ thumburl?: string; extmetadata?: { Artist?: { value?: string }; LicenseShortName?: { value?: string } } }>
      }> }
    }
    const pages = json.query?.pages
    if (!pages) return []

    return Object.values(pages)
      .filter((p) => p.imageinfo?.[0]?.thumburl)
      .map((p) => {
        const info = p.imageinfo![0]
        const artist = info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, '').trim() || ''
        const license = info.extmetadata?.LicenseShortName?.value || ''
        return {
          url: info.thumburl!,
          source: 'geosearch' as const,
          confidence: 'medium' as const,
          attribution: [license, artist].filter(Boolean).join(' — ') || undefined,
        }
      })
      .slice(0, limit)
  } catch {
    return []
  }
}

async function fetchUnsplashPhotos(query: string, limit = 4): Promise<PhotoResult[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim()
  if (!key) return []
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' }, cache: 'no-store' }
    )
    if (!res.ok) return []
    const json = await res.json() as { results?: Array<{ urls?: { regular?: string; small?: string }; user?: { name?: string } }> }
    return (json.results ?? [])
      .filter((r) => r.urls?.regular || r.urls?.small)
      .map((r) => ({
        url: (r.urls?.regular ?? r.urls?.small)!,
        source: 'unsplash' as const,
        confidence: 'low' as const,
        attribution: r.user?.name ? `Unsplash / ${r.user.name}` : 'Unsplash',
      }))
  } catch {
    return []
  }
}

async function fetchPexelsPhotos(query: string, limit = 4): Promise<PhotoResult[]> {
  const key = process.env.PEXELS_API_KEY?.trim()
  if (!key) return []
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`,
      { headers: { Authorization: key }, cache: 'no-store' }
    )
    if (!res.ok) return []
    const json = await res.json() as { photos?: Array<{ src?: { medium?: string; large?: string }; photographer?: string }> }
    return (json.photos ?? [])
      .filter((p) => p.src?.medium || p.src?.large)
      .map((p) => ({
        url: (p.src?.large ?? p.src?.medium)!,
        source: 'pexels' as const,
        confidence: 'low' as const,
        attribution: p.photographer ? `Pexels / ${p.photographer}` : 'Pexels',
      }))
  } catch {
    return []
  }
}

/* ─── Web image search (SearXNG – gratis, geen API-key) ─────── */

const SEARX_INSTANCES = [
  process.env.SEARXNG_URL,          // optioneel eigen instantie
  'https://searx.be',
  'https://search.sapti.me',
  'https://searx.tiekoetter.com',
  'https://search.mdosch.de',
].filter(Boolean) as string[]

async function fetchWebImages(query: string, limit = 6): Promise<PhotoResult[]> {
  for (const instance of SEARX_INSTANCES) {
    try {
      const url = new URL('/search', instance)
      url.searchParams.set('q', query)
      url.searchParams.set('format', 'json')
      url.searchParams.set('categories', 'images')
      url.searchParams.set('language', 'nl')
      url.searchParams.set('pageno', '1')

      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'mijn-bnb/1.0 (guest app builder)',
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) continue

      const json = await res.json() as {
        results?: Array<{
          img_src?: string
          url?: string
          source?: string
        }>
      }

      const items = Array.isArray(json.results) ? json.results : []

      const results: PhotoResult[] = items
        .filter((r) => typeof r.img_src === 'string' && r.img_src.startsWith('http'))
        .slice(0, limit)
        .map((r) => {
          const pageUrl = (r.url || '').toLowerCase()
          let source: PhotoResult['source'] = 'web'
          let confidence: PhotoResult['confidence'] = 'low'

          if (pageUrl.includes('booking.com')) {
            source = 'booking'
            confidence = 'medium'
          } else if (pageUrl.includes('tripadvisor')) {
            source = 'tripadvisor'
            confidence = 'medium'
          }

          let attribution: string
          try {
            attribution = new URL(r.url || '').hostname.replace(/^www\./, '')
          } catch {
            attribution = r.source || 'web'
          }

          return { url: r.img_src!, source, confidence, attribution }
        })

      if (results.length > 0) return results
    } catch {
      continue // Probeer volgende SearXNG instantie
    }
  }

  return []
}

/* ─── Per-locatie waterval logica ─────────────────────────────── */

async function findPhotosForLocation(loc: LocationInput): Promise<PhotoResult[]> {
  const results: PhotoResult[] = []
  const latitude = loc.latitude ?? loc.lat
  const longitude = loc.longitude ?? loc.lng
  const city = loc.address?.split(',').slice(-2, -1)[0]?.trim() || ''
  const searchName = `${loc.name} ${city}`.trim()

  // 1. Directe Wikimedia Commons tag uit OSM
  if (loc.wikimediaCommons) {
    const url = resolveWikimediaFile(loc.wikimediaCommons)
    if (url) results.push({ url, source: 'wikimedia', confidence: 'high' })
  }

  // 2. Wikidata P18 (afbeelding-eigenschap)
  if (results.length === 0 && loc.wikidataId) {
    const url = await fetchWikidataImage(loc.wikidataId)
    if (url) results.push({ url, source: 'wikimedia', confidence: 'high' })
  }

  // 3. Wikimedia Geosearch nabij de coördinaten
  if (latitude && longitude) {
    const geosearchResults = await wikimediaGeosearch(latitude, longitude, 300, 4)
    for (const r of geosearchResults) {
      if (!results.some((existing) => existing.url === r.url)) {
        results.push(r)
      }
    }
  }

  // 4. Web image search — Booking.com, TripAdvisor, etc.
  const webResults = await fetchWebImages(searchName, 6)
  for (const r of webResults) {
    if (!results.some((existing) => existing.url === r.url)) {
      results.push(r)
    }
  }

  // 5. Unsplash + Pexels fallback
  if (results.length < 4) {
    const [unsplash, pexels] = await Promise.all([
      fetchUnsplashPhotos(searchName, 3),
      fetchPexelsPhotos(searchName, 3),
    ])
    for (const r of [...unsplash, ...pexels]) {
      if (!results.some((existing) => existing.url === r.url)) {
        results.push(r)
      }
    }
  }

  return results.slice(0, 12)
}

/* ─── Route handler ──────────────────────────────────────────── */

export async function POST(req: NextRequest) {

  try {
    const body = await req.json()
    const locations: LocationInput[] = Array.isArray(body.locations) ? body.locations : []

    if (locations.length === 0) {
      return NextResponse.json({ error: 'Geen locaties opgegeven.' }, { status: 400 })
    }

    if (locations.length > 50) {
      return NextResponse.json({ error: 'Maximaal 50 locaties tegelijk.' }, { status: 400 })
    }

    // Parallel per batch van 5 om rate limits te respecteren
    const batchSize = 5
    const allResults: Record<string, PhotoResult[]> = {}

    for (let i = 0; i < locations.length; i += batchSize) {
      const batch = locations.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (loc) => ({
          key: loc.id ?? loc.name,
          photos: await findPhotosForLocation(loc),
        }))
      )
      for (const { key, photos } of batchResults) {
        allResults[key] = photos
      }
    }

    return NextResponse.json({ results: allResults })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fout bij foto zoeken.' },
      { status: 500 }
    )
  }
}
