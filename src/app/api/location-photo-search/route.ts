import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchPlacePhotoSuggestions } from '@/lib/place-photo-search'

const PhotoSearchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(240).optional(),
  category: z.enum(['restaurant', 'tourism', 'shops']),
  tags: z.array(z.string().trim().min(1).max(60)).max(8).optional(),
})

export async function POST(req: NextRequest) {

  const body = await req.json()
  const parsed = PhotoSearchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Ongeldige fotozoekopdracht.' }, { status: 400 })
  }

  const photos = await fetchPlacePhotoSuggestions({
    name: parsed.data.name,
    address: parsed.data.address,
    tags: parsed.data.tags,
    kind: parsed.data.category,
  }, 6)

  return NextResponse.json({ photos })
}
