type PlacePhotoSearchInput = {
  name: string
  address?: string
  tags?: string[]
  kind: string
}

export async function fetchBestPlacePhoto(input: PlacePhotoSearchInput) {
  const suggestions = await fetchPlacePhotoSuggestions(input, 1)
  return suggestions[0] ?? ''
}

export async function fetchPlacePhotoSuggestions(input: PlacePhotoSearchInput, limit = 6) {
  const queries = buildPhotoQueries(input)
  if (!queries.length) return []

  const results: string[] = []

  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY?.trim()
  if (unsplashAccessKey) {
    results.push(...await fetchUnsplashPhotos(queries, unsplashAccessKey, limit))
  }

  const pexelsApiKey = process.env.PEXELS_API_KEY?.trim()
  if (pexelsApiKey && results.length < limit) {
    results.push(...await fetchPexelsPhotos(queries, pexelsApiKey, limit - results.length))
  }

  return Array.from(new Set(results)).slice(0, limit)
}

function buildPhotoQueries(input: PlacePhotoSearchInput) {
  const addressBase = input.address?.split(',')[0]?.trim() ?? ''
  const cleanedTags = (input.tags ?? []).map((tag) => cleanTagValue(tag)).filter(Boolean)
  const firstTag = cleanedTags[0] ?? ''
  const placeType = mapPlaceKindToPhotoTerm(input.kind)
  const cityHints = (input.address ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3)

  const rawQueries = [
    `${input.name} ${placeType}`.trim(),
    `${input.name} ${addressBase}`.trim(),
    `${input.name} ${firstTag}`.trim(),
    `${addressBase} ${placeType}`.trim(),
    `${cityHints.join(' ')} ${placeType}`.trim(),
    `${cleanedTags.slice(0, 2).join(' ')} ${placeType}`.trim(),
    placeType,
  ]

  return Array.from(
    new Set(
      rawQueries
        .map((query) => query.replace(/\s+/g, ' ').trim())
        .filter((query) => query.length >= 3)
    )
  ).slice(0, 6)
}

function mapPlaceKindToPhotoTerm(kind: string) {
  switch (kind) {
    case 'restaurant':
      return 'restaurant exterior'
    case 'voorziening':
    case 'shops':
      return 'local shop storefront'
    case 'beleving':
    case 'tourism':
      return 'local attraction'
    default:
      return 'place'
  }
}

async function fetchUnsplashPhotos(queries: string[], accessKey: string, limit: number) {
  const results: string[] = []

  for (const query of queries) {
    if (results.length >= limit) break

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${Math.min(6, limit)}&orientation=landscape&content_filter=high`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
            'Accept-Version': 'v1',
          },
          cache: 'no-store',
        }
      )

      if (!response.ok) continue

      const json = await response.json() as {
        results?: Array<{ urls?: { regular?: string; small?: string } }>
      }

      results.push(
        ...(json.results ?? [])
          .map((item) => item.urls?.regular ?? item.urls?.small ?? '')
          .filter(Boolean)
      )
    } catch {
      continue
    }
  }

  return Array.from(new Set(results)).slice(0, limit)
}

async function fetchPexelsPhotos(queries: string[], apiKey: string, limit: number) {
  const results: string[] = []

  for (const query of queries) {
    if (results.length >= limit) break

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${Math.min(6, limit)}&orientation=landscape`,
        {
          headers: {
            Authorization: apiKey,
          },
          cache: 'no-store',
        }
      )

      if (!response.ok) continue

      const json = await response.json() as {
        photos?: Array<{ src?: { large?: string; medium?: string } }>
      }

      results.push(
        ...(json.photos ?? [])
          .map((item) => item.src?.large ?? item.src?.medium ?? '')
          .filter(Boolean)
      )
    } catch {
      continue
    }
  }

  return Array.from(new Set(results)).slice(0, limit)
}

function cleanTagValue(value: string) {
  return value.replace(/_/g, ' ')
}
