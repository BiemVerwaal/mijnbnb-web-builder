import { NextRequest, NextResponse } from 'next/server'
import { generateHTML } from '@/lib/template-engine'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, slug, site_data } = body

  if (!site_data) {
    return NextResponse.json({ error: 'site_data is verplicht' }, { status: 400 })
  }

  const html = generateHTML({ name: name ?? 'Mijn BnB', slug: slug ?? '', site_data })

  return NextResponse.json({ html, success: true })
}
