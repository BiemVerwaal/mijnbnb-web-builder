// ─── Project / Site Types ─────────────────────────────────────────────────────

export type Plan = 'free' | 'starter' | 'pro' | 'business'

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  plan: Plan
  stripe_customer_id?: string
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  slug: string
  status: 'draft' | 'published'
  published_url?: string
  thumbnail_url?: string
  created_at: string
  updated_at: string
  site_data: SiteData
}

// ─── Site / Template Data Model ───────────────────────────────────────────────

export interface SiteData {
  meta: SiteMeta
  theme: SiteTheme
  settings: SiteSettings
  sections: Section[]
  environment?: EnvironmentData
  languages: Language[]
  defaultLanguage: string
  content: Record<string, SiteContent>
}

export interface SiteMeta {
  title: string
  subtitle?: string
  description?: string
  location?: string
  category?: string
  favicon?: string
  touchIcon?: string
}

export interface SiteSettings {
  languageGateEnabled: boolean
  settingsEnabled: boolean
  textScaleEnabled: boolean
  defaultDarkMode: boolean
  defaultTextScale: number
  nearbyView: 'list' | 'map'
}

export interface SiteTheme {
  brand: string
  brandLight: string
  accent: string
  bg: string
  bgSoft: string
  ink: string
  radius: 'soft' | 'round' | 'sharp'
  font: 'outfit' | 'inter' | 'system' | 'playfair' | 'montserrat'
  spacing?: 'compact' | 'comfortable' | 'open'
  shadow?: 'none' | 'soft' | 'strong'
}

export type Language = 'nl' | 'en' | 'de' | 'fr'

// ─── Sections ─────────────────────────────────────────────────────────────────

export type SectionType =
  | 'hero'
  | 'quick-links'
  | 'house-info'
  | 'photos'
  | 'area'
  | 'restaurants'
  | 'booking'
  | 'contact'
  | 'custom-text'
  | 'spacer'

export interface Section {
  id: string
  type: SectionType
  visible: boolean
  order: number
  data: SectionData
}

export type SectionData =
  | HeroData
  | QuickLinksData
  | HouseInfoData
  | PhotosData
  | AreaData
  | RestaurantsData
  | BookingData
  | ContactData
  | CustomTextData
  | SpacerData

export interface HeroData {
  images: string[]
  showCountdown: boolean
  arrivalDate?: string
  checkoutDate?: string
}

export interface QuickLinksData {
  links: QuickLink[]
}

export interface QuickLink {
  id: string
  icon: string
  label: string
  url?: string
  action?: string
}

export interface HouseInfoData {
  coverImage?: string
  sections: AccordionSection[]
}

export interface AccordionSection {
  id: string
  icon: string
  title: string
  body: string
  open?: boolean
}

export interface PhotosData {
  images: PhotoItem[]
}

export interface PhotoItem {
  id: string
  url: string
  caption?: string
  alt?: string
}

export interface AreaData {
  mapUrl?: string
  tips: AreaTip[]
}

export type LocationCategory = 'restaurant' | 'tourism' | 'shops'

export interface LocationDescriptions {
  nl: string
  en: string
  de: string
  fr: string
}

export interface Location {
  id: string
  name: string
  category: LocationCategory
  categories?: LocationCategory[]
  address: string
  latitude: number
  longitude: number
  rating?: number | null
  distance_from_bnb: number
  image_reference?: string
  google_maps_link?: string
  recommended_for_guests_reason?: string
  descriptions: LocationDescriptions
  selected?: boolean
}

export interface EnvironmentData {
  all: Location[]
  restaurants: Location[]
  tourism: Location[]
  shops: Location[]
}

export interface AreaTip {
  id: string
  emoji: string
  category: string
  title: string
  description: string
  photo?: string
  openingHours?: string
  contact?: string
  counter?: number
  distance?: string
  url?: string
}

export interface RestaurantsData {
  items: RestaurantItem[]
}

export interface RestaurantItem {
  id: string
  name: string
  description: string
  emoji: string
  tags: string[]
  photo?: string
  openingHours?: string
  contact?: string
  counter?: number
  url?: string
}

export interface BookingData {
  promoText?: string
  bookingUrl?: string
  showPromo: boolean
  promoExpiry?: string
  platforms: BookingPlatform[]
}

export interface BookingPlatform {
  id: string
  name: string
  url: string
  icon?: string
}

export interface ContactData {
  name?: string
  note?: string
  phone?: string
  email?: string
  whatsapp?: string
  address?: string
  socials: SocialLink[]
}

export interface SocialLink {
  id: string
  platform: string
  url: string
}

export interface CustomTextData {
  title?: string
  body: string
}

export interface SpacerData {
  height: number
}

// ─── Multilingual Content ─────────────────────────────────────────────────────

export interface SiteContent {
  meta: {
    title: string
    subtitle?: string
    description?: string
  }
  nav: {
    welcome: string
    house: string
    photos: string
    area: string
    info: string
  }
  hero: {
    eyebrow?: string
    heading: string
    subheading?: string
    countdownLabel?: string
  }
  sections: Record<string, unknown>
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  plan: Plan
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end: string
  created_at: string
}

export const PLAN_LIMITS: Record<Plan, { projects: number; storage_gb: number; customDomain: boolean }> = {
  free:     { projects: 10,  storage_gb: 0.5, customDomain: false },
  starter:  { projects: 3,   storage_gb: 2,   customDomain: false },
  pro:      { projects: 10,  storage_gb: 10,  customDomain: true  },
  business: { projects: 999, storage_gb: 50,  customDomain: true  },
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
