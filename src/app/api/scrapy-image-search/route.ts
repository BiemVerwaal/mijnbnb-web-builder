import { NextRequest, NextResponse } from 'next/server'

const SCRAPY_BACKEND_URL = process.env.SCRAPY_BACKEND_URL ?? 'http://localhost:5000'

export async function POST(req: NextRequest) {

  const body = await req.json().catch(() => ({}))
  const location = typeof body?.location === 'string' ? body.location.trim() : ''
  const source = typeof body?.source === 'string' ? body.source.trim().toLowerCase() : 'auto'
  const allowedSources = new Set(['auto', 'wikimedia', 'bing', 'tripadvisor', 'booking', 'natuurhuisje'])
  const finalSource = allowedSources.has(source) ? source : 'auto'

  let maxResults = Number(body?.max_results ?? 20)
  if (!Number.isFinite(maxResults) || maxResults < 1) maxResults = 1
  if (maxResults > 100) maxResults = 100

  if (!location || location.length < 2) {
    return NextResponse.json({ error: 'Voer een locatienaam in van minimaal 2 tekens.' }, { status: 400 })
  }

  if (location.length > 200) {
    return NextResponse.json({ error: 'Locatienaam is te lang.' }, { status: 400 })
  }

  try {
    const response = await fetch(`${SCRAPY_BACKEND_URL}/api/location-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, max_results: maxResults, source: finalSource }),
      signal: AbortSignal.timeout(40_000),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Backend fout.' }))
      return NextResponse.json({ error: err.error ?? 'Backend fout.' }, { status: 502 })
    }

    const data = await response.json()
    return NextResponse.json({ images: data.images ?? [], location: data.location, count: data.count ?? 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'De Scrapy backend is niet bereikbaar. Start de backend via start.bat en probeer opnieuw.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Er is een fout opgetreden bij het zoeken.' }, { status: 500 })
  }
}
