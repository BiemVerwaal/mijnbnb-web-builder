import type { SiteData, SiteTheme, Section, SiteContent, Language } from '@/types'
import { mapAppIconToFa, mapAppIconToEmoji } from '@/lib/app-icons'

// ─── Default Empty Site Data ───────────────────────────────────────────────────

export const DEFAULT_THEME: SiteTheme = {
  brand: '#145a63',
  brandLight: '#1e7d85',
  accent: '#e67d4d',
  bg: '#f8f4ec',
  bgSoft: '#fffaf1',
  ink: '#17313a',
  radius: 'round',
  font: 'outfit',
}


export const DEFAULT_CONTENT: Record<Language, SiteContent> = {
  nl: {
    meta: { title: 'Mijn BnB', subtitle: 'Welkom bij ons verblijf', description: '' },
    nav: { welcome: 'Welkom', house: 'Huis', photos: "Foto's", area: 'Omgeving', info: 'Info' },
    hero: { eyebrow: 'Welkom', heading: 'Geniet van uw verblijf', subheading: 'Alles wat u nodig heeft staat hier', countdownLabel: 'Uw aankomst' },
    sections: {},
  },
  en: {
    meta: { title: 'My BnB', subtitle: 'Welcome to our place', description: '' },
    nav: { welcome: 'Welcome', house: 'House', photos: 'Photos', area: 'Area', info: 'Info' },
    hero: { eyebrow: 'Welcome', heading: 'Enjoy your stay', subheading: 'Everything you need is right here', countdownLabel: 'Your arrival' },
    sections: {},
  },
  de: {
    meta: { title: 'Mein BnB', subtitle: 'Willkommen bei uns', description: '' },
    nav: { welcome: 'Willkommen', house: 'Haus', photos: 'Fotos', area: 'Umgebung', info: 'Info' },
    hero: { eyebrow: 'Willkommen', heading: 'Genießen Sie Ihren Aufenthalt', subheading: 'Alles was Sie brauchen ist hier', countdownLabel: 'Ihre Ankunft' },
    sections: {},
  },
  fr: {
    meta: { title: 'Mon BnB', subtitle: 'Bienvenue chez nous', description: '' },
    nav: { welcome: 'Bienvenue', house: 'Maison', photos: 'Photos', area: 'Région', info: 'Info' },
    hero: { eyebrow: 'Bienvenue', heading: 'Profitez de votre séjour', subheading: 'Tout ce dont vous avez besoin est ici', countdownLabel: 'Votre arrivée' },
    sections: {},
  },
}

export const DEFAULT_SECTIONS: Section[] = [
  {
    id: 'hero',
    type: 'hero',
    visible: true,
    order: 0,
    data: { images: [], showCountdown: false },
  },
  {
    id: 'quick-links',
    type: 'quick-links',
    visible: true,
    order: 1,
    data: {
      links: [
        { id: 'wifi', icon: 'fa-wifi', label: 'WiFi' },
        { id: 'parking', icon: 'fa-car', label: 'Parkeren' },
        { id: 'checkin', icon: 'fa-key', label: 'Inchecken' },
        { id: 'checkout', icon: 'fa-door-open', label: 'Uitchecken' },
      ],
    },
  },
  {
    id: 'house-info',
    type: 'house-info',
    visible: true,
    order: 2,
    data: {
      coverImage: '',
      sections: [
        { id: 'wifi-info', icon: 'wifi', title: 'WiFi', body: '' },
        { id: 'house-rules', icon: 'info', title: 'Huisregels', body: '' },
        { id: 'checkout-info', icon: 'key', title: 'Uitchecken', body: '' },
      ],
    },
  },
  {
    id: 'photos',
    type: 'photos',
    visible: true,
    order: 3,
    data: { images: [] },
  },
  {
    id: 'area',
    type: 'area',
    visible: true,
    order: 4,
    data: { mapUrl: '', tips: [] },
  },
  {
    id: 'restaurants',
    type: 'restaurants',
    visible: true,
    order: 5,
    data: { items: [] },
  },
  {
    id: 'booking',
    type: 'booking',
    visible: true,
    order: 6,
    data: { showPromo: false, platforms: [] },
  },
  {
    id: 'contact',
    type: 'contact',
    visible: true,
    order: 7,
    data: { socials: [] },
  },
]

export function createEmptySiteData(name: string): SiteData {
  return {
    meta: { title: name, location: '', category: 'bnb' },
    theme: { ...DEFAULT_THEME },
    settings: {
      languageGateEnabled: true,
      settingsEnabled: true,
      textScaleEnabled: true,
      defaultDarkMode: false,
      defaultTextScale: 1,
      nearbyView: 'list',
    },
    sections: DEFAULT_SECTIONS.map(s => ({ ...s, data: { ...s.data } })),
    languages: ['nl'],
    defaultLanguage: 'nl',
    content: { nl: { ...DEFAULT_CONTENT.nl, meta: { ...DEFAULT_CONTENT.nl.meta, title: name } } },
  }
}

// ─── HTML Template Generator ───────────────────────────────────────────────────

export function generateHTML(project: { name: string; slug: string; site_data: SiteData }): string {
  const { site_data } = project
  const { meta, theme, sections, content, defaultLanguage, languages, settings } = site_data

  const allLangs = Array.from(new Set(['nl', 'en', 'de', 'fr', ...(languages ?? []), ...Object.keys(content ?? {})])) as Language[]
  const defaultLang = (defaultLanguage ?? 'nl') as Language
  if (!allLangs.includes(defaultLang)) allLangs.unshift(defaultLang)
  const siteSettings = settings ?? {
    languageGateEnabled: true,
    settingsEnabled: true,
    textScaleEnabled: true,
    defaultDarkMode: false,
    defaultTextScale: 1,
    nearbyView: 'list' as const,
  }
  const baseLocation = meta.location ?? meta.subtitle ?? meta.title

  // Build per-language content objects keyed by lang code
  const allContent: Record<string, SiteContent> = {}
  for (const l of allLangs) {
    allContent[l] = content[l] ?? DEFAULT_CONTENT[l] ?? DEFAULT_CONTENT.nl
  }
  const defaultSections = (allContent[defaultLang].sections ?? {}) as Record<string, unknown>
  const uiContent = ((defaultSections.ui as Record<string, string> | undefined) ?? {})
  const quickLinksContent = ((defaultSections.quickLinks as Record<string, string> | undefined) ?? {})
  const houseContent = ((defaultSections.house as Record<string, Record<string, string>> | undefined) ?? {})

  const rLg = theme.radius === 'sharp' ? '8px' : theme.radius === 'soft' ? '16px' : '24px'
  const rMd = theme.radius === 'sharp' ? '4px' : theme.radius === 'soft' ? '10px' : '16px'
  const rSm = theme.radius === 'sharp' ? '4px' : theme.radius === 'soft' ? '8px' : '12px'

  // Font setup
  const fontMap: Record<string, { url: string; family: string }> = {
    outfit:     { url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap', family: "'Outfit',system-ui,sans-serif" },
    inter:      { url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap', family: "'Inter',system-ui,sans-serif" },
    playfair:   { url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&display=swap', family: "'Playfair Display',Georgia,serif" },
    montserrat: { url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap', family: "'Montserrat',system-ui,sans-serif" },
    system:     { url: '', family: "system-ui,-apple-system,'Helvetica Neue',sans-serif" },
  }
  const fontChoice = fontMap[theme.font ?? 'outfit'] ?? fontMap.outfit
  const fontLinkTag = fontChoice.url ? `<link href="${fontChoice.url}" rel="stylesheet">` : ''

  // Spacing
  const spacingUnit = theme.spacing === 'compact' ? '0.78' : theme.spacing === 'open' ? '1.22' : '1'

  const heroSection = sections.find(s => s.type === 'hero')
  const heroData = heroSection?.data as import('@/types').HeroData | undefined
  const heroImages = heroData?.images ?? []

  const photosSection = sections.find(s => s.type === 'photos')
  const photosData = photosSection?.data as import('@/types').PhotosData | undefined

  const contactSection = sections.find(s => s.type === 'contact')
  const contactData = contactSection?.data as import('@/types').ContactData | undefined

  const quickLinksSection = sections.find(s => s.type === 'quick-links')
  const quickLinksData = quickLinksSection?.data as import('@/types').QuickLinksData | undefined

  const houseSection = sections.find(s => s.type === 'house-info')
  const houseData = houseSection?.data as import('@/types').HouseInfoData | undefined

  const areaSection = sections.find(s => s.type === 'area')
  const areaData = areaSection?.data as import('@/types').AreaData | undefined

  const restaurantsSection = sections.find(s => s.type === 'restaurants')
  const restaurantsData = restaurantsSection?.data as import('@/types').RestaurantsData | undefined
  const environmentData = site_data.environment

  const bookingSection = sections.find(s => s.type === 'booking')
  const bookingData = bookingSection?.data as import('@/types').BookingData | undefined

  const hasMultipleLangs = allLangs.length > 1

  const langFlagMap: Record<string, string> = { nl: '🇳🇱', en: '🇬🇧', de: '🇩🇪', fr: '🇫🇷' }
  const langNameMap: Record<string, string> = { nl: 'NL', en: 'EN', de: 'DE', fr: 'FR' }
  const langFullNameMap: Record<string, string> = { nl: 'Nederlands', en: 'English', de: 'Deutsch', fr: 'Français' }

  // Serialise per-language content for JS
  const contentJSON = JSON.stringify(allContent).replace(/<\/script>/gi, '<\\/script>')
  const baseHouseSectionIds = new Set(['welcome'])
  const houseSectionsAll = houseData?.sections ?? []
  const primaryHouseSections = houseSectionsAll.filter((section) => baseHouseSectionIds.has(section.id))
  const houseMainSections = primaryHouseSections.length ? primaryHouseSections : houseSectionsAll
  const amenitySections = primaryHouseSections.length
    ? houseSectionsAll.filter((section) => !baseHouseSectionIds.has(section.id))
    : []

  const fallbackEnvironment: NonNullable<SiteData['environment']> = {
    all: [],
    restaurants: (restaurantsData?.items ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      category: 'restaurant',
      address: item.contact ?? '',
      latitude: 0,
      longitude: 0,
      rating: null,
      distance_from_bnb: 0,
      image_reference: item.photo,
      google_maps_link: item.url,
      recommended_for_guests_reason: item.description,
      descriptions: { nl: item.description, en: item.description, de: item.description, fr: item.description },
    })),
    tourism: [],
    shops: [],
  }

  ;(areaData?.tips ?? []).forEach((tip) => {
    const category = tip.category === 'voorziening' ? 'shops' : 'tourism'
    const normalized = {
      id: tip.id,
      name: tip.title,
      category,
      address: tip.contact ?? '',
      latitude: 0,
      longitude: 0,
      rating: null,
      distance_from_bnb: 0,
      image_reference: tip.photo,
      google_maps_link: tip.url,
      recommended_for_guests_reason: tip.description,
      descriptions: { nl: tip.description ?? '', en: tip.description ?? '', de: tip.description ?? '', fr: tip.description ?? '' },
    } as NonNullable<SiteData['environment']>['all'][number]

    fallbackEnvironment.all.push(normalized)
    if (category === 'shops') {
      fallbackEnvironment.shops.push(normalized)
    } else {
      fallbackEnvironment.tourism.push(normalized)
    }
  })

  fallbackEnvironment.all = [...fallbackEnvironment.restaurants, ...fallbackEnvironment.tourism, ...fallbackEnvironment.shops]
  const normalizedEnvironment = environmentData ?? fallbackEnvironment

  const areaCounts = {
    restaurants: normalizedEnvironment.restaurants.length,
    tourism: normalizedEnvironment.tourism.length,
    shops: normalizedEnvironment.shops.length,
  }
  const photoImages = photosData?.images ?? []

  const getQuickLinkBlurb = (action?: string) => {
    const keyMap: Record<string, string> = {
      house: 'quickLinkHouseBlurb',
      photos: 'quickLinkPhotosBlurb',
      area: 'quickLinkAreaBlurb',
      contact: 'quickLinkContactBlurb',
    }

    return uiContent[keyMap[action ?? '']] ?? ''
  }

  const renderLocationDescription = (item: NonNullable<SiteData['environment']>['all'][number]) => {
    const descriptionKey = item.category === 'restaurant'
      ? `sections.restaurants.${escapeAttr(item.id)}.description`
      : `sections.area.${escapeAttr(item.id)}.description`
    const descriptionFallback = item.category === 'restaurant'
      ? ((defaultSections.restaurants as Record<string, Record<string, string>> | undefined)?.[item.id]?.description)
      : ((defaultSections.area as Record<string, Record<string, string>> | undefined)?.[item.id]?.description)

    return `<span data-i18n="${descriptionKey}">${escapeHtml(descriptionFallback ?? item.descriptions[defaultLang] ?? item.descriptions.nl ?? '')}</span>`
  }

  const renderAreaItems = (
    items: Array<NonNullable<SiteData['environment']>['all'][number]>,
    sectionKey: 'restaurants' | 'tourism' | 'shops',
    icon: string
  ) => items.map((item, itemIndex) => {
    const mapUrl = getLocationMapsUrl(item, baseLocation)
    const distance = formatDistanceLabel(item.distance_from_bnb, defaultLang)
    const itemTitle = escapeAttr(item.name)
    const normalizedCategory = sectionKey === 'restaurants' ? 'restaurant' : sectionKey
    const categoryBadge = getCategoryBadge(normalizedCategory, defaultLang)
    const infoLine = [distance, item.address].filter(Boolean).join(' • ')
    const isShop = sectionKey === 'shops'

    if (isShop) {
      return `
        <div class="supermarket-row">
          <div class="supermarket-copy">
            <div class="supermarket-line">
              <span class="supermarket-title">${escapeHtml(item.name)}</span>
              <span class="supermarket-meta">${escapeHtml(infoLine || categoryBadge)}</span>
            </div>
            <div class="supermarket-links">
              <span class="area-badge area-badge--plain">${escapeHtml(categoryBadge)}</span>
              <a class="supermarket-mini-map" href="${escapeAttr(mapUrl)}" target="_blank" rel="noopener">${escapeHtml(uiContent.googleRouteButton ?? 'Google Maps')}</a>
            </div>
          </div>
          <a class="supermarket-link" href="${escapeAttr(mapUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-route"></i>${escapeHtml(uiContent.routeButton ?? 'Open route')}</a>
        </div>`
    }

    return `
      <details class="area-item" data-state-key="area-item-${sectionKey}-${itemIndex}" data-area-item-title="${itemTitle}">
        <summary class="area-item-summary">
          ${item.image_reference
            ? `<img class="area-thumb" src="${escapeAttr(item.image_reference)}" alt="${itemTitle}">`
            : `<span class="area-thumb-placeholder">${renderAppIcon(icon)}</span>`}
          <div class="area-item-copy">
            <strong>${escapeHtml(item.name)}</strong>
            ${distance
              ? `<div class="restaurant-meta-line">
                  ${distance ? `<span class="restaurant-rating-value"><i class="fa-solid fa-location-dot"></i>${escapeHtml(distance)}</span>` : ''}
                </div>`
              : ''}
            <span>${renderLocationDescription(item)}</span>
            <div class="area-badge-row">
              <span class="area-badge area-badge--plain">${escapeHtml(categoryBadge)}</span>
            </div>
          </div>
          <span class="area-item-arrow"><i class="fa-solid fa-chevron-down"></i></span>
        </summary>
        <div class="area-item-content">
          ${item.image_reference ? `<img class="area-detail-image" src="${escapeAttr(item.image_reference)}" alt="${itemTitle}">` : ''}
          ${distance
            ? `<div class="restaurant-meta-line">
                ${distance ? `<span class="restaurant-rating-value"><i class="fa-solid fa-location-dot"></i>${escapeHtml(distance)}</span>` : ''}
              </div>`
            : ''}
          <p>${renderLocationDescription(item)}</p>
          ${item.address ? `<p class="muted" style="margin-top:8px">${escapeHtml(item.address)}</p>` : ''}
          <div class="action-row">
            <a class="action-btn route" href="${escapeAttr(mapUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-route"></i>${escapeHtml(uiContent.routeButton ?? 'Open route')}</a>
            <a class="action-btn soft" href="${escapeAttr(mapUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i>${escapeHtml(uiContent.googleRouteButton ?? 'Google Maps')}</a>
          </div>
        </div>
      </details>`
  }).join('')

  const renderAreaSection = (
    sectionKey: 'restaurants' | 'tourism' | 'shops',
    title: string,
    titleKey: string,
    iconClass: string,
    items: Array<NonNullable<SiteData['environment']>['all'][number]>
  ) => {
    if (!items.length) return ''

    const markerCategory = sectionKey === 'restaurants' ? 'restaurant' : sectionKey

    return `
      <details class="area-group" data-area-section="${sectionKey}" data-state-key="area-group-${sectionKey}">
        <summary class="area-group-summary">
          <span class="area-group-icon"><i class="${escapeAttr(iconClass)}"></i></span>
          <span class="area-group-title"><span data-i18n="${escapeAttr(titleKey)}">${escapeHtml(title)}</span> <span class="area-group-count">${items.length}</span></span>
          <span class="area-group-arrow"><i class="fa-solid fa-chevron-down"></i></span>
        </summary>
        <div class="area-group-body" data-accordion-scope="single">
          ${renderAreaItems(items, sectionKey, getCategoryMarker(markerCategory))}
        </div>
      </details>`
  }

  const heroSlides = heroImages.map((src, i) =>
    `<img class="hero-image${i === 0 ? ' active' : ''}" src="${escapeHtml(src)}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}">`
  ).join('\n      ')

  const heroDots = heroImages.length > 1 ? `
    <div class="hero-dots">
      ${heroImages.map((_, i) => `<button class="hero-dot${i === 0 ? ' active' : ''}" aria-label="slide ${i + 1}" onclick="goSlide(${i})"></button>`).join('')}
    </div>` : ''

  const initialShowCountdown = Boolean(heroData?.showCountdown)
  const initialArrivalDate = heroData?.arrivalDate ?? ''
  const initialCheckoutDate = heroData?.checkoutDate ?? ''
  const hasCountdown = Boolean((initialShowCountdown || initialArrivalDate || initialCheckoutDate) && (initialArrivalDate || initialCheckoutDate))

  const countdownBlock = `
    <div class="hero-countdown" id="hero-countdown" ${hasCountdown ? '' : 'hidden'}>
      <span class="hero-countdown-main" id="hero-countdown-text"></span>
      <span class="hero-countdown-date" id="hero-countdown-date"><i class="fa-regular fa-calendar"></i><span id="hero-countdown-date-text"></span></span>
    </div>`

  const locationQuery = encodeURIComponent(baseLocation || '')
  const defaultAreaMapUrl = areaData?.mapUrl?.trim()
    ? areaData.mapUrl
    : `https://www.google.com/maps?q=${locationQuery}&output=embed`

  const heroImageForGate = heroImages.length > 0 ? heroImages[0] : ''
  
  const languageGate = siteSettings.languageGateEnabled ? `
  <div class="language-gate hidden" id="language-gate" role="dialog" aria-modal="true" aria-labelledby="language-gate-title">
    <div class="language-gate-card">
      <div class="language-gate-visual">
        ${heroImageForGate ? `<img class="language-gate-image" src="${escapeAttr(heroImageForGate)}" alt="">` : ''}
        <div class="language-gate-copy">
          <div class="language-gate-badge"><i class="fa-solid fa-globe"></i> ${escapeHtml(allContent[defaultLang].meta.title || meta.title)}</div>
          <div class="language-gate-heading">
            <h2 id="language-gate-title">Choose language</h2>
            <p id="language-gate-copy-text">Select your language below to start.</p>
          </div>
        </div>
      </div>
      <div class="language-gate-body">
        <p></p>
        <div class="language-gate-step" id="language-step-select">
          <div class="language-gate-options">
            ${allLangs.map(l => `<button class="start-lang-btn" type="button" data-start-lang="${l}"><strong>${langFullNameMap[l]}</strong><span>${langNameMap[l]}</span></button>`).join('')}
          </div>
        </div>
        <div class="language-gate-step hidden" id="language-step-setup">
          <div class="language-gate-settings">
            <div class="section-title">
              <h3 id="language-gate-text-title">Tekstgrootte</h3>
              <span class="settings-scale-value" id="language-gate-scale-value">100%</span>
            </div>
            <p class="muted" id="language-gate-text-copy">Schuif om de tekst in de hele app groter of kleiner te maken.</p>
            <div class="settings-range-row">
              <input class="settings-range" id="language-gate-scale-range" type="range" min="0.9" max="1.35" step="0.05" value="1">
              <div class="settings-range-labels">
                <span id="language-gate-text-small">Kleiner</span>
                <span id="language-gate-text-large">Groter</span>
              </div>
            </div>
          </div>
          <div class="language-gate-settings">
            <div class="field">
              <div class="field-label-row">
                <label id="language-gate-arrival-label" for="language-gate-arrival">Arrival date</label>
                <span class="field-format-hint">DD-MM-YYYY</span>
              </div>
              <input id="language-gate-arrival" type="date">
            </div>
            <p class="muted" id="language-gate-arrival-copy">Add your arrival date to show the countdown on the home screen.</p>
          </div>
          <div class="language-gate-actions">
            <button class="action-btn route" id="language-gate-continue" type="button"><i class="fa-solid fa-check"></i><span id="language-gate-continue-label">Start app</span></button>
          </div>
        </div>
      </div>
    </div>
  </div>` : ''

  const installHint = `
  <div class="install-hint hidden" id="install-hint" aria-live="polite">
    <div class="install-hint-card">
      <div class="install-hint-copy">
        <div class="install-hint-preview" aria-hidden="true">
          ${heroImages.length > 0 ? `<img src="${escapeAttr(heroImages[0])}" alt="">` : ''}
        </div>
      </div>
      <div class="install-hint-copy">
        <strong id="install-hint-title">${escapeHtml(uiContent.installTitle ?? 'Zet op je beginscherm')}</strong>
        <div class="install-hint-text" id="install-hint-text">Tik op <span class="install-inline-icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></span> en kies Voeg toe aan beginscherm.</div>
      </div>
      <button class="install-hint-dismiss" id="install-hint-dismiss" type="button" aria-label="Sluiten">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  </div>`

  const settingsPanel = siteSettings.settingsEnabled ? `
  <div class="settings-panel hidden" id="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
    <div class="settings-panel-card">
      <div class="settings-panel-head">
        <h2 id="settings-title">${escapeHtml(uiContent.settingsTitle ?? 'Instellingen')}</h2>
        <p id="settings-copy">${escapeHtml(uiContent.settingsCopy ?? 'Pas taal en leesbaarheid aan voor een rustig gebruik van de app.')}</p>
      </div>
      ${siteSettings.textScaleEnabled ? `
      <div class="settings-block">
        <div class="section-title">
          <h3 id="settings-text-title">${escapeHtml(uiContent.settingsTextTitle ?? 'Tekstgrootte')}</h3>
          <span class="settings-scale-value" id="settings-scale-value">100%</span>
        </div>
        <p class="muted" id="settings-text-copy">${escapeHtml(uiContent.settingsTextCopy ?? 'Schuif om alle tekst in de app groter of kleiner te maken.')}</p>
        <div class="settings-range-row">
          <input class="settings-range" id="text-scale-range" type="range" min="0.9" max="1.35" step="0.05" value="${siteSettings.defaultTextScale}">
          <div class="settings-range-labels">
            <span id="settings-text-small">${escapeHtml(uiContent.settingsTextSmall ?? 'Kleiner')}</span>
            <span id="settings-text-large">${escapeHtml(uiContent.settingsTextLarge ?? 'Groter')}</span>
          </div>
        </div>
      </div>` : ''}
      <div class="settings-block">
        <div class="section-title">
          <h3 id="settings-theme-title">${escapeHtml(uiContent.settingsThemeTitle ?? 'Weergavemodus')}</h3>
        </div>
        <p class="muted" id="settings-theme-copy">${escapeHtml(uiContent.settingsThemeCopy ?? 'Kies Dag- of Nachtmodus voor de hele app.')}</p>
        <div class="mode-choice-group">
          <button class="mode-choice-btn" id="theme-day-btn" type="button">${escapeHtml(uiContent.settingsThemeDay ?? 'Dag')}</button>
          <button class="mode-choice-btn" id="theme-night-btn" type="button">${escapeHtml(uiContent.settingsThemeNight ?? 'Nacht')}</button>
        </div>
      </div>
      <div class="settings-block">
        <div class="field">
          <div class="field-label-row">
            <label id="settings-arrival-label" for="settings-arrival">${escapeHtml(uiContent.arrivalDateLabel ?? 'Aankomstdatum')}</label>
            <span class="field-format-hint">DD-MM-YYYY</span>
          </div>
          <input id="settings-arrival" type="date" value="${escapeHtml(initialArrivalDate)}">
        </div>
        <p class="muted" id="settings-arrival-copy">${escapeHtml(uiContent.arrivalDateCopy ?? 'Pas je aankomstdatum aan om de afteller op het startscherm bij te werken.')}</p>
      </div>
      <div class="action-row settings-actions">
        <button class="action-btn route" id="settings-language-btn" type="button"><i class="fa-solid fa-rotate-left"></i><span id="settings-language-label">${escapeHtml(uiContent.settingsLanguageLabel ?? 'Reset app')}</span></button>
        <button class="action-btn soft" id="settings-reset-scale" type="button"><i class="fa-solid fa-text-height"></i><span id="settings-reset-label">${escapeHtml(uiContent.settingsResetLabel ?? 'Standaard tekst')}</span></button>
        <button class="action-btn route" id="settings-save-close" type="button"><i class="fa-solid fa-check"></i><span id="settings-save-close-label">${escapeHtml(uiContent.settingsSaveCloseLabel ?? 'Opslaan en sluiten')}</span></button>
      </div>
    </div>
  </div>` : ''

  return `<!DOCTYPE html>
<html lang="${defaultLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title data-i18n="meta.title">${escapeHtml(allContent[defaultLang].meta.title || meta.title)}</title>
  <meta name="theme-color" content="${escapeHtml(theme.brand)}">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="description" content="${escapeHtml(allContent[defaultLang].meta.description ?? '')}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${fontLinkTag}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
  <style>
    :root {
      --brand: ${escapeHtml(theme.brand)};
      --brand-2: ${escapeHtml(theme.brandLight)};
      --accent: ${escapeHtml(theme.accent)};
      --bg: ${escapeHtml(theme.bg)};
      --bg-soft: ${escapeHtml(theme.bgSoft)};
      --ink: ${escapeHtml(theme.ink)};
      --ink-soft: color-mix(in srgb, var(--ink) 55%, transparent);
      --card: rgba(255,255,255,0.88);
      --line: color-mix(in srgb, var(--brand) 18%, transparent);
      --shadow: 0 18px 40px rgba(15,53,60,0.12);
      --radius-lg: ${rLg};
      --radius-md: ${rMd};
      --radius-sm: ${rSm};
      --space: ${spacingUnit};
      --ease: cubic-bezier(0.22,1,0.36,1);
      --motion-fast: 220ms;
      --motion-normal: 320ms;
      --motion-ease: cubic-bezier(0.22,1,0.36,1);
      --lekker-font: 'Arial Rounded MT Bold','VAG Rounded','VAG Rounded Std','VAGRounded BT','Trebuchet MS',sans-serif;
      --text-scale: 1;
    }

    @font-face {
      font-family: 'Arial Rounded MT Bold';
      src: local('Arial Rounded MT Bold');
      font-display: swap;
    }
    body.theme-night {
      --bg: #0f1b23; --bg-soft: #162733; --ink: #edf5f7; --ink-soft: #a7bfca;
      --brand: #2d8f95; --brand-2: #46aeb5; --accent: #ef9364;
      --card: rgba(13,31,41,0.9); --line: rgba(130,191,207,0.22);
      --shadow: 0 18px 42px rgba(1,9,12,0.48);
    }
    body.theme-night::before{
      background:radial-gradient(circle at 85% -8%,#214354,transparent 35%),
                 radial-gradient(circle at 8% 12%,#1b3e36,transparent 30%),
                 var(--bg);
    }

    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    html{font-size:calc(16px * var(--text-scale, 1))}
    html,body{margin:0;padding:0;font-family:${fontChoice.family};color:var(--ink);
      background:var(--bg);transition:background 300ms var(--ease),color 300ms var(--ease)}
    body{overscroll-behavior-y:none}
    body.language-gate-open,body.settings-panel-open{overflow:hidden}
    html,body{-ms-overflow-style:none;scrollbar-width:none}
    html::-webkit-scrollbar,body::-webkit-scrollbar{width:0;height:0;display:none}
    body::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;
      background:radial-gradient(circle at 90% -10%,color-mix(in srgb,var(--accent) 20%,transparent),transparent 34%),
                 radial-gradient(circle at -10% 12%,color-mix(in srgb,var(--brand) 12%,transparent),transparent 30%),
                 var(--bg)}

    .app{max-width:520px;margin:0 auto;min-height:100dvh;position:relative;
      padding-bottom:calc(88px + env(safe-area-inset-bottom))}

    /* Hide transient editor overlays in publication-only mode (keep navigation visible) */
    /* production-mode: show settings panel in export so gebruiker instellingen kan kiezen */
    /* .production-mode .settings-panel { display: none !important; } */

    /* ── Topbar ── */
    .topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:8px;
      padding:calc(env(safe-area-inset-top) + 6px) 12px 6px;
      backdrop-filter:blur(14px);background:color-mix(in srgb,var(--bg) 82%,transparent);
      border-bottom:1px solid var(--line)}
    .brand{flex:1 1 auto;display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden}
    .brand-title{font-weight:800;font-size:clamp(0.78rem,2.45vw,0.9rem);white-space:nowrap;
      overflow:hidden;text-overflow:ellipsis;display:inline-flex;align-items:center;gap:5px;line-height:1;letter-spacing:0.01em}
    .brand-home-icon{flex:none;color:var(--brand);font-size:0.82em}
    .brand-title-main{font-family:var(--lekker-font);font-weight:700;letter-spacing:0.01em;min-width:0;overflow:hidden;text-overflow:ellipsis}
    .brand-tail-topbar{font-family:var(--lekker-font);flex:none;font-size:0.74em;font-weight:700;line-height:1;letter-spacing:0.01em}
    .topbar-actions{display:flex;align-items:center;gap:4px;flex:none}
    .icon-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;
      border-radius:999px;border:1px solid var(--line);background:color-mix(in srgb,var(--card) 80%,transparent);
      color:var(--brand);font:inherit;cursor:pointer;transition:transform 180ms var(--ease)}
    .icon-btn:hover{transform:scale(1.08)}

    /* ── Language menu ── */
    .language-menu{position:relative;flex:none}
    .language-menu-toggle{min-width:auto;padding:0 8px;gap:5px}
    .toolbar-lang-flag{font-size:0.92rem;line-height:1}
    .language-menu-caret{font-size:0.66rem;transition:transform 220ms var(--ease)}
    .language-menu.is-open .language-menu-caret{transform:rotate(180deg)}
    .language-menu-panel{position:absolute;top:calc(100% + 8px);right:0;z-index:30;display:grid;gap:6px;min-width:150px;
      padding:8px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,0.92);
      box-shadow:var(--shadow);backdrop-filter:blur(12px)}
    .language-menu-panel[hidden]{display:none !important}
    .lang-btn{border:0;background:transparent;color:var(--brand);font:inherit;cursor:pointer;
      display:inline-flex;align-items:center;gap:8px;width:100%;border-radius:12px;padding:9px 10px;
      font-size:0.74rem;font-weight:800;min-width:32px;text-align:left;
      transition:transform 220ms var(--ease),background 220ms var(--ease),color 220ms var(--ease)}
    .lang-btn:hover{background:color-mix(in srgb,var(--brand) 10%,transparent)}
    .lang-btn.active{background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff}
    .lang-btn-flag{font-size:0.95rem;line-height:1}
    .lang-btn-text{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .lang-btn.is-pressed,.icon-btn.is-pressed,.tab-btn.is-pressed,.quick-link.is-pressed,.action-btn.is-pressed{animation:buttonTap 240ms var(--ease)}
    @keyframes buttonTap{0%{transform:scale(1)}45%{transform:scale(0.96)}100%{transform:scale(1)}}
    body.theme-night .language-menu-panel{background:rgba(10,25,33,0.9);border-color:rgba(139,202,219,0.22)}
    body.theme-night .lang-btn{color:#d6eef3}
    body.theme-night .lang-btn.active{color:#fff}
    body.theme-night .brand-tail-topbar{color:#d6eef3}
    .language-gate{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;
      background:rgba(11,34,42,0.42);backdrop-filter:blur(16px);padding:18px;
      transition:opacity var(--motion-fast) var(--motion-ease),visibility var(--motion-fast) var(--motion-ease)}
    .language-gate.hidden{opacity:0;visibility:hidden;pointer-events:none}
    .language-gate-card{width:min(100%,420px);overflow:hidden;border-radius:28px;
      background:rgba(255,250,241,0.96);border:1px solid rgba(20,90,99,0.14);
      box-shadow:0 24px 60px rgba(15,53,60,0.18);text-align:center}
    body.theme-night .language-gate-card{background:rgba(10,25,33,0.96);border-color:rgba(139,202,219,0.2)}
    .language-gate-visual{position:relative;min-height:188px;overflow:hidden;background:linear-gradient(135deg,#0f4b56,#c97b4a)}
    .language-gate-visual::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,52,60,0.1),rgba(10,28,38,0.74));z-index:1}
    .language-gate-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.03);filter:saturate(1.04) contrast(1.03)}
    .language-gate-copy{position:relative;z-index:2;min-height:188px;padding:18px;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;text-align:left;color:#fff}
    .language-gate-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.24);backdrop-filter:blur(6px);font-size:0.68rem;font-weight:800;letter-spacing:0.03em}
    .language-gate-heading{max-width:240px}
    .language-gate-heading h2{margin:0;font-size:1.45rem;line-height:1.05;color:#fff}
    .language-gate-heading p{margin:8px 0 0;color:rgba(255,255,255,0.88);font-size:0.82rem;line-height:1.45}
    .language-gate-body{padding:18px 20px 20px}
    .language-gate-step.hidden{display:none}
    .language-gate-actions{display:flex;justify-content:flex-end;margin-top:14px}
    .language-gate-settings{margin-top:14px;padding:12px;border-radius:18px;border:1px solid rgba(20,90,99,0.12);background:rgba(255,255,255,0.72);text-align:left}
    body.theme-night .language-gate-settings{background:rgba(255,255,255,0.04);border-color:rgba(139,202,219,0.18)}
    .language-gate-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:16px}
    .start-lang-btn{border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,0.82);color:var(--ink);font:inherit;cursor:pointer;padding:12px 10px;display:grid;gap:4px;justify-items:center;transition:transform var(--motion-fast) var(--motion-ease),border-color var(--motion-fast) var(--motion-ease),background var(--motion-fast) var(--motion-ease)}
    .start-lang-btn:hover{transform:translateY(-1px);border-color:rgba(20,90,99,0.3);background:rgba(255,255,255,0.96)}
    .start-lang-btn strong{font-size:0.9rem}
    .start-lang-btn span{color:var(--ink-soft);font-size:0.76rem;font-weight:600}
    .start-lang-btn.is-pressed{animation:buttonTap 240ms var(--motion-ease)}
    body.theme-night .start-lang-btn{background:rgba(255,255,255,0.04);border-color:rgba(139,202,219,0.18);color:var(--ink)}
    .language-gate-card > p{margin:0;color:var(--ink-soft);font-size:0.86rem;line-height:1.45}
    .settings-scale-value{color:var(--brand);font-size:0.82rem;font-weight:800;white-space:nowrap}
    .settings-range-row{display:grid;gap:10px;margin-top:10px}
    .settings-range-labels{display:flex;justify-content:space-between;gap:10px;color:var(--ink-soft);font-size:0.76rem;font-weight:700}
    .field{display:grid;gap:6px}
    .field label{font-size:0.77rem;color:var(--ink-soft);font-weight:700;letter-spacing:0.04em;text-transform:uppercase}
    .field-label-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}
    .field-format-hint{color:var(--ink-soft);font-size:0.72rem;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;white-space:nowrap}
    .field input{width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 13px;font:inherit;color:var(--ink);background:rgba(255,255,255,0.82);outline:none}
    .field input[type="date"]{width:min(100%,220px);min-width:0;max-width:100%;min-height:46px;display:block;-webkit-appearance:none;appearance:none}
    body.theme-night .field input{background:rgba(10,27,36,0.88);color:var(--ink);border-color:rgba(139,202,219,0.22)}
    .section-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
    .muted,.card p,.card li{color:var(--ink-soft);line-height:1.4;font-size:0.83rem;margin:0}
    .settings-panel{position:fixed;inset:0;z-index:65;display:flex;align-items:flex-end;justify-content:center;
      padding:16px;background:rgba(11,34,42,0.38);backdrop-filter:blur(10px);
      transition:opacity var(--motion-fast) var(--motion-ease),visibility var(--motion-fast) var(--motion-ease)}
    .settings-panel.hidden{opacity:0;visibility:hidden;pointer-events:none}
    .settings-panel-card{width:min(100%,420px);border-radius:26px;
      background:rgba(255,250,241,0.96);border:1px solid rgba(20,90,99,0.14);
      box-shadow:0 24px 60px rgba(15,53,60,0.18);padding:18px}
    body.theme-night .settings-panel-card{background:rgba(10,25,33,0.96);border-color:rgba(139,202,219,0.2)}
    .settings-panel-head{display:block}
    .settings-panel-head h2{margin:0;font-size:1.05rem}
    .settings-panel-head p{margin:6px 0 0;color:var(--ink-soft);font-size:0.82rem;line-height:1.45}
    .settings-block{margin-top:14px;padding:14px;border-radius:18px;border:1px solid var(--line);background:rgba(255,255,255,0.72)}
    body.theme-night .settings-block{background:rgba(255,255,255,0.04)}
    .settings-range{width:100%;accent-color:var(--brand);cursor:pointer}
    .mode-choice-group{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
    .mode-choice-btn{border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,0.82);color:var(--ink);font:inherit;font-weight:800;padding:11px 12px;cursor:pointer;transition:transform var(--motion-fast) var(--motion-ease),background var(--motion-fast) var(--motion-ease),border-color var(--motion-fast) var(--motion-ease),color var(--motion-fast) var(--motion-ease)}
    .mode-choice-btn.active{color:#fff;background:linear-gradient(135deg,var(--brand),var(--brand-2));border-color:transparent}
    body.theme-night .mode-choice-btn{background:rgba(255,255,255,0.05);border-color:rgba(139,202,219,0.2);color:var(--ink)}
    body.theme-night .mode-choice-btn.active{color:#fff}
    .action-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
    .action-btn{display:inline-flex;align-items:center;gap:7px;padding:8px 10px;border-radius:12px;
      text-decoration:none;border:0;font:inherit;font-weight:700;font-size:0.79rem;cursor:pointer;
      transition:transform var(--motion-fast) var(--motion-ease),box-shadow var(--motion-fast) var(--motion-ease)}
    .action-btn:hover{transform:translateY(-1px)}
    .action-btn.route{color:#fff;background:linear-gradient(135deg,var(--brand),var(--brand-2))}
    .action-btn.soft{color:var(--brand);background:rgba(20,90,99,0.08);border:1px solid rgba(20,90,99,0.18)}
    body.theme-night .action-btn.soft{color:#d6eef3;background:rgba(70,174,181,0.12);border-color:rgba(139,202,219,0.24)}
    .settings-actions{margin-top:14px}

    /* ── Views / tabs ── */
    .view{display:none;padding:12px;animation:fadeUp 220ms var(--ease)}
    .view.active{display:block}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

    /* ── Hero ── */
    .hero{position:relative;border-radius:var(--radius-lg);overflow:hidden;min-height:236px;
      box-shadow:var(--shadow);color:#fff;isolation:isolate;
      border:1px solid rgba(255,255,255,0.18);
      background:linear-gradient(145deg,rgba(227,184,104,0.1),rgba(227,184,104,0.02)),
                 radial-gradient(circle at 20% 28%,rgba(255,232,207,0.28),transparent 22%),
                 linear-gradient(135deg,#0f4b56 0%,#1f6d74 42%,#c97b4a 100%);
      touch-action:pan-y}
    .hero::before{content:'';position:absolute;inset:0;
      background:linear-gradient(165deg,rgba(20,90,99,0.22),rgba(9,34,47,0.84));z-index:1}
    .hero::after{content:'';position:absolute;width:240px;height:240px;right:-70px;top:-80px;
      border-radius:999px;background:radial-gradient(circle,rgba(255,223,191,0.34),rgba(255,223,191,0));z-index:1}
    .hero-slider{position:absolute;inset:0;z-index:0;touch-action:pan-y;user-select:none}
    .hero-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
      opacity:0;transition:opacity 900ms ease,transform 5000ms ease;transform:scale(1.05);z-index:0;
      filter:saturate(1.06) contrast(1.02);user-select:none;-webkit-user-drag:none}
    .hero-image.active{opacity:1;transform:scale(1.01)}
    .hero-content{position:relative;z-index:2;min-height:240px;padding:18px;
      display:flex;flex-direction:column;justify-content:flex-end;
      text-shadow:0 6px 20px rgba(7,24,32,0.45)}
    .eyebrow{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;
      background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.24);
      font-size:0.68rem;font-weight:700;margin-bottom:10px;backdrop-filter:blur(4px)}
    .hero h1{margin:0;font-size:clamp(1.55rem,5.5vw,2.1rem);line-height:1.05;letter-spacing:-0.03em}
    .hero-sub{margin:8px 0 0;font-size:0.84rem;opacity:.9;line-height:1.4;max-width:290px}
    .hero-dots{display:flex;gap:6px;margin-top:10px}
    .hero-dot{width:8px;height:8px;border-radius:999px;border:1px solid rgba(255,255,255,0.3);
      background:rgba(255,255,255,0.4);cursor:pointer;transition:width 200ms var(--ease),background 200ms}
    .hero-dot.active{width:22px;background:rgba(255,255,255,0.9)}

    /* ── Countdown ── */
    .hero-countdown{position:relative;z-index:0;display:flex;align-items:center;justify-content:space-between;
      gap:14px;width:calc(100% - 24px);margin:12px 12px 14px;padding:12px 14px;border-radius:22px;
      background:linear-gradient(145deg,rgba(255,251,246,0.82),rgba(247,239,228,0.76));
      border:1px solid rgba(20,90,99,0.1);box-shadow:0 10px 24px rgba(14,41,52,0.08);
      color:var(--ink);overflow:hidden}
    .hero-countdown::before{content:'';position:absolute;top:0;left:18px;right:18px;height:2px;border-radius:999px;
      background:linear-gradient(90deg,rgba(214,124,77,0.08),rgba(214,124,77,0.45),rgba(20,90,99,0.12));pointer-events:none}
    .hero-countdown::after{content:'';position:absolute;width:72px;height:72px;top:-34px;right:-14px;
      border-radius:999px;background:radial-gradient(circle,rgba(234,188,129,0.1),rgba(234,188,129,0));pointer-events:none}
    body.theme-night .hero-countdown{background:linear-gradient(145deg,rgba(18,34,42,0.82),rgba(10,24,31,0.8));
      border-color:rgba(139,202,219,0.12);box-shadow:0 12px 28px rgba(4,10,14,0.18);color:#edf5f7}
    .hero-countdown-main{position:relative;z-index:1;display:block;flex:1 1 auto;min-width:0;font-size:0.81rem;font-weight:800;line-height:1.16;letter-spacing:-0.01em;text-wrap:pretty}
    .hero-countdown-date{position:relative;z-index:1;display:inline-flex;align-items:center;gap:6px;flex:none;
      font-size:0.63rem;font-weight:800;padding:5px 9px;border-radius:999px;
      background:rgba(20,90,99,0.06);color:var(--brand);white-space:nowrap}
    body.theme-night .hero-countdown-date{background:rgba(70,174,181,0.12);color:#d8f0f4}
    .hero-countdown[hidden]{display:none}
    @media (max-width:420px){.hero-countdown{align-items:flex-start;flex-direction:column}}

    /* ── Quick links ── */
    .quick-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px}
    .quick-link{padding:12px;border-radius:var(--radius-md);background:var(--card);border:1px solid var(--line);
      color:inherit;text-decoration:none;cursor:pointer;box-shadow:var(--shadow);
      transition:transform 160ms var(--ease),box-shadow 160ms var(--ease)}
    .quick-link:hover,.quick-link:active{transform:translateY(-2px)}
    .quick-link i{font-size:0.92rem;color:var(--brand);margin-bottom:8px;display:inline-block}
    .quick-link strong{display:block;margin-bottom:4px;color:var(--ink);font-size:0.88rem}
    .quick-link span{display:block;color:var(--ink-soft);font-size:0.78rem;line-height:1.35}
    body.theme-night .quick-link i{color:#7fe3f1}
    body.theme-night .quick-link strong{color:#f6fbfc}
    body.theme-night .quick-link span{color:#d8edf1}

    /* ── Cards ── */
    .card{background:var(--card);border-radius:var(--radius-lg);border:1px solid var(--line);
      padding:16px;margin-bottom:14px;box-shadow:var(--shadow)}
    .card-title{font-size:0.72rem;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;
      color:var(--brand);opacity:0.75;margin:0 0 14px}
    h2{font-size:1.15rem;margin:0 0 4px;letter-spacing:-0.01em}

    /* ── Booking promo ── */
    .booking-promo-card{position:relative;overflow:hidden;
      background:linear-gradient(145deg,rgba(255,255,255,0.96),rgba(247,241,230,0.94))}
    .booking-promo-card::before{content:'';position:absolute;width:220px;height:220px;right:-80px;top:-90px;
      border-radius:999px;background:radial-gradient(circle,rgba(230,125,77,0.18),rgba(230,125,77,0));pointer-events:none}
    .booking-promo-head,.booking-promo-actions,.booking-promo-meta{position:relative;z-index:1}
    .booking-kicker{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border-radius:999px;
      background:rgba(20,90,99,0.08);color:var(--brand);font-size:0.7rem;font-weight:800;margin-bottom:8px}
    .booking-promo-head .section-title{margin-bottom:4px}
    .booking-promo-head .muted{margin:0;font-size:0.82rem;line-height:1.5;color:var(--ink-soft)}
    .booking-promo-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
    .promo-pill{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:999px;
      background:rgba(255,255,255,0.78);border:1px solid rgba(20,90,99,0.14);
      color:var(--ink);font-size:0.74rem;font-weight:700;text-decoration:none;
      transition:transform var(--motion-fast) var(--motion-ease)}
    .promo-pill:hover{transform:translateY(-1px)}
    .contact-note{margin:0 0 14px;font-size:0.88rem;line-height:1.6;color:var(--ink-soft)}

    /* ── Accordion ── */
    .list{display:grid;gap:8px;margin-top:8px;padding:0;list-style:none}
    .accordion-item{list-style:none}
    .accordion-card{border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,0.52);overflow:hidden;
      transition:border-color var(--ease),background var(--ease)}
    body.theme-night .accordion-card{background:rgba(255,255,255,0.03)}
    .accordion-summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:32px 1fr auto;gap:8px;align-items:center;padding:8px 10px}
    .accordion-summary::-webkit-details-marker{display:none}
    .accordion-arrow{width:22px;height:22px;border-radius:999px;display:grid;place-items:center;background:rgba(20,90,99,0.08);color:var(--brand);font-size:0.68rem;transition:transform 160ms var(--ease)}
    details[open] .accordion-arrow{transform:rotate(180deg)}
    .list-icon{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:rgba(20,90,99,0.1);color:var(--brand);font-size:0.8rem}
    .summary-copy strong{display:block;color:var(--ink);font-size:0.82rem;line-height:1.25}
    .accordion-content{padding:0 10px 0 50px;color:var(--ink-soft);font-size:0.78rem;line-height:1.4;max-height:0;opacity:0;overflow:hidden;transform:translateY(-8px);
      transition:max-height 180ms var(--ease),opacity 140ms var(--ease),transform 140ms var(--ease),padding 180ms var(--ease)}
    details[open] > .accordion-content{max-height:3200px;opacity:1;transform:translateY(0);padding:0 10px 8px 50px}
    .placeholder-note{margin-top:6px;padding:8px 10px;border-radius:12px;background:rgba(20,90,99,0.06);border:1px dashed rgba(20,90,99,0.22);font-size:0.76rem}
    .accordion-content p{margin:0}
    body.theme-night .summary-copy strong{color:#f6fbfc}
    body.theme-night .accordion-content{color:#d8edf1}
    body.theme-night .placeholder-note{color:#e8f7fa;background:rgba(127,227,241,0.1);border-color:rgba(127,227,241,0.24)}

    /* ── Photo gallery ── */
    .gallery-shell{display:grid;gap:10px;margin-top:12px}
    .gallery-stage{position:relative;overflow:hidden;min-height:280px;border-radius:18px;
      background:rgba(20,90,99,0.08);border:1px solid var(--line);touch-action:pan-y}
    .gallery-slide{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.02);
      transition:opacity 320ms var(--ease),transform 1800ms var(--ease);user-select:none;-webkit-user-drag:none;cursor:pointer}
    .gallery-slide.active{opacity:1;transform:scale(1)}
    .gallery-toolbar{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center}
    .gallery-arrow{width:38px;height:38px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,0.84);
      color:var(--brand);display:grid;place-items:center;cursor:pointer;font:inherit}
    body.theme-night .gallery-arrow{background:rgba(255,255,255,0.05);color:#d6eef3}
    .gallery-counter{text-align:center;color:var(--ink-soft);font-size:0.8rem;font-weight:700}

    /* ── Area / environment ── */
    .tips-list,.house-list,.nearby-list{display:grid;gap:10px;margin-top:12px}
    .tips-list{grid-template-columns:1fr;gap:12px}
    .area-overview{position:relative;overflow:hidden;background:linear-gradient(145deg,rgba(255,255,255,0.96),rgba(247,241,230,0.92))}
    .area-overview::before{content:'';position:absolute;width:180px;height:180px;right:-40px;top:-40px;border-radius:999px;background:radial-gradient(circle,rgba(230,125,77,0.16),rgba(230,125,77,0));pointer-events:none}
    body.theme-night .area-overview{background:linear-gradient(145deg,rgba(17,39,51,0.96),rgba(12,30,40,0.92))}
    .area-kicker{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border-radius:999px;background:rgba(20,90,99,0.08);color:var(--brand);font-size:0.7rem;font-weight:800;margin-bottom:8px;position:relative;z-index:1}
    .area-highlights{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;position:relative;z-index:1}
    .area-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px;position:relative;z-index:1}
    .area-quick-card{display:grid;gap:6px;align-content:start;padding:12px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,0.72);color:inherit;text-decoration:none;text-align:left;cursor:pointer;font:inherit}
    body.theme-night .area-quick-card{background:rgba(255,255,255,0.03)}
    .area-quick-card i{width:34px;height:34px;display:grid;place-items:center;border-radius:12px;background:rgba(20,90,99,0.08);color:var(--brand);font-size:0.92rem}
    .area-quick-card strong{color:var(--ink);font-size:0.82rem;line-height:1.2}
    .area-quick-card span{color:var(--ink-soft);font-size:0.73rem;line-height:1.35}
    .area-highlight-pill{display:inline-flex;align-items:center;gap:5px;padding:6px 9px;font:inherit;border-radius:999px;border:1px solid rgba(20,90,99,0.14);background:rgba(255,255,255,0.74);color:var(--ink);font-size:0.72rem;font-weight:700;cursor:pointer}
    body.theme-night .area-highlight-pill{background:rgba(255,255,255,0.04);border-color:rgba(139,202,219,0.18);color:var(--ink)}
    .area-sections{display:grid;gap:10px;margin-top:12px}
    .area-group{border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,0.92);box-shadow:0 16px 36px rgba(15,53,60,0.08);overflow:hidden;transition:border-color 160ms var(--ease),background 160ms var(--ease)}
    body.theme-night .area-group{background:rgba(14,34,45,0.94);border-color:rgba(139,202,219,0.22)}
    .area-group-summary{list-style:none;display:grid;grid-template-columns:28px 1fr 28px;gap:10px;align-items:center;padding:13px 14px;cursor:pointer}
    .area-group-summary::-webkit-details-marker,.area-item-summary::-webkit-details-marker{display:none}
    .area-group-icon{color:var(--brand);font-size:1rem;text-align:center}
    .area-group-title{color:var(--brand);font-weight:800;font-size:0.9rem;display:flex;align-items:center;justify-content:center;gap:8px;text-align:center}
    .area-group-count{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;padding:0 8px;border-radius:999px;background:rgba(20,90,99,0.08);font-size:0.74rem}
    .area-group-arrow{color:var(--brand);font-size:0.9rem;text-align:center;transition:transform 160ms var(--ease)}
    .area-group[open] .area-group-arrow,.area-item[open] .area-item-arrow{transform:rotate(180deg)}
    .area-group-body{padding:0 10px 0;display:grid;gap:8px;max-height:0;opacity:0;overflow:hidden;transform:translateY(-8px);
      transition:max-height 200ms var(--ease),opacity 150ms var(--ease),transform 150ms var(--ease),padding 200ms var(--ease)}
    .area-group[open] > .area-group-body{max-height:4000px;opacity:1;transform:translateY(0);padding:0 10px 10px}
    .area-item{border:1px solid var(--line);border-radius:16px;overflow:hidden;background:rgba(255,255,255,0.72);transition:border-color 160ms var(--ease),background 160ms var(--ease)}
    body.theme-night .area-item{background:rgba(255,255,255,0.03)}
    .area-item-summary{list-style:none;display:grid;grid-template-columns:60px 1fr 24px;gap:10px;align-items:center;padding:8px;cursor:pointer}
    .area-thumb,.area-thumb-placeholder{width:60px;height:60px;border-radius:14px;display:block;object-fit:cover;flex:0 0 auto;border:1px solid var(--line)}
    .area-thumb-placeholder{display:grid;place-items:center;background:rgba(20,90,99,0.08);color:var(--brand);font-size:1rem}
    .area-item-copy strong{display:block;color:var(--ink);font-size:0.86rem;margin-bottom:3px;line-height:1.25}
    .area-item-copy span{display:block;color:var(--ink-soft);font-size:0.76rem;line-height:1.35}
    .area-item-arrow{color:var(--brand);font-size:0.88rem;text-align:center;transition:transform 160ms var(--ease)}
    .area-item-content{padding:0 8px 0;max-height:0;opacity:0;overflow:hidden;transform:translateY(-8px);
      transition:max-height 180ms var(--ease),opacity 140ms var(--ease),transform 140ms var(--ease),padding 180ms var(--ease)}
    .area-item[open] > .area-item-content{max-height:1600px;opacity:1;transform:translateY(0);padding:0 8px 8px}
    .area-detail-image{width:100%;height:148px;object-fit:cover;border-radius:14px;border:1px solid var(--line);margin-bottom:10px;display:block}
    .area-item-content p{color:var(--ink-soft);font-size:0.82rem;line-height:1.42;margin:0}
    .restaurant-meta-line{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0 2px}
    .restaurant-rating-value,.restaurant-price-chip,.restaurant-cuisine-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;font-size:0.68rem;font-weight:800;line-height:1}
    .restaurant-rating-value{background:rgba(215,155,34,0.16);color:#8a6115}
    .restaurant-cuisine-chip{background:rgba(20,90,99,0.08);color:var(--brand)}
    body.theme-night .restaurant-rating-value{background:rgba(215,155,34,0.22);color:#ffdf98}
    .area-badge-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
    .supermarket-links{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px}
    .area-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;background:rgba(20,90,99,0.08);color:var(--brand);font-size:0.68rem;font-weight:800;line-height:1}
    .area-badge--plain{background:rgba(20,90,99,0.06)}
    body.theme-night .area-badge{background:rgba(139,202,219,0.12);color:#d6eef3}
    .supermarket-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,0.72)}
    body.theme-night .supermarket-row{background:rgba(255,255,255,0.03)}
    .supermarket-copy{display:grid;gap:6px;min-width:0}
    .supermarket-line{min-width:0;display:flex;align-items:center;gap:6px;overflow:hidden;white-space:nowrap}
    .supermarket-title{min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:0.8rem;font-weight:700;color:var(--ink)}
    .supermarket-meta{flex:0 0 auto;font-size:0.72rem;color:var(--ink-soft)}
    .supermarket-link{display:inline-flex;align-items:center;gap:5px;color:var(--brand);text-decoration:none;font-size:0.74rem;font-weight:700;white-space:nowrap}
    .supermarket-mini-map,.maps-link{display:inline-flex;align-items:center;gap:5px;padding:4px 0;color:var(--brand);text-decoration:none;font-size:0.69rem;font-weight:800}
    .supermarket-mini-map:hover,.maps-link:hover{text-decoration:underline}
    .tag{padding:2px 8px;border-radius:999px;background:color-mix(in srgb,var(--brand) 10%,transparent);color:var(--brand);font-size:0.68rem;font-weight:700}

    /* ── Contact ── */
    .contact-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
    .contact-item:last-child{border-bottom:none}
    .contact-icon{width:36px;height:36px;border-radius:999px;display:flex;align-items:center;
      justify-content:center;background:color-mix(in srgb,var(--brand) 10%,transparent);
      color:var(--brand);font-size:0.95rem;flex:none}
    .contact-label{font-size:0.72rem;color:var(--ink-soft);font-weight:600}
    .contact-value{font-size:0.88rem;font-weight:700;color:var(--ink);text-decoration:none}
    .contact-value:hover{color:var(--brand)}
    .wa-btn{display:flex;align-items:center;gap:8px;margin-top:14px;padding:12px 18px;
      background:#25d366;color:#fff;border-radius:999px;text-decoration:none;font-weight:800;
      font-size:0.88rem;justify-content:center;transition:filter 160ms}
    .wa-btn:hover{filter:brightness(1.06)}

    /* ── Bottom nav ── */
    .bottom-nav{position:fixed;left:0;right:0;bottom:0;width:100%;max-width:520px;margin:0 auto;
      z-index:30;display:grid;grid-template-columns:repeat(5,1fr);gap:5px;
      background:color-mix(in srgb,var(--bg) 92%,transparent);
      border-top:1px solid var(--line);backdrop-filter:blur(14px);
      padding:6px 6px calc(env(safe-area-inset-bottom) + 8px)}
    .install-hint{position:fixed;left:12px;right:12px;bottom:calc(68px + env(safe-area-inset-bottom));z-index:40;max-width:496px;margin:0 auto;transition:opacity var(--motion-fast) var(--motion-ease),transform var(--motion-fast) var(--motion-ease),visibility var(--motion-fast) var(--motion-ease)}
    .install-hint.hidden{opacity:0;visibility:hidden;transform:translateY(12px);pointer-events:none}
    .install-hint-card{display:grid;grid-template-columns:56px 1fr auto;gap:8px;align-items:start;padding:10px 12px;border-radius:18px;background:rgba(255,250,241,0.96);border:1px solid var(--line);box-shadow:var(--shadow);backdrop-filter:blur(12px)}
    body.theme-night .install-hint-card{background:rgba(10,25,33,0.94);border-color:rgba(139,202,219,0.22)}
    .install-hint-copy{display:grid;gap:4px}
    .install-hint-copy strong{display:block;color:var(--ink);font-size:0.84rem;margin-bottom:3px}
    .install-hint-text{margin:0;color:var(--ink-soft);font-size:0.75rem;line-height:1.42}
    .install-hint-text strong{display:inline;font-size:inherit;margin:0}
    .install-hint-preview{width:56px;height:56px;border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow);background:rgba(255,255,255,0.72);flex:0 0 auto}
    .install-hint-preview img{width:100%;height:100%;object-fit:cover;display:block}
    .install-inline-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin:0 2px;border-radius:999px;background:rgba(20,90,99,0.08);color:var(--brand);font-size:0.66rem;vertical-align:-2px}
    .install-hint-dismiss{width:24px;height:24px;border:0;border-radius:999px;background:rgba(20,90,99,0.08);color:var(--brand);cursor:pointer;font:inherit}
    body.theme-night .install-inline-icon,body.theme-night .install-hint-dismiss{background:rgba(70,174,181,0.12);color:#d6eef3}
    .tab-btn{display:grid;justify-items:center;gap:3px;
      padding:6px 4px;border:none;border-radius:12px;background:none;cursor:pointer;font:inherit;
      color:var(--ink-soft);font-size:0.67rem;font-weight:700;
      transition:color 200ms var(--ease),background 200ms var(--ease)}
    .tab-btn.active{color:#fff;background:linear-gradient(135deg,var(--brand),var(--brand-2))}
    .tab-btn i{font-size:0.92rem;transition:transform 200ms var(--ease)}
    .tab-btn.active i{transform:translateY(-1px)}
    body.theme-night .icon-btn,
    body.theme-night .quick-link,
    body.theme-night .tab-btn,
    body.theme-night .contact-label,
    body.theme-night .contact-note{color:#d8edf1}
    body.theme-night .card-title,
    body.theme-night .contact-value{color:#f6fbfc}
    body.theme-night .booking-promo-card{background:linear-gradient(145deg,rgba(16,39,51,0.96),rgba(12,30,40,0.94))}
    body.theme-night .promo-pill{background:rgba(255,255,255,0.05);border-color:rgba(139,202,219,0.2);color:var(--ink)}
    body.theme-night .action-btn.soft{color:#d6eef3;background:rgba(70,174,181,0.12);border-color:rgba(139,202,219,0.24)}
    body.theme-night .settings-block,
    body.theme-night .quick-link{background:rgba(255,255,255,0.06)!important;border-color:rgba(255,255,255,0.14)!important}
    body.theme-night .icon-btn{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.12)}
    body.theme-night .tab-btn.active{color:#fff}
    body.theme-night .contact-value:hover,
    body.theme-night .quick-link.active{color:#7fe3f1}

    /* ── Lightbox ── */
    .lightbox{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.92);
      display:flex;align-items:center;justify-content:center;padding:16px;
      opacity:0;pointer-events:none;transition:opacity 240ms}
    .lightbox.open{opacity:1;pointer-events:auto}
    .lightbox img{max-width:100%;max-height:90vh;border-radius:var(--radius-md);object-fit:contain}
    .lightbox-close{position:absolute;top:16px;right:16px;width:40px;height:40px;border-radius:999px;
      background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);
      color:#fff;font-size:1.1rem;display:flex;align-items:center;justify-content:center;cursor:pointer}
    a{color:var(--brand)}
  </style>
</head>
<body>
${installHint}
${languageGate}
${settingsPanel}
<div class="app">

  <!-- Topbar -->
  <header class="topbar">
    <div class="brand">
      <strong id="brand-title"><i class="fa-solid fa-house-chimney brand-home-icon"></i><span class="brand-title-main" data-i18n="meta.title">${escapeHtml(allContent[defaultLang].meta.title || meta.title)}</span></strong>
    </div>
    <div class="topbar-actions">
      ${hasMultipleLangs ? `
      <div class="language-menu" id="language-menu">
        <button class="icon-btn language-menu-toggle" id="language-menu-toggle" type="button" aria-label="Taal kiezen" aria-haspopup="true" aria-expanded="false">
          <span class="toolbar-lang-flag" id="toolbar-lang-flag" aria-hidden="true">${langFlagMap[defaultLang] ?? '🌐'}</span>
          <i class="fa-solid fa-chevron-down language-menu-caret" aria-hidden="true"></i>
        </button>
        <div class="language-menu-panel" id="language-menu-panel" hidden>
          ${allLangs.map(l => `<button class="lang-btn${l === defaultLang ? ' active' : ''}" type="button" data-lang="${l}" data-lang-code="${langNameMap[l]}" data-lang-flag="${langFlagMap[l]}" aria-label="${langFullNameMap[l]}"><span class="lang-btn-flag" aria-hidden="true">${langFlagMap[l]}</span><span class="lang-btn-text">${langFullNameMap[l]}</span></button>`).join('')}
        </div>
      </div>` : ''}
      <button class="icon-btn" id="theme-toggle" type="button" aria-label="Thema wisselen">
        <i class="fa-solid fa-moon" id="theme-icon"></i>
      </button>
      <button class="icon-btn" id="settings-toggle" type="button" aria-label="Instellingen openen">
        <i class="fa-solid fa-sliders"></i>
      </button>
    </div>
  </header>

  <!-- Welcome view -->
  <div id="view-welcome" class="view active">

    <!-- Hero -->
    <div class="hero" data-section-id="hero">
      <div class="hero-slider" id="hero-slider">
        ${heroSlides || ''}
      </div>
      <div class="hero-content">
        <div class="eyebrow" data-i18n="hero.eyebrow">${escapeHtml(allContent[defaultLang].hero.eyebrow ?? '')}</div>
        <h1 data-i18n="hero.heading">${escapeHtml(allContent[defaultLang].hero.heading)}</h1>
        <p class="hero-sub" data-i18n="hero.subheading">${escapeHtml(allContent[defaultLang].hero.subheading ?? '')}</p>
        ${heroDots}
      </div>
    </div>

    ${countdownBlock}

    ${quickLinksData?.links?.length ? `
    <div class="quick-links" data-section-id="quick-links">
      ${quickLinksData.links.map(l => `
        <div class="quick-link" role="button" tabindex="0" onclick="handleQuickLink('${escapeAttr(l.action ?? '')}','${escapeAttr(l.url ?? '')}')">
          <i class="fa-solid ${escapeAttr(l.icon)}"></i>
          <strong data-i18n="sections.quickLinks.${escapeAttr(l.id)}">${escapeHtml((quickLinksContent[l.id] as string | undefined) ?? l.label)}</strong>
          <span data-i18n="sections.ui.${escapeAttr(
            l.action === 'house'
              ? 'quickLinkHouseBlurb'
              : l.action === 'photos'
                ? 'quickLinkPhotosBlurb'
                : l.action === 'area'
                  ? 'quickLinkAreaBlurb'
                  : 'quickLinkContactBlurb'
          )}">${escapeHtml(getQuickLinkBlurb(l.action))}</span>
        </div>`).join('')}
    </div>` : ''}

    ${bookingData?.showPromo && (bookingData.promoText || bookingData.bookingUrl) ? `
    <article class="card booking-promo-card" data-section-id="booking" id="welcome-booking-card">
      <div class="booking-promo-head">
        <div class="booking-kicker" id="booking-kicker">
          <i class="fa-solid fa-calendar-heart"></i> <span data-i18n="sections.ui.bookingKicker">${escapeHtml(uiContent.bookingKicker ?? 'Boek nog eens')}</span>
        </div>
        <div class="section-title">
          <h2 id="booking-title" data-i18n="sections.ui.bookingCta">${escapeHtml(uiContent.bookingCta ?? 'Boek snel opnieuw')}</h2>
        </div>
        ${bookingData.promoText ? `<p class="muted" id="booking-copy" data-i18n="sections.booking.promoText">${escapeHtml(bookingData.promoText)}</p>` : ''}
      </div>
      ${bookingData.bookingUrl ? `
      <div class="booking-promo-meta">
        <a class="promo-pill" id="booking-price-pill" href="${escapeAttr(ensureAbsoluteUrl(bookingData.bookingUrl))}" target="_blank" rel="noopener">
          <i class="fa-solid fa-tag"></i> <span data-i18n="sections.ui.bookingAvailability">${escapeHtml(uiContent.bookingAvailability ?? 'Direct beschikbaarheid bekijken')}</span>
        </a>
      </div>` : ''}
      <div class="action-row booking-promo-actions">
        ${bookingData.bookingUrl ? `
        <a class="action-btn route" id="booking-primary" href="${escapeAttr(ensureAbsoluteUrl(bookingData.bookingUrl))}" target="_blank" rel="noopener">
          <i class="fa-solid fa-bolt"></i>
          <span id="booking-primary-label" data-i18n="sections.ui.bookingCta">${escapeHtml(uiContent.bookingCta ?? 'Boek snel opnieuw')}</span>
        </a>` : ''}
        ${contactData?.phone ? `
        <a class="action-btn soft" id="booking-secondary" href="tel:${escapeAttr(contactData.phone)}">
          <i class="fa-solid fa-phone"></i>
          <span id="booking-secondary-label" data-i18n="sections.ui.bookingCall">${escapeHtml(uiContent.bookingCall ?? 'Bel direct')}</span>
        </a>` : ''}
      </div>
    </article>` : ''}
  </div>

  <!-- House view -->
  <div id="view-house" class="view">
    <div class="card" data-section-id="house-info">
      <div class="section-title">
        <h2>${renderAppIcon('house')} ${escapeHtml(allContent[defaultLang].nav.house)}</h2>
      </div>
      ${houseData?.coverImage ? `<img src="${escapeAttr(houseData.coverImage)}" alt="" style="width:100%;border-radius:var(--radius-lg);margin-bottom:14px;max-height:200px;object-fit:cover;display:block">` : ''}
      ${houseMainSections.length === 0 ? `<p data-i18n="sections.ui.emptyHouse" style="color:var(--ink-soft);font-size:0.85rem;text-align:center;margin:20px 0">${escapeHtml(uiContent.emptyHouse ?? 'Voeg huisinfo toe in de editor.')}</p>` : ''}
      <ul class="list house-list" data-accordion-scope="single">
        ${houseMainSections.map((sec, index) => `
        <li class="accordion-item">
          <details class="accordion-card"${sec.open || index === 0 ? ' open' : ''} data-state-key="house-${escapeAttr(sec.id)}">
            <summary class="accordion-summary">
              <div class="list-icon">${renderAppIcon(sec.icon)}</div>
              <div class="summary-copy">
                <strong data-i18n="sections.house.${escapeAttr(sec.id)}.title">${escapeHtml((houseContent[sec.id] as Record<string, string> | undefined)?.title ?? sec.title)}</strong>
              </div>
              <span class="accordion-arrow"><i class="fa-solid fa-chevron-down"></i></span>
            </summary>
            <div class="accordion-content">
              <div class="placeholder-note" data-i18n="sections.house.${escapeAttr(sec.id)}.body">${escapeHtml((houseContent[sec.id] as Record<string, string> | undefined)?.body ?? sec.body).replace(/\n/g, '<br>')}</div>
            </div>
          </details>
        </li>`).join('')}
      </ul>
    </div>
    ${amenitySections.length ? `
    <div class="card">
      <div class="section-title">
        <h2 data-i18n="sections.ui.amenitiesTitle">${escapeHtml(uiContent.amenitiesTitle ?? 'Voorzieningen')}</h2>
      </div>
      <ul class="list" data-accordion-scope="single">
        ${amenitySections.map((sec) => `
        <li class="accordion-item">
          <details class="accordion-card" data-state-key="amenity-${escapeAttr(sec.id)}">
            <summary class="accordion-summary">
              <div class="list-icon">${renderAppIcon(sec.icon)}</div>
              <div class="summary-copy">
                <strong data-i18n="sections.house.${escapeAttr(sec.id)}.title">${escapeHtml((houseContent[sec.id] as Record<string, string> | undefined)?.title ?? sec.title)}</strong>
              </div>
              <span class="accordion-arrow"><i class="fa-solid fa-chevron-down"></i></span>
            </summary>
            <div class="accordion-content">
              <div class="placeholder-note" data-i18n="sections.house.${escapeAttr(sec.id)}.body">${escapeHtml((houseContent[sec.id] as Record<string, string> | undefined)?.body ?? sec.body).replace(/\n/g, '<br>')}</div>
            </div>
          </details>
        </li>`).join('')}
      </ul>
    </div>` : ''}
  </div>

  <!-- Photos view -->
  <div id="view-photos" class="view">
    <div class="card" data-section-id="photos">
      <div class="section-title">
        <h2 data-i18n="nav.photos">${escapeHtml(allContent[defaultLang].nav.photos)}</h2>
      </div>
      <p class="muted" data-i18n="sections.ui.photosLead">${escapeHtml(uiContent.photosLead ?? 'Bekijk hier een snelle impressie van de accommodatie.')}</p>
      ${photoImages.length === 0
        ? `<p data-i18n="sections.ui.emptyPhotos" style="color:var(--ink-soft);font-size:0.85rem;text-align:center;margin:20px 0">${escapeHtml(uiContent.emptyPhotos ?? "Voeg foto's toe in de editor.")}</p>`
        : `<div class="gallery-shell">
            <div class="gallery-stage" id="photos-stage">
              ${photoImages.map((img, index) => `<img class="gallery-slide${index === 0 ? ' active' : ''}" src="${escapeAttr(img.url)}" alt="${escapeHtml(img.caption ?? `${meta.title} foto ${index + 1}`)}" loading="${index === 0 ? 'eager' : 'lazy'}" onclick="openLightbox('${escapeAttr(img.url)}')">`).join('')}
            </div>
            <div class="gallery-toolbar">
              <button class="gallery-arrow" id="photos-prev" type="button" aria-label="${escapeAttr(uiContent.galleryPrevLabel ?? 'Vorige foto')}"><i class="fa-solid fa-chevron-left"></i></button>
              <div class="gallery-counter" id="photos-counter">1 / ${photoImages.length}</div>
              <button class="gallery-arrow" id="photos-next" type="button" aria-label="${escapeAttr(uiContent.galleryNextLabel ?? 'Volgende foto')}"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
          </div>`
      }
    </div>
  </div>

  <!-- Area view -->
  <div id="view-area" class="view">
    <article class="card area-overview" data-section-id="area">
      <div class="section-title">
        <h2 data-i18n="sections.ui.areaTitle">${escapeHtml(uiContent.areaTitle ?? 'Omgeving')}</h2>
      </div>
      <div class="area-kicker"><i class="fa-solid fa-compass"></i> <span data-i18n="sections.ui.areaKicker">${escapeHtml(uiContent.areaKicker ?? 'Zorgvuldig geselecteerd rond het verblijf')}</span></div>
      <p class="muted">${escapeHtml(baseLocation)}</p>
      <div class="area-quick-grid">
        <button class="area-quick-card" type="button" data-area-target="shops">
          ${renderAppIcon('shopping-bag')}
          <strong data-i18n="sections.ui.quickCardShopsTitle">${escapeHtml(uiContent.quickCardShopsTitle ?? 'Dichtbij')}</strong>
          <span data-i18n="sections.ui.quickCardShopsText">${escapeHtml(uiContent.quickCardShopsText ?? 'Supermarkten en snelle boodschappen vlakbij.')}</span>
          <span class="tag">${areaCounts.shops}</span>
        </button>
        <button class="area-quick-card" type="button" data-area-target="tourism">
          <i class="fa-solid fa-camera-retro"></i>
          <strong data-i18n="sections.ui.quickCardTourismTitle">${escapeHtml(uiContent.quickCardTourismTitle ?? 'Ontdekken')}</strong>
          <span data-i18n="sections.ui.quickCardTourismText">${escapeHtml(uiContent.quickCardTourismText ?? 'Routes, uitzicht en lokale highlights.')}</span>
          <span class="tag">${areaCounts.tourism}</span>
        </button>
        <button class="area-quick-card" type="button" data-area-target="restaurants">
          <i class="fa-solid fa-utensils"></i>
          <strong data-i18n="sections.ui.quickCardRestaurantsTitle">${escapeHtml(uiContent.quickCardRestaurantsTitle ?? 'Eten')}</strong>
          <span data-i18n="sections.ui.quickCardRestaurantsText">${escapeHtml(uiContent.quickCardRestaurantsText ?? 'Restaurants in de buurt bekijken.')}</span>
          <span class="tag">${areaCounts.restaurants}</span>
        </button>
        <a class="area-quick-card" href="${escapeAttr(defaultAreaMapUrl.replace('&output=embed', ''))}" target="_blank" rel="noopener">
          <i class="fa-solid fa-map-location-dot"></i>
          <strong data-i18n="sections.ui.quickCardMapTitle">${escapeHtml(uiContent.quickCardMapTitle ?? 'Kaart')}</strong>
          <span data-i18n="sections.ui.quickCardMapText">${escapeHtml(uiContent.quickCardMapText ?? 'Open direct de omgeving in Google Maps.')}</span>
        </a>
      </div>
      <div class="area-highlights">
        <button class="area-highlight-pill" type="button" data-area-target="restaurants"><i class="fa-solid fa-utensils"></i>${escapeHtml(uiContent.restaurantsTitle ?? 'Restaurants')} • ${areaCounts.restaurants}</button>
        <button class="area-highlight-pill" type="button" data-area-target="tourism"><i class="fa-solid fa-landmark"></i>${escapeHtml(uiContent.tourismTitle ?? 'Tourism')} • ${areaCounts.tourism}</button>
        <button class="area-highlight-pill" type="button" data-area-target="shops"><i class="fa-solid fa-basket-shopping"></i>${escapeHtml(uiContent.shopsTitle ?? 'Shops')} • ${areaCounts.shops}</button>
      </div>
    </article>

    <div class="tips-list area-sections" id="nearby-list" data-accordion-scope="single">
      ${renderAreaSection('restaurants', uiContent.restaurantsTitle ?? 'Restaurants', 'sections.ui.restaurantsTitle', 'fa-solid fa-utensils', normalizedEnvironment.restaurants)}
      ${renderAreaSection('tourism', uiContent.tourismTitle ?? 'Tourism', 'sections.ui.tourismTitle', 'fa-solid fa-landmark', normalizedEnvironment.tourism)}
      ${renderAreaSection('shops', uiContent.shopsTitle ?? 'Shops', 'sections.ui.shopsTitle', 'fa-solid fa-basket-shopping', normalizedEnvironment.shops)}
      ${normalizedEnvironment.all.length === 0 ? `<p data-i18n="sections.ui.emptyNearby" style="color:var(--ink-soft);font-size:0.85rem;text-align:center;margin:20px 0">${escapeHtml(uiContent.emptyNearby ?? 'Voeg interessante plekken in de buurt toe in de editor.')}</p>` : ''}
    </div>
  </div>

  <!-- Info / Contact view -->
  <div id="view-contact" class="view">
    <div class="card" data-section-id="contact">
      <p class="card-title" data-i18n="sections.ui.contactTitle">${escapeHtml(uiContent.contactTitle ?? 'Contact')}</p>
      ${contactData?.note ? `<p class="contact-note" data-i18n="sections.contact.note">${escapeHtml(contactData.note)}</p>` : ''}
      ${contactData?.name ? `<div class="contact-item"><div class="contact-icon"><i class="fa-solid fa-user"></i></div><div><div class="contact-label" data-i18n="sections.ui.contactName">${escapeHtml(uiContent.contactName ?? 'Naam')}</div><div class="contact-value">${escapeHtml(contactData.name)}</div></div></div>` : ''}
      ${contactData?.phone ? `<div class="contact-item"><div class="contact-icon"><i class="fa-solid fa-phone"></i></div><div><div class="contact-label" data-i18n="sections.ui.contactPhone">${escapeHtml(uiContent.contactPhone ?? 'Telefoon')}</div><a class="contact-value" href="tel:${escapeAttr(contactData.phone)}">${escapeHtml(contactData.phone)}</a></div></div>` : ''}
      ${contactData?.email ? `<div class="contact-item"><div class="contact-icon"><i class="fa-solid fa-envelope"></i></div><div><div class="contact-label" data-i18n="sections.ui.contactEmail">${escapeHtml(uiContent.contactEmail ?? 'E-mail')}</div><a class="contact-value" href="mailto:${escapeAttr(contactData.email)}">${escapeHtml(contactData.email)}</a></div></div>` : ''}
      ${contactData?.address ? `<div class="contact-item"><div class="contact-icon"><i class="fa-solid fa-location-dot"></i></div><div><div class="contact-label" data-i18n="sections.ui.contactAddress">${escapeHtml(uiContent.contactAddress ?? 'Adres')}</div><div class="contact-value">${escapeHtml(contactData.address)}</div></div></div>` : ''}
      ${contactData?.whatsapp ? `<a class="wa-btn" href="https://wa.me/${contactData.whatsapp.replace(/\D/g,'')}" target="_blank"><i class="fa-brands fa-whatsapp" style="font-size:1.15rem"></i> WhatsApp</a>` : ''}
    </div>
  </div>

  <!-- Bottom nav -->
  <nav class="bottom-nav">
    <button class="tab-btn active" data-tab="welcome" onclick="switchTab('welcome',this)">
      ${renderAppIcon('house')}<span data-i18n="nav.welcome">${escapeHtml(allContent[defaultLang].nav.welcome)}</span>
    </button>
    <button class="tab-btn" data-tab="house" onclick="switchTab('house',this)">
      <i class="fa-solid fa-key"></i><span data-i18n="nav.house">${escapeHtml(allContent[defaultLang].nav.house)}</span>
    </button>
    <button class="tab-btn" data-tab="photos" onclick="switchTab('photos',this)">
      <i class="fa-solid fa-images"></i><span data-i18n="nav.photos">${escapeHtml(allContent[defaultLang].nav.photos)}</span>
    </button>
    <button class="tab-btn" data-tab="area" onclick="switchTab('area',this)">
      <i class="fa-solid fa-map-location-dot"></i><span data-i18n="nav.area">${escapeHtml(allContent[defaultLang].nav.area)}</span>
    </button>
    <button class="tab-btn" data-tab="contact" onclick="switchTab('contact',this)">
      <i class="fa-solid fa-circle-info"></i><span data-i18n="nav.info">${escapeHtml(allContent[defaultLang].nav.info)}</span>
    </button>
  </nav>
</div>

<!-- Lightbox -->
<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <button class="lightbox-close" onclick="closeLightbox()"><i class="fa-solid fa-xmark"></i></button>
  <img id="lightbox-img" src="" alt="">
</div>

<script>
(function(){
  var CONTENT = ${contentJSON};
  var inEditorPreview = !!(window.parent && window.parent !== window);
  var lang = inEditorPreview ? '${defaultLang}' : (localStorage.getItem('bnb-lang') || '${defaultLang}');
  if(!CONTENT[lang]) lang = '${defaultLang}';
  if(!inEditorPreview){
    document.body.classList.add('production-mode');
  }
  var slideIdx = 0;
  var slides = document.querySelectorAll('.hero-image');
  var dots = document.querySelectorAll('.hero-dot');
  var slideTimer;
  var photosCurrentSlide = 0;
  var nearbyView = inEditorPreview ? '${siteSettings.nearbyView}' : (localStorage.getItem('bnb-nearby-view') || '${siteSettings.nearbyView}');
  var textScale = inEditorPreview ? '${siteSettings.defaultTextScale}' : (localStorage.getItem('bnb-text-scale') || '${siteSettings.defaultTextScale}');
  var nightSetting = inEditorPreview ? '${siteSettings.defaultDarkMode ? '1' : '0'}' : (localStorage.getItem('bnb-night') || '${siteSettings.defaultDarkMode ? '1' : '0'}');
  var arrivalStr = inEditorPreview ? '${escapeHtml(initialArrivalDate)}' : (localStorage.getItem('bnb-arrival-date') || '${escapeHtml(initialArrivalDate)}');
  var checkoutStr = inEditorPreview ? '${escapeHtml(initialCheckoutDate)}' : (localStorage.getItem('bnb-checkout-date') || '${escapeHtml(initialCheckoutDate)}');

  function notifyParent(payload){
    if(inEditorPreview && window.parent){
      window.parent.postMessage(Object.assign({ type:'preview-settings-change' }, payload || {}), '*');
    }
  }

  // ── Tab navigation ──────────────────────────────────
  window.switchTab = function(name, btn){
    document.querySelectorAll('.view').forEach(function(v){v.classList.remove('active')});
    document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
    var view = document.getElementById('view-' + name);
    if(view) view.classList.add('active');
    if(btn) btn.classList.add('active');

    if(inEditorPreview && window.parent && window.parent !== window){
      var sectionMap = {
        welcome: 'hero',
        house: 'house-info',
        photos: 'photos',
        area: 'area',
        contact: 'contact',
      };
      var sectionId = sectionMap[name] || null;
      if(sectionId){
        window.parent.postMessage({ type:'preview-select-section', sectionId: sectionId }, '*');
      }
    }
  };

  window.addEventListener('message', function(event){
    var data = event.data || {};
    if(data.type === 'switch-tab' && data.tab){
      window.switchTab(data.tab, document.querySelector('[data-tab="' + data.tab + '"]'));
    }
    if(data.type === 'toggle-night'){
      toggleNight();
    }
    if(data.type === 'toggle-settings'){
      toggleSettings();
    }
  });

  window.handleQuickLink = function(action, url){
    if(action === 'house') return switchTab('house', document.querySelector('[data-tab="house"]'));
    if(action === 'photos') return switchTab('photos', document.querySelector('[data-tab="photos"]'));
    if(action === 'area') return switchTab('area', document.querySelector('[data-tab="area"]'));
    if(action === 'contact' || action === 'info') return switchTab('contact', document.querySelector('[data-tab="contact"]'));
    if(action === 'settings') return toggleSettings();
    if(action === 'language') return openLanguageGate();
    if(url) window.open(url, '_blank');
  };

  // ── Accordion ───────────────────────────────────────
  function getAccordionScope(detail){
    var scope = detail.parentElement && detail.parentElement.closest('[data-accordion-scope]');
    return scope || detail.parentElement;
  }
  function getScopeDetails(scope){
    return Array.from(scope.children).map(function(child){
      if(child.matches && child.matches('details')) return child;
      return child.querySelector && child.querySelector(':scope > details');
    }).filter(Boolean);
  }
  function finalizeAccordionState(detail){
    var summary = detail.querySelector(':scope > summary');
    if(summary) summary.setAttribute('aria-expanded', detail.hasAttribute('open') ? 'true' : 'false');
  }
  function bindAccordionBehavior(){
    document.querySelectorAll('details > summary').forEach(function(summary){
      summary.onclick = function(event){
        event.preventDefault();
        var detail = summary.parentElement;
        var shouldOpen = !detail.hasAttribute('open');

        if(shouldOpen){
          var scope = getAccordionScope(detail);
          if(scope){
            getScopeDetails(scope).forEach(function(sibling){
              if(sibling !== detail && sibling.hasAttribute('open')){
                sibling.removeAttribute('open');
                finalizeAccordionState(sibling);
              }
            });
          }
          detail.setAttribute('open', '');
        } else {
          detail.removeAttribute('open');
        }

        finalizeAccordionState(detail);
      };

      finalizeAccordionState(summary.parentElement);
    });
  }
  function openAreaSection(sectionKey){
    switchTab('area', document.querySelector('[data-tab="area"]'));
    window.setTimeout(function(){
      var target = document.querySelector('[data-area-section="' + sectionKey + '"]');
      if(!target) return;

      document.querySelectorAll('.area-group').forEach(function(group){
        if(group !== target) group.removeAttribute('open');
        finalizeAccordionState(group);
      });

      target.setAttribute('open', '');
      finalizeAccordionState(target);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }
  function bindAreaHighlights(){
    document.querySelectorAll('[data-area-target]').forEach(function(button){
      button.onclick = function(){
        openAreaSection(button.getAttribute('data-area-target'));
      };
    });
  }

  // ── Photos gallery ───────────────────────────────────
  function updatePhotosCounter(){
    var counter = document.getElementById('photos-counter');
    var gallerySlides = Array.from(document.querySelectorAll('#photos-stage .gallery-slide'));
    if(!counter || !gallerySlides.length) return;
    counter.textContent = (photosCurrentSlide + 1) + ' / ' + gallerySlides.length;
  }
  function setPhotosSlide(nextIndex){
    var gallerySlides = Array.from(document.querySelectorAll('#photos-stage .gallery-slide'));
    if(!gallerySlides.length) return;
    gallerySlides[photosCurrentSlide].classList.remove('active');
    photosCurrentSlide = (nextIndex + gallerySlides.length) % gallerySlides.length;
    gallerySlides[photosCurrentSlide].classList.add('active');
    updatePhotosCounter();
  }
  function bindPhotosButtons(){
    var prev = document.getElementById('photos-prev');
    var next = document.getElementById('photos-next');
    if(prev) prev.onclick = function(){ setPhotosSlide(photosCurrentSlide - 1); };
    if(next) next.onclick = function(){ setPhotosSlide(photosCurrentSlide + 1); };
  }
  function bindPhotosSliderGestures(){
    var stage = document.getElementById('photos-stage');
    if(!stage) return;
    var startX = 0;
    stage.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function(e){
      var deltaX = e.changedTouches[0].clientX - startX;
      if(Math.abs(deltaX) > 40){
        setPhotosSlide(photosCurrentSlide + (deltaX < 0 ? 1 : -1));
      }
    }, { passive: true });
  }
  bindPhotosButtons();
  bindPhotosSliderGestures();
  updatePhotosCounter();

  // ── Hero slider ─────────────────────────────────────
  window.goSlide = function(i){
    if(!slides.length) return;
    slides[slideIdx].classList.remove('active');
    dots[slideIdx] && dots[slideIdx].classList.remove('active');
    slideIdx = i;
    slides[slideIdx].classList.add('active');
    dots[slideIdx] && dots[slideIdx].classList.add('active');
    clearInterval(slideTimer);
    slideTimer = setInterval(nextSlide, 5000);
  };
  function nextSlide(){ goSlide((slideIdx+1) % Math.max(slides.length,1)); }
  if(slides.length > 1) slideTimer = setInterval(nextSlide, 5000);

  // ── Hero swipe ──────────────────────────────────────
  var hero = document.querySelector('.hero');
  if(hero){
    var sx = 0;
    hero.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive:true});
    hero.addEventListener('touchend', function(e){
      var dx = e.changedTouches[0].clientX - sx;
      if(Math.abs(dx) > 40) goSlide((slideIdx + (dx < 0 ? 1 : -1) + slides.length) % Math.max(slides.length,1));
    }, {passive:true});
  }

  // ── Countdown ───────────────────────────────────────
  function getCountdownCopy(){
    return {
      nl: {
        tomorrow: 'Morgen is het zover!',
        arrival: 'Nog {count} dagen tot uw aankomst',
        departureToday: 'Vandaag is uw vertrekdag',
        departure: 'Nog {count} nacht{suffix} te genieten',
        checkout: 'checkout',
      },
      en: {
        tomorrow: 'Tomorrow is the day!',
        arrival: '{count} day{suffix} until your arrival',
        departureToday: 'Today is your departure day',
        departure: '{count} night{suffix} left to enjoy',
        checkout: 'checkout',
      },
      de: {
        tomorrow: 'Morgen ist es so weit!',
        arrival: 'Noch {count} Tage bis zu Ihrer Ankunft',
        departureToday: 'Heute ist Ihr Abreisetag',
        departure: 'Noch {count} Nacht{suffix} zum Genießen',
        checkout: 'Check-out',
      },
      fr: {
        tomorrow: 'C’est pour demain !',
        arrival: 'Encore {count} jour{suffix} avant votre arrivée',
        departureToday: 'Aujourd’hui est votre jour de départ',
        departure: 'Encore {count} nuit{suffix} à profiter',
        checkout: 'départ',
      }
    }[lang] || {
      tomorrow: 'Tomorrow is the day!',
      arrival: '{count} days until your arrival',
      departureToday: 'Today is your departure day',
      departure: '{count} nights left to enjoy',
      checkout: 'checkout',
    };
  }
  function updateCountdown(){
    var bar = document.getElementById('hero-countdown');
    if(!bar) return;
    if(!arrivalStr) {
      bar.hidden = true;
      return;
    }
    var now = new Date(); now.setHours(0,0,0,0);
    var arr = arrivalStr ? new Date(arrivalStr + 'T00:00:00') : null;
    var chk = checkoutStr ? new Date(checkoutStr + 'T00:00:00') : null;
    var txt = document.getElementById('hero-countdown-text');
    var dtTextEl = document.getElementById('hero-countdown-date-text');
    var copy = getCountdownCopy();
    var suffix = function(count){
      if(count === 1) return '';
      if(lang === 'nl') return 'en';
      if(lang === 'de') return 'e';
      if(lang === 'fr') return 's';
      return 's';
    };
    if(arr && !isNaN(arr.getTime()) && now < arr){
      var diff = Math.round((arr - now) / 86400000);
      if(txt) txt.textContent = diff === 1 ? copy.tomorrow : copy.arrival.replace('{count}', diff).replace('{suffix}', suffix(diff));
      if(dtTextEl) dtTextEl.textContent = arr.toLocaleDateString(lang === 'nl' ? 'nl-NL' : lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-GB',{day:'2-digit',month:'short',year:'numeric'});
      bar.hidden = false;
    } else if(arr && !isNaN(arr.getTime()) && Math.round((now - arr) / 86400000) === 0){
      if(txt) txt.textContent = copy.departureToday;
      if(dtTextEl) dtTextEl.textContent = arr.toLocaleDateString(lang === 'nl' ? 'nl-NL' : lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : 'en-GB',{day:'2-digit',month:'short',year:'numeric'});
      bar.hidden = false;
    } else {
      bar.hidden = true;
    }
  }
  updateCountdown();

  // ── Dark mode ───────────────────────────────────────
  function applyNight(on){
    document.body.classList.toggle('theme-night', on);
    var icon = document.getElementById('theme-icon');
    if(icon){ icon.className = on ? 'fa-solid fa-sun' : 'fa-solid fa-moon'; }
    var dayBtn = document.getElementById('theme-day-btn');
    var nightBtn = document.getElementById('theme-night-btn');
    if(dayBtn) dayBtn.classList.toggle('active', !on);
    if(nightBtn) nightBtn.classList.toggle('active', on);
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    if(themeMeta) themeMeta.content = on ? '#0a1921' : '${escapeHtml(theme.brand)}';
    if(!inEditorPreview) localStorage.setItem('bnb-night', on ? '1' : '0');
  }

  function readCountdownWithStorage(){
    var a = localStorage.getItem('bnb-arrival-date');
    var c = localStorage.getItem('bnb-checkout-date');
    arrivalStr = a || '${escapeHtml(initialArrivalDate)}';
    checkoutStr = c || '${escapeHtml(initialCheckoutDate)}';
  }

  window.toggleNight = function(){
    var on = !document.body.classList.contains('theme-night');
    applyNight(on);
    notifyParent({ settings: { defaultDarkMode: on } });
  };
  var themeToggleBtn = document.getElementById('theme-toggle');
  if(themeToggleBtn){ themeToggleBtn.addEventListener('click', function(){ toggleNight(); }); }
  var settingsToggleBtn = document.getElementById('settings-toggle');
  if(settingsToggleBtn){
    settingsToggleBtn.addEventListener('click', function(){
      closeLanguageMenu();
      toggleSettings();
    });
  }
  applyNight(nightSetting === '1');

  // ── Settings panel ───────────────────────────────────
  function openSettingsPanel(){
    closeLanguageGate();
    document.body.classList.add('settings-panel-open');
    var panel = document.getElementById('settings-panel');
    if(panel) panel.classList.remove('hidden');
  }
  function closeSettingsPanel(){
    document.body.classList.remove('settings-panel-open');
    var panel = document.getElementById('settings-panel');
    if(panel) panel.classList.add('hidden');
  }
  window.toggleSettings = function(forceState){
    var panel = document.getElementById('settings-panel');
    if(!panel) return;
    if(forceState === false){ closeSettingsPanel(); return; }
    if(panel.classList.contains('hidden')){ openSettingsPanel(); }
    else { closeSettingsPanel(); }
  };
  function persistSettings(syncToParent){
    var scaleInput = document.getElementById('text-scale-range');
    var resolvedScale = scaleInput ? Number(scaleInput.value) : Number(textScale);
    var darkModeOn = document.body.classList.contains('theme-night');
    var arrivalInput = document.getElementById('settings-arrival');
    var arrival = arrivalInput ? arrivalInput.value : arrivalStr;
    textScale = String(resolvedScale);
    nightSetting = darkModeOn ? '1' : '0';
    arrivalStr = arrival;
    if(!inEditorPreview){
      localStorage.setItem('bnb-night', nightSetting);
      localStorage.setItem('bnb-text-scale', String(resolvedScale));
      localStorage.setItem('bnb-lang', lang);
      localStorage.setItem('bnb-nearby-view', nearbyView);
      localStorage.setItem('bnb-arrival-date', arrival);
    }
    if(syncToParent){
      notifyParent({
        defaultLanguage: lang,
        settings: {
          defaultDarkMode: darkModeOn,
          defaultTextScale: resolvedScale,
          nearbyView: nearbyView,
          arrivalDate: arrival,
        }
      });
    }
    updateCountdown();
  }
  window.saveSettings = function(event){
    if(event){ if(event.preventDefault) event.preventDefault(); if(event.stopPropagation) event.stopPropagation(); }
    persistSettings(true);
    return false;
  };
  window.saveAndCloseSettings = function(event){
    if(event){ if(event.preventDefault) event.preventDefault(); if(event.stopPropagation) event.stopPropagation(); }
    persistSettings(true);
    closeSettingsPanel();
    return false;
  };
  window.closeSettings = function(event){
    if(event){ if(event.preventDefault) event.preventDefault(); if(event.stopPropagation) event.stopPropagation(); }
    persistSettings(true);
    closeSettingsPanel();
    return false;
  };

  // ── Text scale ───────────────────────────────────────
  function applyTextScale(value){
    var safeValue = Math.min(1.35, Math.max(0.9, Number(value) || 1));
    document.documentElement.style.setProperty('--text-scale', safeValue.toFixed(2));
    var label = document.getElementById('settings-scale-value');
    if(label) label.textContent = Math.round(safeValue * 100) + '%';
    var gateLabel = document.getElementById('language-gate-scale-value');
    if(gateLabel) gateLabel.textContent = Math.round(safeValue * 100) + '%';
    var mainRange = document.getElementById('text-scale-range');
    if(mainRange) mainRange.value = safeValue.toFixed(2);
    var gateRange = document.getElementById('language-gate-scale-range');
    if(gateRange) gateRange.value = safeValue.toFixed(2);
  }
  applyTextScale(textScale);
  var textScaleRange = document.getElementById('text-scale-range');
  if(textScaleRange){
    textScaleRange.value = textScale;
    textScaleRange.addEventListener('input', function(e){
      var value = e.target.value;
      if(!inEditorPreview) localStorage.setItem('bnb-text-scale', value);
      applyTextScale(value);
      notifyParent({ settings: { defaultTextScale: Number(value) } });
    });
  }
  var languageGateScaleRange = document.getElementById('language-gate-scale-range');
  if(languageGateScaleRange){
    languageGateScaleRange.addEventListener('input', function(e){
      var value = e.target.value;
      if(!inEditorPreview) localStorage.setItem('bnb-text-scale', value);
      applyTextScale(value);
      notifyParent({ settings: { defaultTextScale: Number(value) } });
    });
  }

  // ── Language i18n ───────────────────────────────────
  function applyLang(l, syncToParent){
    var c = CONTENT[l];
    if(!c) return;
    lang = l;
    if(!inEditorPreview) localStorage.setItem('bnb-lang', l);
    document.documentElement.lang = l;
    // update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var key = el.getAttribute('data-i18n');
      var parts = key.split('.');
      var val = c;
      for(var i=0;i<parts.length;i++) val = val && val[parts[i]];
      if(typeof val === 'string') el.textContent = val;
    });
    // update document title
    if(c.meta && c.meta.title) document.title = c.meta.title;
    // mark active lang button in dropdown
    document.querySelectorAll('.lang-btn').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-lang') === l);
    });
    // update toolbar flag
    var activeBtn = document.querySelector('.lang-btn[data-lang="' + l + '"]');
    var toolbarFlag = document.getElementById('toolbar-lang-flag');
    if(activeBtn && toolbarFlag){
      toolbarFlag.textContent = activeBtn.getAttribute('data-lang-flag') || '🌐';
    }
    var prevPhotoBtn = document.getElementById('photos-prev');
    var nextPhotoBtn = document.getElementById('photos-next');
    if(prevPhotoBtn && c.sections && c.sections.ui && c.sections.ui.galleryPrevLabel){
      prevPhotoBtn.setAttribute('aria-label', c.sections.ui.galleryPrevLabel);
    }
    if(nextPhotoBtn && c.sections && c.sections.ui && c.sections.ui.galleryNextLabel){
      nextPhotoBtn.setAttribute('aria-label', c.sections.ui.galleryNextLabel);
    }
    bindAccordionBehavior();
    bindAreaHighlights();
    updateCountdown();
    if(typeof refreshInstallHint === 'function'){ refreshInstallHint(); }
    closeLanguageMenu();
    if(syncToParent) notifyParent({ defaultLanguage: l });
  }
  window.switchLang = function(l){ applyLang(l, true); };

  function closeLanguageMenu(){
    var menu = document.getElementById('language-menu');
    var panel = document.getElementById('language-menu-panel');
    var toggle = document.getElementById('language-menu-toggle');
    if(!menu || !panel) return;
    menu.classList.remove('is-open');
    panel.hidden = true;
    if(toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  function toggleLanguageMenu(){
    var menu = document.getElementById('language-menu');
    var panel = document.getElementById('language-menu-panel');
    var toggle = document.getElementById('language-menu-toggle');
    if(!menu || !panel) return;
    var shouldOpen = panel.hidden;
    menu.classList.toggle('is-open', shouldOpen);
    panel.hidden = !shouldOpen;
    if(toggle) toggle.setAttribute('aria-expanded', String(shouldOpen));
  }
  window.toggleLangMenu = function(){ toggleLanguageMenu(); };

  // language menu toggle click
  var langMenuToggle = document.getElementById('language-menu-toggle');
  if(langMenuToggle){
    langMenuToggle.addEventListener('click', function(e){
      e.stopPropagation();
      toggleLanguageMenu();
    });
  }
  // lang buttons click
  document.querySelectorAll('.lang-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var l = btn.getAttribute('data-lang');
      applyLang(l, true);
      if(!inEditorPreview) localStorage.setItem('bnb-lang-gate-dismissed', '1');
      closeLanguageMenu();
    });
  });

  // settings panel overlay click
  var settingsPanelEl = document.getElementById('settings-panel');
  if(settingsPanelEl){
    settingsPanelEl.addEventListener('click', function(event){
      if(event.target === settingsPanelEl){ closeSettingsPanel(); }
    });
  }

  // settings button handlers
  var settingsSaveCloseBtn = document.getElementById('settings-save-close');
  if(settingsSaveCloseBtn){
    settingsSaveCloseBtn.addEventListener('click', function(){ saveAndCloseSettings(); });
  }
  var settingsLanguageBtn = document.getElementById('settings-language-btn');
  if(settingsLanguageBtn){
    settingsLanguageBtn.addEventListener('click', function(){
      closeSettingsPanel();
      if(!inEditorPreview){
        localStorage.removeItem('bnb-lang');
        localStorage.removeItem('bnb-lang-gate-dismissed');
        localStorage.removeItem('bnb-text-scale');
        localStorage.removeItem('bnb-arrival-date');
        localStorage.removeItem('bnb-night');
      }
      applyTextScale(1);
      applyNight(false);
      arrivalStr = '';
      var arrInput = document.getElementById('settings-arrival');
      if(arrInput) arrInput.value = '';
      var gateArrInput = document.getElementById('language-gate-arrival');
      if(gateArrInput) gateArrInput.value = '';
      updateCountdown();
      setLanguageGateStep('select');
      openLanguageGate();
    });
  }
  var settingsResetScaleBtn = document.getElementById('settings-reset-scale');
  if(settingsResetScaleBtn){
    settingsResetScaleBtn.addEventListener('click', function(){
      applyTextScale(1);
      if(!inEditorPreview) localStorage.setItem('bnb-text-scale', '1');
    });
  }
  var themeDayBtn = document.getElementById('theme-day-btn');
  if(themeDayBtn){
    themeDayBtn.addEventListener('click', function(){ applyNight(false); notifyParent({ settings: { defaultDarkMode: false } }); });
  }
  var themeNightBtn = document.getElementById('theme-night-btn');
  if(themeNightBtn){
    themeNightBtn.addEventListener('click', function(){ applyNight(true); notifyParent({ settings: { defaultDarkMode: true } }); });
  }

  // outside click closes language menu
  document.addEventListener('click', function(e){
    var menu = document.getElementById('language-menu');
    if(menu && !menu.contains(e.target)){ closeLanguageMenu(); }
  });

  // arrival date sync between settings and language gate
  var settingsArrivalCtrl = document.getElementById('settings-arrival');
  var gateArrivalCtrl = document.getElementById('language-gate-arrival');

  function syncArrivalInputs(value){
    if(settingsArrivalCtrl) settingsArrivalCtrl.value = value || '';
    if(gateArrivalCtrl) gateArrivalCtrl.value = value || '';
  }
  function setArrivalDate(value){
    arrivalStr = value || '';
    if(arrivalStr){
      if(!inEditorPreview) localStorage.setItem('bnb-arrival-date', arrivalStr);
    } else {
      if(!inEditorPreview) localStorage.removeItem('bnb-arrival-date');
    }
    syncArrivalInputs(arrivalStr);
    updateCountdown();
  }

  if(settingsArrivalCtrl){
    settingsArrivalCtrl.value = arrivalStr;
    settingsArrivalCtrl.addEventListener('change', function(){ setArrivalDate(this.value); });
    settingsArrivalCtrl.addEventListener('input', function(){ setArrivalDate(this.value); });
  }
  if(gateArrivalCtrl){
    gateArrivalCtrl.value = arrivalStr;
    gateArrivalCtrl.addEventListener('change', function(){ setArrivalDate(this.value); });
    gateArrivalCtrl.addEventListener('input', function(){ setArrivalDate(this.value); });
  }

  if(CONTENT[lang]) applyLang(lang, false);
  updateCountdown();
  bindAccordionBehavior();
  bindAreaHighlights();

  // ── Language gate ────────────────────────────────────
  function openLanguageGate(){
    closeSettingsPanel();
    document.body.classList.add('language-gate-open');
    var gate = document.getElementById('language-gate');
    if(gate) gate.classList.remove('hidden');
  }
  function closeLanguageGate(){
    document.body.classList.remove('language-gate-open');
    var gate = document.getElementById('language-gate');
    if(gate) gate.classList.add('hidden');
  }
  function setLanguageGateStep(stepName){
    var selectStep = document.getElementById('language-step-select');
    var setupStep = document.getElementById('language-step-setup');
    var showSetup = stepName === 'setup';
    if(selectStep) selectStep.classList.toggle('hidden', showSetup);
    if(setupStep) setupStep.classList.toggle('hidden', !showSetup);
    // update gate title/copy based on step and language
    var gateTitle = document.getElementById('language-gate-title');
    var gateCopy = document.getElementById('language-gate-copy-text');
    if(gateTitle && gateCopy){
      if(showSetup){
        var setupTitles = { nl: 'Eenmalige instellingen', en: 'One-time setup', de: 'Einmalige Einstellungen', fr: 'Configuration unique' };
        var setupCopies = { nl: 'Stel eenmalig je tekstgrootte en aankomstdatum in.', en: 'Set your text size and arrival date once.', de: 'Stellen Sie Textgröße und Anreisedatum einmalig ein.', fr: 'Réglez la taille du texte et la date d\\'arrivée.' };
        gateTitle.textContent = setupTitles[lang] || setupTitles.en;
        gateCopy.textContent = setupCopies[lang] || setupCopies.en;
      } else {
        gateTitle.textContent = 'Choose language';
        gateCopy.textContent = 'Select your language below to start.';
      }
    }
  }
  // start-lang-btn click → select language, show setup step
  document.querySelectorAll('[data-start-lang]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var l = btn.getAttribute('data-start-lang');
      applyLang(l, true);
      setLanguageGateStep('setup');
    });
  });
  // language gate continue
  var gateContBtn = document.getElementById('language-gate-continue');
  if(gateContBtn){
    gateContBtn.addEventListener('click', function(){
      if(!inEditorPreview) localStorage.setItem('bnb-lang-gate-dismissed', '1');
      // sync gate arrival date to settings
      var gateArr = document.getElementById('language-gate-arrival');
      var settingsArr = document.getElementById('settings-arrival');
      if(gateArr && gateArr.value){
        arrivalStr = gateArr.value;
        if(settingsArr) settingsArr.value = gateArr.value;
        if(!inEditorPreview) localStorage.setItem('bnb-arrival-date', gateArr.value);
        updateCountdown();
      }
      // sync gate text scale
      var gateScale = document.getElementById('language-gate-scale-range');
      if(gateScale){
        applyTextScale(gateScale.value);
        if(!inEditorPreview) localStorage.setItem('bnb-text-scale', gateScale.value);
      }
      persistSettings(true);
      closeLanguageGate();
      switchTab('welcome', document.querySelector('[data-tab="welcome"]'));
    });
  }
  window.selectLanguage = function(l){
    applyLang(l, true);
    if(!inEditorPreview) localStorage.setItem('bnb-lang-gate-dismissed', '1');
    closeSettingsPanel();
    closeLanguageGate();
    switchTab('welcome', document.querySelector('[data-tab="welcome"]'));
  };
  if(inEditorPreview){
    closeLanguageGate();
  } else if(localStorage.getItem('bnb-lang-gate-dismissed') === '1'){
    closeLanguageGate();
  } else if(${siteSettings.languageGateEnabled ? 'true' : 'false'}){
    openLanguageGate();
  }

  // ── Install hint (App mode instructies) ──────────────
  var installHint = document.getElementById('install-hint');
  var installHintTitle = document.getElementById('install-hint-title');
  var installHintText = document.getElementById('install-hint-text');
  var installHintDismiss = document.getElementById('install-hint-dismiss');
  var installHintContent = {
    nl: { title: 'Installeer op je iPhone', text: 'Tik op <span class="install-inline-icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></span> en kies <strong>Voeg toe aan beginscherm</strong>.' },
    en: { title: 'Install on your iPhone', text: 'Tap <span class="install-inline-icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></span> in Safari and choose <strong>Add to Home Screen</strong>.' },
    de: { title: 'Auf dem iPhone installieren', text: 'Tippe in Safari auf <span class="install-inline-icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></span> und w\\u00e4hle <strong>Zum Home-Bildschirm</strong>.' },
    fr: { title: 'Installer sur votre iPhone', text: 'Touchez <span class="install-inline-icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></span> dans Safari et choisissez <strong>Sur l\\u2019\\u00e9cran d\\u2019accueil</strong>.' },
  };

  function isIosSafari(){
    var ua = window.navigator.userAgent;
    var isIos = /iPhone|iPad|iPod/.test(ua);
    var isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    return isIos && isSafari;
  }

  function isStandaloneMode(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function refreshInstallHint(){
    if(!installHint || !installHintTitle || !installHintText) return;
    var content = installHintContent[lang] || installHintContent.nl;
    installHintTitle.textContent = content.title;
    installHintText.innerHTML = content.text;
    var dismissed = localStorage.getItem('bnb-install-hint-dismissed') === '1';
    var show = isIosSafari() && !isStandaloneMode() && !dismissed;
    installHint.classList.toggle('hidden', !show);
  }

  if(installHintDismiss){
    installHintDismiss.addEventListener('click', function(){
      localStorage.setItem('bnb-install-hint-dismissed', '1');
      if(installHint) installHint.classList.add('hidden');
    });
  }

  refreshInstallHint();

  // ── Press animation & keyboard ──────────────────────
  function triggerPressAnimation(el){
    el.classList.add('is-pressed');
    setTimeout(function(){ el.classList.remove('is-pressed'); }, 260);
  }
  document.addEventListener('click', function(e){
    var pressable = e.target.closest ? e.target.closest('.lang-btn, .start-lang-btn, .icon-btn, .tab-btn, .link-btn, .quick-link, .action-btn') : null;
    if(pressable) triggerPressAnimation(pressable);
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      closeLanguageMenu();
      closeSettingsPanel();
    }
  });

  // ── Nearby view ──────────────────────────────────────
  function applyNearbyView(mode, syncToParent){
    nearbyView = mode;
    if(!inEditorPreview) localStorage.setItem('bnb-nearby-view', mode);
    var listPanel = document.getElementById('nearby-list-panel');
    var mapPanel = document.getElementById('nearby-map-panel');
    var listBtn = document.getElementById('nearby-list-btn');
    var mapBtn = document.getElementById('nearby-map-btn');
    if(listPanel) listPanel.hidden = mode !== 'list';
    if(mapPanel) mapPanel.hidden = mode !== 'map';
    if(listBtn) listBtn.classList.toggle('active', mode === 'list');
    if(mapBtn) mapBtn.classList.toggle('active', mode === 'map');
    if(syncToParent) notifyParent({ settings: { nearbyView: mode } });
  }
  window.toggleNearbyView = function(mode){ applyNearbyView(mode, true); };
  applyNearbyView(nearbyView, false);

  // ── Preview -> parent section select ─────────────────
  document.addEventListener('click', function(e){
    var section = e.target && e.target.closest ? e.target.closest('[data-section-id]') : null;
    if(section && window.parent && window.parent !== window){
      window.parent.postMessage({ type: 'preview-select-section', sectionId: section.getAttribute('data-section-id') }, '*');
    }
  });

  // ── Lightbox ────────────────────────────────────────
  window.openLightbox = function(src){
    var lb = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-img');
    if(!lb || !img) return;
    img.src = src;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.closeLightbox = function(e){
    var lb = document.getElementById('lightbox');
    if(lb) lb.classList.remove('open');
    document.body.style.overflow = '';
  };
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    closeLightbox();
    toggleSettings(false);
    closeLanguageGate();
  });

})();
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeAttr(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function ensureAbsoluteUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function renderAppIcon(icon: string, extraClass = ''): string {
  const faClass = mapAppIconToFa(icon)
  return `<i class="fa-solid ${faClass}${extraClass ? ` ${extraClass}` : ''}"></i>`
}

function googleMapsUrl(name: string, location?: string): string {
  const query = [name, location].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function getLocationMapsUrl(
  item: NonNullable<SiteData['environment']>['all'][number],
  location?: string
): string {
  if (item.google_maps_link?.trim()) {
    return item.google_maps_link
  }

  if (Number.isFinite(item.latitude) && Number.isFinite(item.longitude) && (item.latitude || item.longitude)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.latitude},${item.longitude}`)}`
  }

  return googleMapsUrl(item.name, location)
}

function formatDistanceLabel(distance: number, lang: Language): string {
  if (!Number.isFinite(distance)) return ''
  if (distance < 1) return `${Math.round(distance * 1000)} m`

  const value = distance.toFixed(1)
  const suffix: Record<Language, string> = {
    nl: 'km afstand',
    en: 'km away',
    de: 'km entfernt',
    fr: 'km',
  }

  return `${value} ${suffix[lang]}`
}

function getCategoryMarker(category: import('@/types').LocationCategory): string {
  switch (category) {
    case 'restaurant':
      return 'utensils'
    case 'shops':
      return 'shopping-bag'
    default:
      return 'map'
  }
}

function getCategoryBadge(category: import('@/types').LocationCategory, lang: Language): string {
  const labels: Record<Language, Record<import('@/types').LocationCategory, string>> = {
    nl: { restaurant: 'Restaurant', tourism: 'Toerisme', shops: 'Winkels' },
    en: { restaurant: 'Restaurant', tourism: 'Tourism', shops: 'Shops' },
    de: { restaurant: 'Restaurant', tourism: 'Tourismus', shops: 'Läden' },
    fr: { restaurant: 'Restaurant', tourism: 'Tourisme', shops: 'Boutiques' },
  }

  return labels[lang][category]
}
