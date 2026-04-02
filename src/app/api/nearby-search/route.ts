import { NextRequest, NextResponse } from 'next/server'
import { fetchBestPlacePhoto } from '@/lib/place-photo-search'
import type { Language } from '@/types'
import type { WizardAddress, WizardCategory, WizardSuggestion } from '@/lib/site-ai'

type NearbyKind = 'restaurant' | 'voorziening' | 'beleving'

type NearbySeed = {
  id: string
  kind: NearbyKind
  name: string
  source: WizardSuggestion['source']
  latitude: number
  longitude: number
  distanceMeters: number
  address: string
  openingHours: string
  contact: string
  tags: string[]
  externalUrl: string
  photo: string
  descriptionByLanguage?: Partial<Record<Language, string>>
  sourceDescription?: string
  wikipediaTag?: string
  wikidataId?: string
  wikimediaCommons?: string
  imageTag?: string
  website?: string
}

type LocationCategory = 'restaurant' | 'tourism' | 'shops'

type StructuredLocation = {
  id: string
  name: string
  category: LocationCategory
  categories?: LocationCategory[]
  address: string
  latitude: number
  longitude: number
  google_maps_link: string
  rating: number | null
  image_reference: string
  distance_from_bnb_km: number
  recommended_for_guests_reason: string
  descriptions: Record<Language, string>
}

type GeocodeResult = {
  formattedAddress: string
  latitude: number
  longitude: number
}

type OverpassElement = {
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export async function POST(req: NextRequest) {
  try {

    const body = await req.json()
    const address = normalizeAddress(body.address)
    const category = body.category as WizardCategory
    const languages = Array.isArray(body.languages)
      ? body.languages.filter((lang: unknown): lang is Language => (
          typeof lang === 'string' && ['nl', 'en', 'de', 'fr'].includes(lang)
        ))
      : []
    const defaultLanguage = body.defaultLanguage as Language
    const appName = typeof body.appName === 'string' ? body.appName.trim() : 'de gastenapp'

    if (!isAddressComplete(address)) {
      return NextResponse.json({ error: 'Vul straat, huisnummer, postcode, plaats en land in.' }, { status: 400 })
    }

    if (!['bnb', 'vakantiehuis', 'stadsgids', 'wellness', 'familie', 'natuur'].includes(category)) {
      return NextResponse.json({ error: 'Ongeldige categorie.' }, { status: 400 })
    }

    if (!languages.length || !['nl', 'en', 'de', 'fr'].includes(defaultLanguage)) {
      return NextResponse.json({ error: 'Ongeldige taalinstellingen.' }, { status: 400 })
    }

    const geocode = await geocodeAddress(address)

    // Eén gecombineerde Overpass query voor alle categorieën (sneller, geen rate limits)
    const warnings: string[] = []
    let rawSeeds: NearbySeed[] = []
    let searchRadius = 3000

    try {
      rawSeeds = await fetchAllNearbyPlaces(geocode.latitude, geocode.longitude, searchRadius)
    } catch (error) {
      warnings.push(normalizeNearbyWarning(error))
    }

    // Adaptieve radius: als te weinig resultaten, probeer groter bereik
    if (rawSeeds.length < 5 && searchRadius < 10000) {
      searchRadius = 10000
      try {
        rawSeeds = await fetchAllNearbyPlaces(geocode.latitude, geocode.longitude, searchRadius)
        if (rawSeeds.length > 0) {
          warnings.push(`Weinig plekken binnen 3 km — zoekgebied vergroot naar ${searchRadius / 1000} km.`)
        }
      } catch {
        // Gebruik wat we al hebben
      }
    }

    if (!rawSeeds.length) {
      warnings.push('Er zijn geen nabijgelegen plekken gevonden via OpenStreetMap. Probeer een ander adres of voeg handmatig locaties toe.')
    }

    // Enrich in batches van 5 om rate limits te respecteren
    const seeds: NearbySeed[] = []
    const enrichBatchSize = 5
    for (let i = 0; i < rawSeeds.length; i += enrichBatchSize) {
      const batch = rawSeeds.slice(i, i + enrichBatchSize)
      const batchResults = await Promise.all(
        batch.map(async (seed) => {
          try {
            return await enrichNearbySeed(seed, languages)
          } catch {
            return {
              ...seed,
              photo: seed.photo || buildPlacePhotoUrl(seed.name, seed.kind, Number(seed.id.replace(/\D+/g, '')) || 0),
            }
          }
        })
      )
      seeds.push(...batchResults)
    }

    let structuredLocations: StructuredLocation[] = []

    try {
      structuredLocations = await generateStructuredLocationData({
        appName,
        address: geocode.formattedAddress,
        latitude: geocode.latitude,
        longitude: geocode.longitude,
        languages,
        places: seeds,
      })
    } catch {
      // AI is optioneel — fallback-locaties zijn al bruikbaar
    }

    const locationsById = Object.fromEntries(
      structuredLocations.map((location) => [location.id, location])
    ) as Record<string, StructuredLocation>

    const fallbackLocations = seeds.map((seed) => buildFallbackLocation(seed, geocode, languages))
    const mergedLocations = fallbackLocations.map((fallback) => ({
      ...fallback,
      ...(locationsById[fallback.id] ?? {}),
      descriptions: {
        ...fallback.descriptions,
        ...(locationsById[fallback.id]?.descriptions ?? {}),
      },
    })).slice(0, 30)

    const suggestions = placeOnMiniMap(
      seeds.map((seed) => {
        const fallbackDescriptions = buildFallbackDescriptions(seed, geocode.formattedAddress, languages)
        const locationData = locationsById[seed.id]

        return {
          id: seed.id,
          kind: seed.kind,
          source: seed.source,
          name: seed.name,
          description: locationData?.descriptions?.[defaultLanguage] ?? fallbackDescriptions[defaultLanguage] ?? '',
          descriptionTranslations: {
            ...fallbackDescriptions,
            ...(locationData?.descriptions ?? {}),
          },
          photo: seed.photo,
          openingHours: seed.openingHours,
          contact: seed.contact,
          counter: Math.max(1, Math.round(seed.distanceMeters / 250)),
          distance: formatDistance(seed.distanceMeters),
          externalUrl: seed.externalUrl,
          selected: true,
          x: 50,
          y: 50,
          latitude: seed.latitude,
          longitude: seed.longitude,
          tags: seed.tags,
        } satisfies WizardSuggestion
      }),
      geocode.latitude,
      geocode.longitude
    )

    return NextResponse.json({
      formattedAddress: geocode.formattedAddress,
      latitude: geocode.latitude,
      longitude: geocode.longitude,
      locations: mergedLocations,
      suggestions,
      notice: `${suggestions.length} echte plekken gevonden rond ${geocode.formattedAddress}.`,
      warnings,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Zoeken in de omgeving is mislukt.' },
      { status: 500 }
    )
  }
}

function normalizeAddress(value: unknown): WizardAddress {
  if (!value || typeof value !== 'object') {
    return { street: '', houseNumber: '', postalCode: '', city: '', country: 'Nederland' }
  }

  const address = value as Partial<WizardAddress>

  return {
    street: address.street?.trim() ?? '',
    houseNumber: address.houseNumber?.trim() ?? '',
    postalCode: address.postalCode?.trim() ?? '',
    city: address.city?.trim() ?? '',
    country: address.country?.trim() ?? 'Nederland',
    formatted: address.formatted?.trim(),
    latitude: address.latitude,
    longitude: address.longitude,
  }
}

function isAddressComplete(address: WizardAddress) {
  return Boolean(address.street && address.houseNumber && address.postalCode && address.city && address.country)
}

function formatAddress(address: WizardAddress) {
  const lineOne = [address.street, address.houseNumber].filter(Boolean).join(' ')
  const lineTwo = [address.postalCode, address.city].filter(Boolean).join(' ')
  return [lineOne, lineTwo, address.country].filter(Boolean).join(', ')
}

async function geocodeAddress(address: WizardAddress): Promise<GeocodeResult> {
  const query = encodeURIComponent(formatAddress(address))
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${query}`, {
    headers: {
      'User-Agent': 'mijn-bnb/1.0 (guest app builder)',
      'Accept-Language': 'nl,en;q=0.8',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error('Adres kon niet worden opgezocht via OpenStreetMap.')
  }

  const json = await response.json() as Array<{ lat: string; lon: string; display_name: string }>
  const first = json[0]

  if (!first) {
    throw new Error('Geen coördinaten gevonden voor dit adres.')
  }

  return {
    formattedAddress: first.display_name,
    latitude: Number(first.lat),
    longitude: Number(first.lon),
  }
}

async function fetchAllNearbyPlaces(latitude: number, longitude: number, radius: number): Promise<NearbySeed[]> {
  const query = buildCombinedOverpassQuery(latitude, longitude, radius)
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ]

  let lastError: string | null = null

  for (const endpoint of endpoints) {
    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'mijn-bnb/1.0 (guest app builder)',
        },
        body: `data=${encodeURIComponent(query)}`,
        cache: 'no-store',
        signal: AbortSignal.timeout(100_000),
      })
    } catch {
      lastError = `OpenStreetMap endpoint ${new URL(endpoint).hostname} reageerde niet op tijd.`
      continue
    }

    if (!response.ok) {
      if (response.status === 429 || response.status === 504) {
        lastError = 'OpenStreetMap is tijdelijk druk. Probeer het opnieuw.'
        continue
      }
      lastError = `OpenStreetMap gaf status ${response.status}.`
      continue
    }

    let json: { elements?: OverpassElement[], remark?: string }
    try {
      json = await response.json() as { elements?: OverpassElement[], remark?: string }
    } catch {
      lastError = 'OpenStreetMap antwoord kon niet worden gelezen.'
      continue
    }
    const elements = json.elements ?? []

    // Als Overpass een timeout/memory-remark geeft maar geen resultaten
    if (elements.length === 0 && json.remark) {
      const remark = json.remark.toLowerCase()
      if (remark.includes('timeout') || remark.includes('memory') || remark.includes('rate_limit')) {
        lastError = `OpenStreetMap server te druk of query te zwaar (${new URL(endpoint).hostname}). Probeer het opnieuw.`
        continue
      }
    }

    const allSeeds = elements
      .map((element) => mapOverpassElementCombined(element, latitude, longitude))
      .filter((item): item is NearbySeed => Boolean(item))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)

    // Verdeel eerlijk: max 10 per categorie, totaal max 30
    const byKind: Record<NearbyKind, NearbySeed[]> = { restaurant: [], voorziening: [], beleving: [] }
    for (const seed of allSeeds) {
      if (byKind[seed.kind].length < 10) {
        byKind[seed.kind].push(seed)
      }
    }
    return [...byKind.restaurant, ...byKind.voorziening, ...byKind.beleving]
  }

  throw new Error(lastError ?? 'OpenStreetMap gaf een fout bij het ophalen van plekken.')
}

function buildCombinedOverpassQuery(latitude: number, longitude: number, radius: number) {
  const r = `around:${radius},${latitude},${longitude}`
  // "node" voor amenities/shops (lichtgewicht), "nwr" alleen voor parken/monumenten
  // die als way/relation zijn opgeslagen. Alles gefilterd op "name".
  // maxsize 64MB & timeout 90s om grote steden (Amsterdam, Parijs) aan te kunnen.
  return [
    '[out:json][timeout:90][maxsize:67108864];(',
    // Restaurants, cafés, bars — node is genoeg (POI's)
    `node["amenity"~"restaurant|cafe|fast_food|bar|pub|biergarten|ice_cream"]["name"](${r});`,
    // Winkels & voorzieningen — node
    `node["shop"~"supermarket|convenience|bakery|greengrocer|butcher|deli|general|organic|farm"]["name"](${r});`,
    `node["amenity"~"pharmacy|fuel"]["name"](${r});`,
    // Toerisme — node + way (attracties/musea kunnen ways zijn)
    `node["tourism"~"attraction|museum|gallery|viewpoint|zoo|theme_park|artwork"]["name"](${r});`,
    `way["tourism"~"attraction|museum|gallery|zoo|theme_park"]["name"](${r});`,
    // Parken & recreatie — way/relation (parken zijn altijd vlakken)
    `nwr["leisure"~"park|nature_reserve|garden|swimming_pool|sports_centre|marina"]["name"](${r});`,
    // Historisch — node + way
    `node["historic"~"monument|castle|memorial|ruins|archaeological_site"]["name"](${r});`,
    `way["historic"~"castle|ruins|archaeological_site"]["name"](${r});`,
    // Theater, bioscoop, bibliotheek — node
    `node["amenity"~"theatre|cinema|library|marketplace"]["name"](${r});`,
    ');out center tags;',
  ].join('')
}

function classifyOverpassElement(tags: Record<string, string>): NearbyKind {
  const amenity = tags.amenity ?? ''
  const shop = tags.shop ?? ''
  const tourism = tags.tourism ?? ''
  const leisure = tags.leisure ?? ''
  const historic = tags.historic ?? ''

  if (/restaurant|cafe|fast_food|bar|pub|biergarten|ice_cream/.test(amenity)) return 'restaurant'
  if (shop || amenity === 'pharmacy' || amenity === 'fuel') return 'voorziening'
  if (tourism || leisure || historic || amenity === 'theatre' || amenity === 'cinema' || amenity === 'library' || amenity === 'marketplace') return 'beleving'
  return 'beleving'
}

function mapOverpassElementCombined(
  element: OverpassElement,
  originLatitude: number,
  originLongitude: number
): NearbySeed | null {
  const tags = element.tags ?? {}
  const latitude = element.lat ?? element.center?.lat
  const longitude = element.lon ?? element.center?.lon
  const name = tags.name?.trim()

  if (!latitude || !longitude || !name) return null

  const kind = classifyOverpassElement(tags)
  const address = [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']]
    .filter(Boolean)
    .join(' ')
    .trim()

  const distanceMeters = getDistanceMeters(originLatitude, originLongitude, latitude, longitude)
  const baseQuery = encodeURIComponent([name, address].filter(Boolean).join(', '))
  const tagValues = [
    tags.cuisine,
    tags.shop,
    tags.tourism,
    tags.leisure,
    tags.amenity,
    tags.historic,
  ].filter(Boolean)

  return {
    id: `${kind}-${element.id}`,
    kind,
    name,
    source: 'openstreetmap',
    latitude,
    longitude,
    distanceMeters,
    address,
    openingHours: tags.opening_hours ?? 'Controleer openingstijden online',
    contact: tags.phone ?? tags.website ?? tags['contact:website'] ?? (address || 'Geen contactgegevens gevonden'),
    tags: Array.from(new Set(tagValues.map(cleanTagValue))).slice(0, 3),
    externalUrl: `https://www.google.com/maps/search/?api=1&query=${baseQuery}`,
    photo: '',
    descriptionByLanguage: extractTagDescriptions(tags),
    sourceDescription: tags['description'] ?? tags['description:nl'] ?? tags['description:en'] ?? '',
    wikipediaTag: tags.wikipedia,
    wikidataId: tags.wikidata,
    wikimediaCommons: tags.wikimedia_commons,
    imageTag: tags.image,
    website: tags.website ?? tags['contact:website'] ?? '',
  }
}

function extractTagDescriptions(tags: Record<string, string>) {
  const descriptions: Partial<Record<Language, string>> = {}

  for (const lang of ['nl', 'en', 'de', 'fr'] as Language[]) {
    const value = tags[`description:${lang}`]?.trim()
    if (value) descriptions[lang] = value
  }

  const genericDescription = tags.description?.trim()
  if (genericDescription) {
    for (const lang of ['nl', 'en', 'de', 'fr'] as Language[]) {
      descriptions[lang] ??= genericDescription
    }
  }

  return descriptions
}

async function enrichNearbySeed(seed: NearbySeed, languages: Language[]): Promise<NearbySeed> {
  let photo = resolveImageUrl(seed.imageTag) || resolveWikimediaCommonsImage(seed.imageTag) || resolveWikimediaCommonsImage(seed.wikimediaCommons) || ''
  let descriptionByLanguage = { ...(seed.descriptionByLanguage ?? {}) }

  if (seed.wikidataId) {
    const wikidata = await fetchWikidataDetails(seed.wikidataId, languages)
    descriptionByLanguage = {
      ...wikidata.descriptions,
      ...descriptionByLanguage,
    }
    photo ||= wikidata.photo
  }

  if (seed.wikipediaTag) {
    const wikipedia = await fetchWikipediaTagDetails(seed.wikipediaTag)
    descriptionByLanguage = {
      ...wikipedia.descriptions,
      ...descriptionByLanguage,
    }
    photo ||= wikipedia.photo
  }

  if (!Object.keys(descriptionByLanguage).length && seed.sourceDescription?.trim()) {
    for (const lang of languages) {
      descriptionByLanguage[lang] = seed.sourceDescription.trim()
    }
  }

  photo ||= await fetchBestPlacePhoto({
    name: seed.name,
    address: seed.address,
    tags: seed.tags,
    kind: seed.kind,
  })
  photo ||= buildPlacePhotoUrl(seed.name, seed.kind, Number(seed.id.replace(/\D+/g, '')) || 0)

  return {
    ...seed,
    photo,
    descriptionByLanguage,
  }
}

async function fetchWikidataDetails(wikidataId: string, languages: Language[]) {
  const response = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(wikidataId)}.json`, {
    headers: {
      'User-Agent': 'mijn-bnb/1.0 (guest app builder)',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  })

  if (!response.ok) {
    return { descriptions: {} as Partial<Record<Language, string>>, photo: '' }
  }

  const json = await response.json() as {
    entities?: Record<string, {
      sitelinks?: Partial<Record<'nlwiki' | 'enwiki' | 'dewiki' | 'frwiki', { title?: string }>>
      claims?: { P18?: Array<{ mainsnak?: { datavalue?: { value?: string } } }> }
    }>
  }

  const entity = json.entities?.[wikidataId]
  if (!entity) {
    return { descriptions: {} as Partial<Record<Language, string>>, photo: '' }
  }

  const photoClaim = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value
  const photo = typeof photoClaim === 'string' ? resolveWikimediaCommonsImage(`File:${photoClaim}`) ?? '' : ''
  const descriptions: Partial<Record<Language, string>> = {}

  await Promise.all(
    languages.map(async (lang) => {
      const wikiKey = `${lang}wiki` as const
      const title = entity.sitelinks?.[wikiKey]?.title
      if (!title) return
      const summary = await fetchWikipediaSummary(lang, title)
      if (summary.description) descriptions[lang] = summary.description
    })
  )

  return { descriptions, photo }
}

async function fetchWikipediaTagDetails(wikipediaTag: string) {
  const match = wikipediaTag.match(/^([a-z-]+):(.*)$/i)
  if (!match) return { descriptions: {} as Partial<Record<Language, string>>, photo: '' }

  const [, sourceLang, rawTitle] = match
  const title = rawTitle.trim()
  if (!title) return { descriptions: {} as Partial<Record<Language, string>>, photo: '' }

  const mappedLang = (['nl', 'en', 'de', 'fr'] as Language[]).includes(sourceLang as Language)
    ? (sourceLang as Language)
    : 'en'
  const summary = await fetchWikipediaSummary(mappedLang, title)

  return {
    descriptions: summary.description ? { [mappedLang]: summary.description } : {},
    photo: summary.photo,
  }
}

async function fetchWikipediaSummary(lang: Language, title: string) {
  const response = await fetch(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    {
      headers: {
        'User-Agent': 'mijn-bnb/1.0 (guest app builder)',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    }
  )

  if (!response.ok) {
    return { description: '', photo: '' }
  }

  const json = await response.json() as { extract?: string; thumbnail?: { source?: string } }
  return {
    description: typeof json.extract === 'string' ? shortenLocationDescription(json.extract) : '',
    photo: typeof json.thumbnail?.source === 'string' ? json.thumbnail.source : '',
  }
}

function shortenLocationDescription(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''

  const sentences = normalized.match(/[^.!?]+[.!?]?/g)?.map((item) => item.trim()).filter(Boolean) ?? [normalized]
  const shortText = sentences.slice(0, 2).join(' ').trim()
  return shortText.length > 280 ? `${shortText.slice(0, 277).trimEnd()}...` : shortText
}

function resolveImageUrl(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return ''
}

function resolveWikimediaCommonsImage(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return ''

  const normalized = trimmed.startsWith('File:') ? trimmed.slice(5) : trimmed
  if (!normalized || normalized.startsWith('Category:')) return ''
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(normalized.replace(/ /g, '_'))}`
}

function buildFallbackDescriptions(
  place: NearbySeed,
  formattedAddress: string,
  languages: Language[]
): Partial<Record<Language, string>> {
  const tagText = place.tags.length ? place.tags.join(', ') : place.kind === 'restaurant' ? 'eten in de buurt' : place.kind === 'voorziening' ? 'handige boodschappen' : 'iets leuks om te doen'
  const base = {
    nl: `${place.name} ligt op ${formatDistance(place.distanceMeters)} van ${formattedAddress} en is handig voor gasten die ${tagText} zoeken.`,
    en: `${place.name} is ${formatDistance(place.distanceMeters)} from ${formattedAddress} and is a practical choice for guests looking for ${tagText}.`,
    de: `${place.name} liegt ${formatDistance(place.distanceMeters)} von ${formattedAddress} entfernt und ist praktisch für Gäste, die ${tagText} suchen.`,
    fr: `${place.name} se trouve à ${formatDistance(place.distanceMeters)} de ${formattedAddress} et convient bien aux voyageurs qui recherchent ${tagText}.`,
  } satisfies Record<Language, string>

  return Object.fromEntries(
    languages.map((lang) => [
      lang,
      place.descriptionByLanguage?.[lang]
        ?? place.descriptionByLanguage?.nl
        ?? place.descriptionByLanguage?.en
        ?? base[lang],
    ])
  )
}

async function generateStructuredLocationData(input: {
  appName: string
  address: string
  latitude: number
  longitude: number
  languages: Language[]
  places: NearbySeed[]
}) {
  const token = process.env.HUGGINGFACE_API_TOKEN
  const model = process.env.HUGGINGFACE_MODEL ?? 'meta-llama/Llama-3.1-8B-Instruct:cerebras'

  if (!token) {
    throw new Error('AI-location output is overgeslagen omdat de Hugging Face token ontbreekt.')
  }

  const languageNames: Record<Language, string> = {
    nl: 'Dutch',
    en: 'English',
    de: 'German',
    fr: 'French',
  }

  const prompt = [
    'You are an AI module integrated inside an existing BNB Stay App Builder.',
    'Your task is to generate structured location data that will be used inside the builder wizard where the user can select places to include in the app.',
    'This is an ADD-ON feature for the builder, so the output must be clean, structured, and consistent.',
    '',
    `BNB Location:`,
    `Address: ${input.address}`,
    `Latitude: ${input.latitude}`,
    `Longitude: ${input.longitude}`,
    '',
    'Search radius:',
    'Maximum 5 km',
    '',
    'Return:',
    'Maximum 30 locations.',
    '',
    'The results must be useful for guests staying in a BNB.',
    '',
    'Allowed categories:',
    'restaurant',
    'tourism',
    'shops',
    '',
    'Category definitions:',
    'restaurant = restaurants, cafes, breakfast places, lunch spots, bars',
    'tourism = attractions, parks, museums, sightseeing, landmarks, activities',
    'shops = supermarkets, bakeries, pharmacies, local stores, convenience shops',
    '',
    'Important:',
    'The builder user will choose which places to include, so return a good mix of places across categories.',
    '',
    'For each location generate:',
    'id',
    'name',
    'category',
    'address',
    'latitude',
    'longitude',
    'google_maps_link',
    'rating (if available)',
    'image_reference (if available)',
    'distance_from_bnb_km',
    'recommended_for_guests_reason',
    '',
    'Descriptions must be short and suitable for a travel app.',
    'If source descriptions are present, stay close to those facts and wording.',
    '',
    'Create the description in FOUR languages:',
    'nl',
    'en',
    'de',
    'fr',
    '',
    'Description rules:',
    'Maximum 2 sentences',
    'Clear and friendly for travelers',
    'Highlight why the place is good for BNB guests',
    'Do not translate the place name',
    'Keep translations natural',
    '',
    'Output must be valid JSON.',
    '',
    'Structure:',
    '{"locations":[{"id":"unique_id","name":"Location name","category":"restaurant | tourism | shops","address":"Full address","latitude":0.000,"longitude":0.000,"google_maps_link":"","rating":4.5,"distance_from_bnb_km":0.8,"image_reference":"","recommended_for_guests_reason":"Short reason","descriptions":{"nl":"","en":"","de":"","fr":""}}]}',
    '',
    'Quality rules:',
    'Return only real places that tourists would visit.',
    'Avoid duplicates.',
    'Avoid irrelevant businesses.',
    'Prefer popular and highly rated places.',
    'Prefer places close to the BNB.',
    '',
    'Make sure the data is clean so it can be directly used inside an app builder wizard where the user selects locations per category.',
    '',
    `Languages requested: ${input.languages.map((lang) => languageNames[lang]).join(', ')}.`,
    'Candidate places (use only these real places, enrich and classify them correctly):',
    JSON.stringify(
      input.places.slice(0, 20).map((place) => ({
        id: place.id,
        category_hint: mapSeedKindToLocationCategory(place.kind),
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        distance_from_bnb_km: roundDistanceKm(place.distanceMeters),
        tags: place.tags.slice(0, 3),
      }))
    ),
  ].join('\n')

  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'Return only valid JSON matching the requested schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 8000,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(60_000),
  })

  const json = await response.json()
  if (!response.ok) {
    const message =
      typeof json?.error?.message === 'string'
        ? json.error.message
        : typeof json?.error === 'string'
          ? json.error
          : 'AI-location output kon niet worden gemaakt.'
    throw new Error(message)
  }

  const content = typeof json?.choices?.[0]?.message?.content === 'string'
    ? json.choices[0].message.content
    : Array.isArray(json?.choices?.[0]?.message?.content)
      ? json.choices[0].message.content.map((item: { text?: string }) => item.text ?? '').join('\n')
      : ''

  const parsed = parseStructuredLocationsPayload(content)

  return (parsed.locations ?? [])
    .filter((item) => typeof item.id === 'string')
    .map((item) => sanitizeStructuredLocation(item, input.languages))
}

function parseStructuredLocationsPayload(value: string): {
  locations?: Array<Partial<StructuredLocation> & { id: string }>
} {
  const rawJson = extractJsonObject(value)
  const candidates = [rawJson, repairCommonJsonIssues(rawJson)]
  let lastError: unknown = null

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as {
        locations?: Array<Partial<StructuredLocation> & { id: string }>
      }
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(
    lastError instanceof Error
      ? 'AI gaf ongeldige JSON terug voor nearby-locaties. De standaard nearby-data wordt gebruikt.'
      : 'AI gaf geen bruikbare JSON terug voor nearby-locaties.'
  )
}

function extractJsonObject(value: string) {
  const cleaned = value.trim().replace(/^```json\s*|```$/g, '')
  const firstBracket = cleaned.indexOf('{')
  const lastBracket = cleaned.lastIndexOf('}')
  if (firstBracket === -1 || lastBracket === -1) {
    throw new Error('AI gaf geen bruikbare JSON terug voor nearby-locaties.')
  }
  return cleaned.slice(firstBracket, lastBracket + 1)
}

function repairCommonJsonIssues(value: string) {
  let repaired = value
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")

  // Probeer afgekapte JSON te repareren (als max_tokens bereikt is)
  const openBraces = (repaired.match(/\{/g) || []).length
  const closeBraces = (repaired.match(/\}/g) || []).length
  const openBrackets = (repaired.match(/\[/g) || []).length
  const closeBrackets = (repaired.match(/\]/g) || []).length

  // Verwijder incomplete entries aan het einde
  repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*[^}\]]*$/, '')
  repaired = repaired.replace(/,\s*\{[^}]*$/, '')
  repaired = repaired.replace(/,\s*$/, '')

  // Sluit ontbrekende brackets/braces
  for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']'
  for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}'

  return repaired
}

function sanitizeStructuredLocation(
  item: Partial<StructuredLocation> & { id: string },
  languages: Language[]
): StructuredLocation {
  const categories = Array.isArray(item.categories)
    ? item.categories.filter((category): category is LocationCategory => (
      category === 'restaurant' || category === 'tourism' || category === 'shops'
    ))
    : []
  const primaryCategory = item.category === 'restaurant' || item.category === 'tourism' || item.category === 'shops'
    ? item.category
    : categories[0] ?? 'tourism'

  const safeDescriptions = Object.fromEntries(
    (['nl', 'en', 'de', 'fr'] as Language[]).map((lang) => [
      lang,
      typeof item.descriptions?.[lang] === 'string' ? item.descriptions[lang]! : '',
    ])
  ) as Record<Language, string>

  return {
    id: item.id,
    name: typeof item.name === 'string' ? item.name : item.id,
    category: primaryCategory,
    categories: Array.from(new Set([primaryCategory, ...categories])),
    address: typeof item.address === 'string' ? item.address : '',
    latitude: typeof item.latitude === 'number' ? item.latitude : 0,
    longitude: typeof item.longitude === 'number' ? item.longitude : 0,
    google_maps_link: typeof item.google_maps_link === 'string' ? item.google_maps_link : '',
    rating: typeof item.rating === 'number' ? item.rating : null,
    image_reference: typeof item.image_reference === 'string' ? item.image_reference : '',
    distance_from_bnb_km: typeof item.distance_from_bnb_km === 'number' ? item.distance_from_bnb_km : 0,
    recommended_for_guests_reason: typeof item.recommended_for_guests_reason === 'string' ? item.recommended_for_guests_reason : '',
    descriptions: {
      nl: safeDescriptions.nl,
      en: safeDescriptions.en,
      de: safeDescriptions.de,
      fr: safeDescriptions.fr,
    },
  }
}

function buildFallbackLocation(
  seed: NearbySeed,
  geocode: GeocodeResult,
  languages: Language[]
): StructuredLocation {
  const descriptions = buildFallbackDescriptions(seed, geocode.formattedAddress, languages)
  return {
    id: seed.id,
    name: seed.name,
    category: mapSeedKindToLocationCategory(seed.kind),
    categories: [mapSeedKindToLocationCategory(seed.kind)],
    address: seed.address,
    latitude: seed.latitude,
    longitude: seed.longitude,
    google_maps_link: seed.externalUrl,
    rating: null,
    image_reference: seed.photo,
    distance_from_bnb_km: roundDistanceKm(seed.distanceMeters),
    recommended_for_guests_reason: buildRecommendedReason(seed),
    descriptions: {
      nl: descriptions.nl ?? '',
      en: descriptions.en ?? '',
      de: descriptions.de ?? '',
      fr: descriptions.fr ?? '',
    },
  }
}

function buildRecommendedReason(seed: NearbySeed) {
  if (seed.kind === 'restaurant') return 'Handig voor ontbijt, lunch of diner dicht bij het verblijf.'
  if (seed.kind === 'voorziening') return 'Praktisch voor boodschappen en dagelijkse benodigdheden tijdens het verblijf.'
  return 'Leuk om de omgeving te ontdekken zonder ver te reizen vanaf de BnB.'
}

function normalizeNearbyWarning(reason: unknown) {
  if (reason instanceof Error) {
    if (reason.message.includes('Failed to fetch')) {
      return 'Een deel van de live bronnen reageerde niet. De gevonden plekken zijn wel geladen.'
    }
    return reason.message
  }

  return 'Een deel van de nearby-resultaten kon niet worden opgehaald.'
}

function buildGeneratedNearbySeeds(
  geocode: GeocodeResult,
  address: WizardAddress,
  category: WizardCategory
): NearbySeed[] {
  const areaName = address.city?.trim() || geocode.formattedAddress.split(',')[0]?.trim() || 'de buurt'
  const formattedAddress = formatAddress(address) || geocode.formattedAddress
  const generated = [
    ...buildKindFallbackSeeds('restaurant', areaName, formattedAddress, geocode, [
      `${areaName} Bistro`,
      `Restaurant bij ${areaName}`,
      `${areaName} Lunch & Diner`,
    ]),
    ...buildKindFallbackSeeds('voorziening', areaName, formattedAddress, geocode, [
      `${areaName} Dorpswinkel`,
      `Supermarkt ${areaName}`,
      `${areaName} Bakkerij`,
    ]),
    ...buildKindFallbackSeeds('beleving', areaName, formattedAddress, geocode, buildExperienceNames(areaName, category)),
  ]

  return generated
}

function buildKindFallbackSeeds(
  kind: NearbyKind,
  areaName: string,
  formattedAddress: string,
  geocode: GeocodeResult,
  names: string[]
): NearbySeed[] {
  return names.map((name, index) => {
    const distanceMeters = 450 + index * 650
    const latitudeOffset = 0.0032 + index * 0.0014
    const longitudeOffset = 0.0026 + index * 0.0011
    const latitude = geocode.latitude + (index % 2 === 0 ? latitudeOffset : -latitudeOffset)
    const longitude = geocode.longitude + (index % 2 === 0 ? longitudeOffset : -longitudeOffset)
    const baseQuery = encodeURIComponent(`${name}, ${areaName}`)

    return {
      id: `generated-${kind}-${index + 1}`,
      kind,
      name,
      source: 'openstreetmap',
      latitude,
      longitude,
      distanceMeters,
      address: formattedAddress,
      openingHours: kind === 'restaurant' ? 'Bekijk actuele openingstijden online' : 'Controleer online voor actuele openingstijden',
      contact: `Bekijk ${name} online`,
      tags: buildFallbackTags(kind, areaName),
      externalUrl: `https://www.google.com/maps/search/?api=1&query=${baseQuery}`,
      photo: '',
      descriptionByLanguage: {},
      sourceDescription: '',
      website: '',
    }
  })
}

function buildExperienceNames(areaName: string, category: WizardCategory) {
  if (category === 'wellness') {
    return [
      `Wellness wandeling ${areaName}`,
      `${areaName} rustpunt`,
      `Ontspannen route in ${areaName}`,
    ]
  }

  if (category === 'familie') {
    return [
      `Familie-uitje ${areaName}`,
      `Speelplek in ${areaName}`,
      `${areaName} gezinsroute`,
    ]
  }

  if (category === 'natuur') {
    return [
      `Natuurroute ${areaName}`,
      `${areaName} wandelpad`,
      `Uitzichtpunt ${areaName}`,
    ]
  }

  return [
    `Wandelroute ${areaName}`,
    `${areaName} bezienswaardigheid`,
    `Leuke stop in ${areaName}`,
  ]
}

function buildFallbackTags(kind: NearbyKind, areaName: string) {
  if (kind === 'restaurant') return ['eten', 'diner', areaName]
  if (kind === 'voorziening') return ['boodschappen', 'winkel', areaName]
  return ['uitje', 'omgeving', areaName]
}

function mapSeedKindToLocationCategory(kind: NearbyKind): LocationCategory {
  if (kind === 'restaurant') return 'restaurant'
  if (kind === 'voorziening') return 'shops'
  return 'tourism'
}

function roundDistanceKm(distanceMeters: number) {
  return Math.round((distanceMeters / 1000) * 10) / 10
}

function placeOnMiniMap(suggestions: WizardSuggestion[], originLatitude: number, originLongitude: number) {
  const latSpread = Math.max(...suggestions.map((item) => Math.abs((item.latitude ?? originLatitude) - originLatitude)), 0.0035)
  const lonSpread = Math.max(...suggestions.map((item) => Math.abs((item.longitude ?? originLongitude) - originLongitude)), 0.0035)

  return suggestions.map((item) => {
    const latitude = item.latitude ?? originLatitude
    const longitude = item.longitude ?? originLongitude

    const x = 50 + ((longitude - originLongitude) / lonSpread) * 32
    const y = 50 - ((latitude - originLatitude) / latSpread) * 32

    return {
      ...item,
      x: clamp(x, 10, 90),
      y: clamp(y, 14, 86),
    }
  })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function cleanTagValue(value: string) {
  return value.replace(/_/g, ' ')
}

function buildPlacePhotoUrl(name: string, kind: NearbyKind, id: number) {
  return `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80&sig=${encodeURIComponent(`${name}-${kind}-${id}`)}`
}

function formatDistance(distanceMeters: number) {
  return distanceMeters >= 1000
    ? `${(distanceMeters / 1000).toFixed(1).replace('.', ',')} km`
    : `${Math.round(distanceMeters)} m`
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const earthRadius = 6371000
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
