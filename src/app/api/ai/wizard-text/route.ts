import { NextRequest, NextResponse } from 'next/server'
import { localizeWizardText, polishWizardText } from '@/lib/site-ai'
import type { Language } from '@/types'

type WizardAiType = 'welcome' | 'facility' | 'suggestion' | 'location' | 'booking' | 'contact'
type WizardAiMode = 'improve' | 'translate'

const languageNames: Record<Language, string> = {
  nl: 'Dutch',
  en: 'English',
  de: 'German',
  fr: 'French',
}

export async function POST(req: NextRequest) {
  try {

    const hfToken = process.env.HUGGINGFACE_API_TOKEN
    const model = process.env.HUGGINGFACE_MODEL ?? 'google/flan-t5-base'

    const body = await req.json()
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const type = body.type as WizardAiType
    const mode = (body.mode as WizardAiMode) ?? 'translate'
    const appName = typeof body.appName === 'string' ? body.appName.trim() : ''
    const location = typeof body.location === 'string' ? body.location.trim() : ''
    const defaultLanguage = body.defaultLanguage as Language
    const languages = Array.isArray(body.languages)
      ? body.languages.filter((lang: unknown): lang is Language => (
          typeof lang === 'string' && ['nl', 'en', 'de', 'fr'].includes(lang)
        ))
      : []

    if (!text) return NextResponse.json({ error: 'Tekst is verplicht.' }, { status: 400 })
    if (!['welcome', 'facility', 'suggestion', 'location', 'booking', 'contact'].includes(type)) return NextResponse.json({ error: 'Ongeldig AI-type.' }, { status: 400 })
    if (!['improve', 'translate'].includes(mode)) return NextResponse.json({ error: 'Ongeldige AI-modus.' }, { status: 400 })
    if (!languages.length) return NextResponse.json({ error: 'Minstens één taal is verplicht.' }, { status: 400 })
    if (!['nl', 'en', 'de', 'fr'].includes(defaultLanguage)) return NextResponse.json({ error: 'Ongeldige standaardtaal.' }, { status: 400 })

    const useLocalFallback = !hfToken
    let fallbackReason: string | null = useLocalFallback ? 'missing-token' : null

    let improvedText = mode === 'improve'
      ? polishWizardText(text, type, appName, location)
      : text

    let translations: Record<string, string> = { [defaultLanguage]: improvedText }

    if (!useLocalFallback && hfToken) {
      try {
        improvedText = mode === 'improve'
          ? await runInference({
              token: hfToken,
              model,
              prompt: buildImprovePrompt(type, text, defaultLanguage, appName, location),
            })
          : text

        translations = mode === 'translate'
          ? Object.fromEntries(
              await Promise.all(
                languages.map(async (lang: Language) => [
                  lang,
                  lang === defaultLanguage
                    ? improvedText
                    : await runInference({
                        token: hfToken,
                        model,
                        prompt: buildTranslatePrompt(improvedText, defaultLanguage, lang),
                      }),
                ])
              )
            )
          : { [defaultLanguage]: improvedText }
      } catch (error) {
        fallbackReason = error instanceof Error ? error.message : 'ai-route-fallback'
      }
    }

    if (fallbackReason) {
      improvedText = mode === 'improve'
        ? polishWizardText(text, type, appName, location)
        : text

      translations = Object.fromEntries(
        languages.map((lang: Language) => [
          lang,
          lang === defaultLanguage
            ? improvedText
            : localizeWizardText(improvedText, lang, type, appName, location),
        ])
      )
    }

    return NextResponse.json({
      improvedText,
      translations,
      notice: mode === 'improve'
        ? (fallbackReason ? 'Tekst is lokaal verbeterd omdat de AI-service niet beschikbaar was.' : 'AI heeft de tekst verbeterd.')
        : (fallbackReason ? 'Vertalingen zijn lokaal gemaakt omdat de AI-service niet beschikbaar was.' : 'AI heeft de tekst vertaald naar alle geselecteerde talen.'),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Hugging Face AI-aanvraag mislukt.' },
      { status: 500 }
    )
  }
}

async function runInference(input: { token: string; model: string; prompt: string }) {
  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        {
          role: 'system',
          content: 'You are a multilingual writing assistant. When rewriting, stay very close to the user text: keep the same facts, intent, structure, and concrete details. Do not invent new information, examples, features, promises, or context. Preserve names, addresses, passwords, times, links, numbers, and instructions unless the user text itself is unclear. Prefer minimal edits over creative rewrites. Return only the final rewritten or translated text, with no quotes, labels, markdown, or commentary.',
        },
        {
          role: 'user',
          content: input.prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 220,
    }),
    cache: 'no-store',
  })

  const json = await response.json()

  if (!response.ok) {
    const message =
      typeof json?.error?.message === 'string'
        ? json.error.message
        : typeof json?.error === 'string'
          ? json.error
          : 'Hugging Face request mislukt.'
    throw new Error(message)
  }

  const content = json?.choices?.[0]?.message?.content

  if (typeof content === 'string') {
    return cleanupModelText(content)
  }

  if (Array.isArray(content)) {
    const text = content
      .map((item: { type?: string; text?: string }) => (item?.type === 'text' ? item.text ?? '' : ''))
      .join(' ')
      .trim()

    if (text) return cleanupModelText(text)
  }

  throw new Error('Onverwacht antwoord van Hugging Face.')
}

function buildImprovePrompt(type: WizardAiType, text: string, lang: Language, appName?: string, location?: string) {
  const target = languageNames[lang]
  const purpose =
    type === 'welcome'
      ? `Rewrite this ${target} welcome text for a guest app named "${appName || 'guest app'}" in ${location || 'the local area'}.`
      : type === 'facility'
        ? `Rewrite this ${target} guest-facing amenity description for a stay called "${appName || 'guest app'}".`
        : type === 'location'
          ? `Rewrite this ${target} location description for guests staying in ${location || 'the area'}.`
        : type === 'booking'
          ? `Rewrite this ${target} booking call-to-action for guests of "${appName || 'guest app'}".`
          : type === 'contact'
            ? `Rewrite this ${target} short contact note for guests staying at "${appName || 'guest app'}".`
            : `Rewrite this ${target} nearby recommendation for guests staying in ${location || 'the area'}.`

  return `${purpose}

Rules:
- Keep the original meaning and intent exactly the same.
- Stay close to the user's wording and sentence structure.
- Improve mainly spelling, grammar, clarity, and tone.
- Do not add new facts, amenities, promises, steps, or local assumptions.
- Do not remove specific details such as names, times, passwords, locations, links, or instructions.
- If the original text is already clear, change as little as possible.
- Keep the output in ${target}.
- Return only the rewritten text.

Original text:
${text}`
}

function buildTranslatePrompt(text: string, from: Language, to: Language) {
  return `Translate the following text from ${languageNames[from]} to ${languageNames[to]}. Keep the meaning and keep the tone warm, clear, practical, and natural. Return only the translation.\n\nText:\n${text}`
}

function cleanupModelText(value: string) {
  return value.trim().replace(/^["']|["']$/g, '')
}
