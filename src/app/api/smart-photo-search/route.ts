import { NextRequest, NextResponse } from 'next/server'

/* ─── Types ────────────────────────────────────────────────────── */

type SearchSource = 'duckduckgo' | 'flickr' | 'booking' | 'tripadvisor' | 'wikimedia' | 'unsplash' | 'pexels'

interface PhotoResult {
  url: string
  source: string
  confidence: 'high' | 'medium' | 'low'
  attribution?: string
}

/* ─── DuckDuckGo Image Search (direct, geen API key) ─────────── */
/*
  DDG blokkeert niet zoals Google. We halen een vqd-token op via de
  homepage en doen daarna een image search. Dit is precies wat een
  gebruiker in de browser zou doen.
*/

async function searchDuckDuckGo(query: string, limit = 8): Promise<PhotoResult[]> {
  try {
    // Stap 1: vqd-token ophalen
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    })
    const html = await tokenRes.text()
    const vqdMatch = html.match(/vqd=['"]([^'"]+)['"]/)
    if (!vqdMatch) return []
    const vqd = vqdMatch[1]

    // Stap 2: image search API
    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?l=nl-nl&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=size:Medium`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://duckduckgo.com/',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      },
    )
    if (!imgRes.ok) return []

    const json = (await imgRes.json()) as {
      results?: Array<{ image?: string; source?: string; url?: string; title?: string }>
    }

    return (json.results ?? [])
      .filter((r) => typeof r.image === 'string' && r.image.startsWith('http'))
      .slice(0, limit)
      .map((r) => {
        const pageUrl = (r.url || '').toLowerCase()
        let source = 'duckduckgo'
        let confidence: PhotoResult['confidence'] = 'medium'

        if (pageUrl.includes('booking.com')) { source = 'booking'; confidence = 'high' }
        else if (pageUrl.includes('tripadvisor')) { source = 'tripadvisor'; confidence = 'high' }

        let attribution: string
        try { attribution = new URL(r.url || '').hostname.replace(/^www\./, '') }
        catch { attribution = r.source || 'web' }

        return { url: r.image!, source, confidence, attribution }
      })
  } catch {
    return []
  }
}

/* ─── Flickr (gratis, 4000 req/uur, enorme fotobibliotheek) ──── */

async function searchFlickr(query: string, limit = 6): Promise<PhotoResult[]> {
  // Flickr staat een gratis publieke API zonder key toe via feeds
  // Maar met API key krijg je betere resultaten
  const apiKey = process.env.FLICKR_API_KEY?.trim()

  if (apiKey) {
    return searchFlickrAPI(query, apiKey, limit)
  }
  return searchFlickrFeeds(query, limit)
}

async function searchFlickrAPI(query: string, apiKey: string, limit: number): Promise<PhotoResult[]> {
  try {
    const res = await fetch(
      `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&text=${encodeURIComponent(query)}&sort=relevance&content_type=1&media=photos&per_page=${limit}&format=json&nojsoncallback=1&extras=url_m,url_l,owner_name,license`,
      { cache: 'no-store', signal: AbortSignal.timeout(10_000) },
    )
    if (!res.ok) return []

    const json = (await res.json()) as {
      photos?: {
        photo?: Array<{
          url_l?: string; url_m?: string; ownername?: string; title?: string
        }>
      }
    }

    return (json.photos?.photo ?? [])
      .filter((p) => p.url_l || p.url_m)
      .map((p) => ({
        url: (p.url_l ?? p.url_m)!,
        source: 'flickr',
        confidence: 'medium' as const,
        attribution: p.ownername ? `Flickr / ${p.ownername}` : 'Flickr',
      }))
  } catch {
    return []
  }
}

async function searchFlickrFeeds(query: string, limit: number): Promise<PhotoResult[]> {
  try {
    // Flickr public feed — geen API key nodig
    const res = await fetch(
      `https://www.flickr.com/services/feeds/photos_public.gne?tags=${encodeURIComponent(query)}&format=json&nojsoncallback=1&tagmode=all`,
      {
        headers: { 'User-Agent': 'mijn-bnb/1.0' },
        cache: 'no-store',
        signal: AbortSignal.timeout(8_000),
      },
    )
    if (!res.ok) return []

    const json = (await res.json()) as {
      items?: Array<{ media?: { m?: string }; author?: string }>
    }

    return (json.items ?? [])
      .filter((item) => item.media?.m)
      .slice(0, limit)
      .map((item) => {
        // Flickr feed geeft _m (small), vervang naar _b (large)
        const url = item.media!.m!.replace('_m.jpg', '_b.jpg')
        const authorMatch = item.author?.match(/"([^"]*)"/)
        return {
          url,
          source: 'flickr',
          confidence: 'medium' as const,
          attribution: authorMatch ? `Flickr / ${authorMatch[1]}` : 'Flickr',
        }
      })
  } catch {
    return []
  }
}

/* ─── SearXNG (duckduckgo + qwant engines, niet google/bing) ── */

const SEARX_INSTANCES = [
  process.env.SEARXNG_URL,
  'https://searx.be',
  'https://search.sapti.me',
  'https://searx.tiekoetter.com',
  'https://search.mdosch.de',
].filter(Boolean) as string[]

async function searchSearXNG(
  query: string,
  engines?: string,
  limit = 8,
): Promise<PhotoResult[]> {
  for (const instance of SEARX_INSTANCES) {
    try {
      const url = new URL('/search', instance)
      url.searchParams.set('q', query)
      url.searchParams.set('format', 'json')
      url.searchParams.set('categories', 'images')
      // Gebruik engines die ECHT werken: duckduckgo en qwant
      if (engines) url.searchParams.set('engines', engines)
      url.searchParams.set('language', 'nl')
      url.searchParams.set('pageno', '1')

      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'mijn-bnb/1.0 (guest app builder)', Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) continue

      const json = (await res.json()) as {
        results?: Array<{ img_src?: string; url?: string; source?: string }>
      }
      const items = Array.isArray(json.results) ? json.results : []

      const results: PhotoResult[] = items
        .filter((r) => typeof r.img_src === 'string' && r.img_src.startsWith('http'))
        .slice(0, limit)
        .map((r) => {
          const pageUrl = (r.url || '').toLowerCase()
          let source = 'web'
          let confidence: PhotoResult['confidence'] = 'low'

          if (pageUrl.includes('booking.com')) { source = 'booking'; confidence = 'medium' }
          else if (pageUrl.includes('tripadvisor')) { source = 'tripadvisor'; confidence = 'medium' }

          let attribution: string
          try { attribution = new URL(r.url || '').hostname.replace(/^www\./, '') }
          catch { attribution = r.source || 'web' }

          return { url: r.img_src!, source, confidence, attribution }
        })

      if (results.length > 0) return results
    } catch {
      continue
    }
  }
  return []
}

/* ─── Wikimedia Commons tekstzoeken ──────────────────────────── */

async function searchWikimediaText(query: string, limit = 6): Promise<PhotoResult[]> {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json`,
      { headers: { 'User-Agent': 'mijn-bnb/1.0' }, cache: 'no-store', signal: AbortSignal.timeout(10_000) },
    )
    if (!res.ok) return []

    const json = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          { imageinfo?: Array<{ thumburl?: string; extmetadata?: Record<string, { value?: string }> }> }
        >
      }
    }
    const pages = json.query?.pages
    if (!pages) return []

    return Object.values(pages)
      .filter((p) => p.imageinfo?.[0]?.thumburl)
      .map((p) => {
        const info = p.imageinfo![0]
        return {
          url: info.thumburl!,
          source: 'wikimedia',
          confidence: 'high' as const,
          attribution:
            [
              info.extmetadata?.LicenseShortName?.value,
              info.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, '').trim(),
            ]
              .filter(Boolean)
              .join(' — ') || 'Wikimedia',
        }
      })
      .slice(0, limit)
  } catch {
    return []
  }
}

/* ─── Unsplash ───────────────────────────────────────────────── */

async function searchUnsplash(query: string, limit = 4): Promise<PhotoResult[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim()
  if (!key) return []
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' }, cache: 'no-store', signal: AbortSignal.timeout(10_000) },
    )
    if (!res.ok) return []
    const json = (await res.json()) as {
      results?: Array<{ urls?: { regular?: string; small?: string }; user?: { name?: string } }>
    }
    return (json.results ?? [])
      .filter((r) => r.urls?.regular || r.urls?.small)
      .map((r) => ({
        url: (r.urls?.regular ?? r.urls?.small)!,
        source: 'unsplash',
        confidence: 'low' as const,
        attribution: r.user?.name ? `Unsplash / ${r.user.name}` : 'Unsplash',
      }))
  } catch {
    return []
  }
}

/* ─── Pexels ─────────────────────────────────────────────────── */

async function searchPexels(query: string, limit = 4): Promise<PhotoResult[]> {
  const key = process.env.PEXELS_API_KEY?.trim()
  if (!key) return []
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`,
      { headers: { Authorization: key }, cache: 'no-store', signal: AbortSignal.timeout(10_000) },
    )
    if (!res.ok) return []
    const json = (await res.json()) as {
      photos?: Array<{ src?: { medium?: string; large?: string }; photographer?: string }>
    }
    return (json.photos ?? [])
      .filter((p) => p.src?.medium || p.src?.large)
      .map((p) => ({
        url: (p.src?.large ?? p.src?.medium)!,
        source: 'pexels',
        confidence: 'low' as const,
        attribution: p.photographer ? `Pexels / ${p.photographer}` : 'Pexels',
      }))
  } catch {
    return []
  }
}

/* ─── Slimme zoekvarianten genereren (zoals een mens zou doen) ── */

function generateVariants(
  query: string,
  context?: { address?: string; category?: string },
): string[] {
  const variants = [query]
  const city = context?.address?.split(',').slice(-2, -1)[0]?.trim()

  if (city && !query.toLowerCase().includes(city.toLowerCase())) {
    variants.push(`${query} ${city}`)
  }

  variants.push(`${query} foto`)

  if (context?.category === 'restaurant') {
    variants.push(`${query} restaurant`)
  } else if (context?.category === 'tourism') {
    variants.push(`${query} bezienswaardigheid`)
  } else if (context?.category === 'shops') {
    variants.push(`${query} winkel`)
  }

  return Array.from(new Set(variants)).slice(0, 4)
}

/* ─── Eén bron doorzoeken met meerdere varianten ─────────────── */

async function searchSourceWithVariants(
  source: SearchSource,
  variants: string[],
  limit: number,
): Promise<PhotoResult[]> {
  const allResults: PhotoResult[] = []
  const seenUrls = new Set<string>()

  for (const query of variants) {
    if (allResults.length >= limit) break

    let results: PhotoResult[]
    switch (source) {
      case 'duckduckgo':
        results = await searchDuckDuckGo(query, 6)
        break
      case 'flickr':
        results = await searchFlickr(query, 6)
        break
      case 'booking':
        // DuckDuckGo + site:booking.com — werkt veel beter dan Google
        results = await searchDuckDuckGo(`${query} site:booking.com`, 4)
        if (results.length === 0) {
          results = await searchSearXNG(`${query} site:booking.com`, 'duckduckgo images,qwant images', 4)
        }
        results = results.map((r) => ({ ...r, source: 'booking', confidence: 'high' as const }))
        break
      case 'tripadvisor':
        results = await searchDuckDuckGo(`${query} site:tripadvisor.com`, 4)
        if (results.length === 0) {
          results = await searchSearXNG(`${query} site:tripadvisor.com`, 'duckduckgo images,qwant images', 4)
        }
        results = results.map((r) => ({ ...r, source: 'tripadvisor', confidence: 'high' as const }))
        break
      case 'wikimedia':
        results = await searchWikimediaText(query, 4)
        break
      case 'unsplash':
        results = await searchUnsplash(query, 4)
        break
      case 'pexels':
        results = await searchPexels(query, 4)
        break
      default:
        results = []
    }

    for (const r of results) {
      if (!seenUrls.has(r.url)) {
        seenUrls.add(r.url)
        allResults.push(r)
      }
    }
  }

  return allResults.slice(0, limit)
}

/* ─── Route handler ──────────────────────────────────────────── */

export async function POST(req: NextRequest) {

  const body = await req.json()
  const query = typeof body.query === 'string' ? body.query.trim() : ''
  const sources: SearchSource[] = Array.isArray(body.sources) ? body.sources : ['duckduckgo', 'flickr', 'wikimedia']
  const context = body.context as { address?: string; category?: string } | undefined

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Zoekopdracht is te kort.' }, { status: 400 })
  }

  if (query.length > 200) {
    return NextResponse.json({ error: 'Zoekopdracht is te lang.' }, { status: 400 })
  }

  const allowedSources = new Set<SearchSource>([
    'duckduckgo', 'flickr', 'booking', 'tripadvisor', 'wikimedia', 'unsplash', 'pexels',
  ])
  const validSources = sources.filter((s) => allowedSources.has(s))

  if (validSources.length === 0) {
    return NextResponse.json({ error: 'Selecteer minstens één bron.' }, { status: 400 })
  }

  try {
    const variants = generateVariants(query, context)

    // Zoek alle bronnen parallel — zoals iemand die meerdere tabs opent
    const sourceResults = await Promise.all(
      validSources.map(async (source) => ({
        source,
        photos: await searchSourceWithVariants(source, variants, 8),
      })),
    )

    // Merge + deduplicate + interleave (variëteit uit elke bron)
    const seenUrls = new Set<string>()
    const allPhotos: PhotoResult[] = []
    const maxPerSource = Math.max(...sourceResults.map((r) => r.photos.length), 0)

    for (let i = 0; i < maxPerSource; i++) {
      for (const { photos } of sourceResults) {
        if (i < photos.length && !seenUrls.has(photos[i].url)) {
          seenUrls.add(photos[i].url)
          allPhotos.push(photos[i])
        }
      }
    }

    return NextResponse.json({
      photos: allPhotos.slice(0, 24),
      variants,
      sourceCounts: Object.fromEntries(sourceResults.map((r) => [r.source, r.photos.length])),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fout bij slim zoeken.' },
      { status: 500 },
    )
  }
}
