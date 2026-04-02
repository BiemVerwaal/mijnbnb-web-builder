import type {
  AccordionSection,
  AreaTip,
  EnvironmentData,
  Language,
  Location,
  LocationDescriptions,
  LocationCategory,
  PhotoItem,
  RestaurantItem,
  SiteContent,
  SiteData,
  SiteSettings,
  SiteTheme,
} from '@/types'
import { createEmptySiteData, DEFAULT_CONTENT } from '@/lib/template-engine'

export type WizardCategory =
  | 'bnb'
  | 'vakantiehuis'
  | 'stadsgids'
  | 'wellness'
  | 'familie'
  | 'natuur'

export type SuggestionKind = 'voorziening' | 'restaurant' | 'beleving' | 'route'

export type LocalizedTextMap = Partial<Record<Language, string>>

export interface WizardAddress {
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
  formatted?: string
  latitude?: number
  longitude?: number
}

export type WizardFacilityGroup =
  | 'bnb-facilities'
  | 'guest-services'
  | 'location-transport'
  | 'safety'
  | 'general'
  | 'outdoor'
  | 'sports-wellness'
  | 'parking'
  | 'food-drink'
  | 'business'
  | 'other'

export interface WizardFacility {
  id: string
  group: WizardFacilityGroup
  icon: string
  title: string
  description: string
  selected: boolean
  titleTranslations?: LocalizedTextMap
  descriptionTranslations?: LocalizedTextMap
  helperText?: string
  locationDetails?: string
  usageDetails?: string
  timingDetails?: string
}

export type WizardPhotoCategory = 'bnb-main' | 'room' | 'facility' | 'local-area'
export type WizardAiTextType = 'welcome' | 'facility' | 'suggestion' | 'location' | 'booking' | 'contact'

export interface WizardPhoto {
  id: string
  url: string
  category: WizardPhotoCategory
  caption?: string
  alt?: string
}

export interface WizardAppSettings extends SiteSettings {
  showCountdown: boolean
  arrivalDate?: string
  checkoutDate?: string
}

export interface WizardSuggestion {
  id: string
  kind: SuggestionKind
  source: 'google-maps' | 'tripadvisor' | 'local-ai' | 'openstreetmap'
  name: string
  description: string
  photo: string
  openingHours: string
  contact: string
  counter: number
  distance: string
  externalUrl?: string
  selected?: boolean
  x: number
  y: number
  latitude?: number
  longitude?: number
  tags: string[]
  descriptionTranslations?: LocalizedTextMap
}

export interface WizardLocation extends Location {
  selected: boolean
}

export interface WizardBookingDetails {
  promoText: string
  promoTranslations: LocalizedTextMap
  bookingUrl: string
}

export interface WizardContactDetails {
  name: string
  note: string
  noteTranslations: LocalizedTextMap
  address: string
  phone: string
  email: string
  whatsapp: string
}

export interface WizardBuildInput {
  name: string
  location: string
  address?: WizardAddress
  category: WizardCategory
  languages: Language[]
  defaultLanguage: Language
  welcomeMessage?: string
  welcomeTranslations?: LocalizedTextMap
  facilities?: WizardFacility[]
  photos?: WizardPhoto[]
  booking?: Partial<WizardBookingDetails>
  contact?: Partial<WizardContactDetails>
  appSettings?: Partial<WizardAppSettings>
  locations?: WizardLocation[]
  suggestions: WizardSuggestion[]
  theme?: Partial<SiteTheme>
}

const themePresets: Record<WizardCategory, Partial<SiteTheme>> = {
  bnb: {
    brand: '#145a63',
    brandLight: '#1e7d85',
    accent: '#e67d4d',
    bg: '#f8f4ec',
    bgSoft: '#fffaf1',
    ink: '#17313a',
  },
  vakantiehuis: {
    brand: '#2f6750',
    brandLight: '#468269',
    accent: '#cf8654',
    bg: '#f4f1e7',
    bgSoft: '#fbfaf4',
    ink: '#20322c',
  },
  stadsgids: {
    brand: '#183f58',
    brandLight: '#2d647f',
    accent: '#d68f58',
    bg: '#f5f0ea',
    bgSoft: '#fffaf5',
    ink: '#1f2d37',
  },
  wellness: {
    brand: '#40676a',
    brandLight: '#5c8b8f',
    accent: '#de8b73',
    bg: '#f7f3ef',
    bgSoft: '#fffaf7',
    ink: '#243238',
  },
  familie: {
    brand: '#28656c',
    brandLight: '#3e8790',
    accent: '#e58b55',
    bg: '#f8f4ec',
    bgSoft: '#fffaf1',
    ink: '#17313a',
  },
  natuur: {
    brand: '#305f50',
    brandLight: '#4a7f6d',
    accent: '#cb8658',
    bg: '#f3f1e7',
    bgSoft: '#faf8f0',
    ink: '#26362d',
  },
}

const categoryTitles: Record<Language, Record<WizardCategory, string>> = {
  nl: {
    bnb: 'BnB gastenapp',
    vakantiehuis: 'vakantiehuis app',
    stadsgids: 'lokale gids',
    wellness: 'wellness verblijf',
    familie: 'familieverblijf',
    natuur: 'natuurverblijf',
  },
  en: {
    bnb: 'B&B guest app',
    vakantiehuis: 'holiday home app',
    stadsgids: 'local guide',
    wellness: 'wellness stay',
    familie: 'family stay',
    natuur: 'nature stay',
  },
  de: {
    bnb: 'BnB Gäste-App',
    vakantiehuis: 'Ferienhaus-App',
    stadsgids: 'lokaler Guide',
    wellness: 'Wellness-Aufenthalt',
    familie: 'Familienaufenthalt',
    natuur: 'Naturaufenthalt',
  },
  fr: {
    bnb: 'app d’accueil BnB',
    vakantiehuis: 'app maison de vacances',
    stadsgids: 'guide local',
    wellness: 'séjour bien-être',
    familie: 'séjour familial',
    natuur: 'séjour nature',
  },
}

const heroEyebrows: Record<Language, string> = {
  nl: '✨ Alles voor je gasten op één plek',
  en: '✨ Everything your guests need in one place',
  de: '✨ Alles für Ihre Gäste an einem Ort',
  fr: '✨ Tout pour vos invités au même endroit',
}

const mapKindIcons: Record<SuggestionKind, string> = {
  voorziening: 'map',
  restaurant: 'utensils',
  beleving: 'sparkles',
  route: 'map',
}

const facilityDetailLabels: Record<Language, { location: string; usage: string; timing: string }> = {
  nl: { location: 'Locatie', usage: 'Instructie', timing: 'Tijden' },
  en: { location: 'Location', usage: 'Instructions', timing: 'Timing' },
  de: { location: 'Ort', usage: 'Anleitung', timing: 'Zeiten' },
  fr: { location: 'Emplacement', usage: 'Instructions', timing: 'Horaires' },
}

const facilitySeeds: Array<{
  id: string
  group: WizardFacilityGroup
  icon: string
  titleTranslations: Record<Language, string>
  descriptionTranslations: Record<Language, string>
}> = [
  {
    id: 'wifi',
    group: 'bnb-facilities',
    icon: 'wifi',
    titleTranslations: { nl: 'WiFi', en: 'WiFi', de: 'WLAN', fr: 'Wi-Fi' },
    descriptionTranslations: {
      nl: 'Deel duidelijk de netwerknaam, het wachtwoord en waar gasten de snelste verbinding vinden.',
      en: 'Clearly share the network name, password, and where guests get the best connection.',
      de: 'Teilen Sie klar den Netzwerknamen, das Passwort und den Ort mit der besten Verbindung.',
      fr: 'Indiquez clairement le nom du réseau, le mot de passe et l’endroit où la connexion est la meilleure.',
    },
  },
  {
    id: 'parking',
    group: 'bnb-facilities',
    icon: 'car',
    titleTranslations: { nl: 'Parkeren', en: 'Parking', de: 'Parken', fr: 'Stationnement' },
    descriptionTranslations: {
      nl: 'Leg uit waar gasten kunnen parkeren, of er vaste plekken zijn en welke tijden handig zijn.',
      en: 'Explain where guests can park, whether there are dedicated spots, and which times are most convenient.',
      de: 'Erklären Sie, wo Gäste parken können, ob es feste Plätze gibt und welche Zeiten praktisch sind.',
      fr: 'Expliquez où les invités peuvent se garer, s’il y a des places fixes et quels horaires sont pratiques.',
    },
  },
  {
    id: 'coffee-machine',
    group: 'bnb-facilities',
    icon: 'coffee',
    titleTranslations: { nl: 'Koffiemachine', en: 'Coffee machine', de: 'Kaffeemaschine', fr: 'Machine a cafe' },
    descriptionTranslations: {
      nl: 'Koffiemachine met diverse cups beschikbaar in de keuken. Gebruik zo veel als je wilt — het is gratis.',
      en: 'Coffee machine with various pods available in the kitchen. Use as much as you like — it\'s complimentary.',
      de: 'Kaffeemaschine mit verschiedenen Kapseln in der Küche. Bedienen Sie sich so oft Sie möchten — kostenlos.',
      fr: 'Machine à café avec capsules variées dans la cuisine. Servez-vous autant que vous voulez — c\'est gratuit.',
    },
  },
  {
    id: 'air-conditioning',
    group: 'bnb-facilities',
    icon: 'snow',
    titleTranslations: { nl: 'Airconditioning', en: 'Air conditioning', de: 'Klimaanlage', fr: 'Climatisation' },
    descriptionTranslations: {
      nl: 'Vertel hoe de airco werkt, waar de bediening ligt en welke stand het prettigst is bij aankomst.',
      en: 'Explain how the air conditioning works, where the controls are, and which setting is best on arrival.',
      de: 'Erklären Sie, wie die Klimaanlage funktioniert, wo die Bedienung liegt und welche Einstellung bei Ankunft ideal ist.',
      fr: 'Expliquez comment fonctionne la climatisation, où se trouve la commande et quel réglage convient à l’arrivée.',
    },
  },
  {
    id: 'heating',
    group: 'bnb-facilities',
    icon: 'flame',
    titleTranslations: { nl: 'Verwarming', en: 'Heating', de: 'Heizung', fr: 'Chauffage' },
    descriptionTranslations: {
      nl: 'Centrale verwarming in alle kamers. De thermostaat zit in de woonkamer. Stel vrij de gewenste temperatuur in.',
      en: 'Central heating in all rooms. The thermostat is in the living room. Feel free to set your preferred temperature.',
      de: 'Zentralheizung in allen Räumen. Der Thermostat befindet sich im Wohnzimmer. Stellen Sie Ihre Wunschtemperatur ein.',
      fr: 'Chauffage central dans toutes les pièces. Le thermostat se trouve dans le salon. Réglez la température souhaitée.',
    },
  },
  {
    id: 'tv',
    group: 'bnb-facilities',
    icon: 'tv',
    titleTranslations: { nl: 'TV', en: 'TV', de: 'Fernseher', fr: 'TV' },
    descriptionTranslations: {
      nl: 'Smart TV met Netflix en YouTube. Gebruik de afstandsbediening op de salontafel of log in met je eigen account.',
      en: 'Smart TV with Netflix and YouTube. Use the remote on the coffee table or log in with your own account.',
      de: 'Smart TV mit Netflix und YouTube. Nutzen Sie die Fernbedienung auf dem Couchtisch oder melden Sie sich mit Ihrem eigenen Konto an.',
      fr: 'Smart TV avec Netflix et YouTube. Utilisez la télécommande sur la table basse ou connectez-vous avec votre propre compte.',
    },
  },
  {
    id: 'kitchen',
    group: 'bnb-facilities',
    icon: 'kitchen',
    titleTranslations: { nl: 'Keuken', en: 'Kitchen', de: 'Küche', fr: 'Cuisine' },
    descriptionTranslations: {
      nl: 'Volledig uitgeruste keuken met koelkast, magnetron, kookplaat en vaatwasser. Borden, bestek en pannen zijn aanwezig.',
      en: 'Fully equipped kitchen with fridge, microwave, stove, and dishwasher. Plates, cutlery, and pans are provided.',
      de: 'Voll ausgestattete Küche mit Kühlschrank, Mikrowelle, Herd und Geschirrspüler. Teller, Besteck und Pfannen sind vorhanden.',
      fr: 'Cuisine entièrement équipée avec réfrigérateur, micro-ondes, plaque de cuisson et lave-vaisselle. Assiettes, couverts et casseroles fournis.',
    },
  },
  {
    id: 'oven-stove',
    group: 'bnb-facilities',
    icon: 'flame',
    titleTranslations: { nl: 'Oven / fornuis', en: 'Oven / stove', de: 'Ofen / Herd', fr: 'Four / cuisiniere' },
    descriptionTranslations: {
      nl: 'Oven en kookplaat aanwezig. De knoppen werken met draaiknop links. Na gebruik graag alles uitzetten.',
      en: 'Oven and stove available. Controls are the knobs on the left. Please switch everything off after use.',
      de: 'Erklären Sie, wie Gäste Ofen oder Herd einschalten, welche Bedienelemente sie brauchen und welche Sicherheitsregeln wichtig sind.',
      fr: 'Expliquez comment allumer le four ou la cuisiniere, quelles commandes utiliser et quelles regles de securite sont importantes.',
    },
  },
  {
    id: 'workspace',
    group: 'bnb-facilities',
    icon: 'laptop',
    titleTranslations: { nl: 'Werkplek', en: 'Workspace', de: 'Arbeitsplatz', fr: 'Espace de travail' },
    descriptionTranslations: {
      nl: 'Rustige werkplek met bureau, stopcontact en snel WiFi. Ideaal voor thuiswerken tijdens je verblijf.',
      en: 'Quiet workspace with desk, power outlet, and fast WiFi. Ideal for remote work during your stay.',
      de: 'Beschreiben Sie, wo Gäste ruhig arbeiten können und ob Steckdosen, Licht und stabiles Internet vorhanden sind.',
      fr: 'Décrivez où les invités peuvent travailler au calme et s’il y a des prises, de la lumière et une bonne connexion.',
    },
  },
  {
    id: 'washing-machine',
    group: 'bnb-facilities',
    icon: 'washer',
    titleTranslations: { nl: 'Wasmachine', en: 'Washing machine', de: 'Waschmaschine', fr: 'Machine à laver' },
    descriptionTranslations: {
      nl: 'Vertel waar de wasmachine staat, hoe gasten die gebruiken en of er wasmiddel aanwezig is.',
      en: 'Tell guests where the washing machine is, how to use it, and whether detergent is available.',
      de: 'Erklären Sie, wo die Waschmaschine steht, wie sie genutzt wird und ob Waschmittel vorhanden ist.',
      fr: 'Précisez où se trouve la machine à laver, comment l’utiliser et si de la lessive est disponible.',
    },
  },
  {
    id: 'dryer',
    group: 'bnb-facilities',
    icon: 'wind',
    titleTranslations: { nl: 'Droger', en: 'Dryer', de: 'Trockner', fr: 'Seche-linge' },
    descriptionTranslations: {
      nl: 'Droger beschikbaar naast de wasmachine. Gebruik het standaard programma. Maak na gebruik het pluizenfilter even schoon.',
      en: 'Dryer available next to the washing machine. Use the standard program. Please clean the lint filter after use.',
      de: 'Erklären Sie, wo der Trockner steht, welches Programm sinnvoll ist und wie Filter oder Flusen sicher kontrolliert werden.',
      fr: 'Indiquez ou se trouve le seche-linge, quel programme choisir et comment verifier les filtres ou peluches en toute securite.',
    },
  },
  {
    id: 'breakfast',
    group: 'guest-services',
    icon: 'breakfast',
    titleTranslations: { nl: 'Ontbijt', en: 'Breakfast', de: 'Frühstück', fr: 'Petit-déjeuner' },
    descriptionTranslations: {
      nl: 'Ontbijt inbegrepen, dagelijks geserveerd van 8:00 tot 10:00 in de eetkamer. Dieetwensen? Laat het ons vooraf weten.',
      en: 'Breakfast included, served daily from 8:00 to 10:00 in the dining room. Dietary needs? Let us know in advance.',
      de: 'Frühstück inklusive, täglich von 8:00 bis 10:00 Uhr im Esszimmer. Ernährungswünsche? Teilen Sie uns diese vorab mit.',
      fr: 'Petit-déjeuner inclus, servi chaque jour de 8h00 à 10h00 dans la salle à manger. Régime spécial ? Prévenez-nous à l\'avance.',
    },
  },
  {
    id: 'self-checkin',
    group: 'guest-services',
    icon: 'key',
    titleTranslations: { nl: 'Zelf inchecken', en: 'Self check-in', de: 'Selbst-Check-in', fr: 'Arrivée autonome' },
    descriptionTranslations: {
      nl: 'Je kunt zelf inchecken met de sleutelkluis bij de voordeur. De code ontvang je per bericht op de dag van aankomst.',
      en: 'Self check-in via the key safe at the front door. You will receive the code by message on the day of arrival.',
      de: 'Selbst-Check-in über den Schlüsselsafe an der Haustür. Den Code erhalten Sie am Anreisetag per Nachricht.',
      fr: 'Expliquez brièvement comment se passe l’arrivée, où se trouve la clé et ce que les invités doivent faire en premier.',
    },
  },
  {
    id: 'late-checkin',
    group: 'guest-services',
    icon: 'moon',
    titleTranslations: { nl: 'Late check-in', en: 'Late check-in', de: 'Später Check-in', fr: 'Arrivée tardive' },
    descriptionTranslations: {
      nl: 'Late check-in mogelijk tot 23:00. Laat het ons weten als je na 21:00 aankomt, dan bereiden we alles voor.',
      en: 'Late check-in available until 23:00. Let us know if you arrive after 21:00 and we will prepare everything.',
      de: 'Machen Sie deutlich, bis wann ein später Check-in möglich ist und wie Gäste dies vorher abstimmen.',
      fr: 'Indiquez jusqu’à quelle heure l’arrivée tardive est possible et comment les invités doivent la prévoir.',
    },
  },
  {
    id: 'luggage-storage',
    group: 'guest-services',
    icon: 'luggage',
    titleTranslations: { nl: 'Bagageopslag', en: 'Luggage storage', de: 'Gepäckaufbewahrung', fr: 'Consigne bagages' },
    descriptionTranslations: {
      nl: 'Je kunt je bagage voor check-in of na check-out bij ons achterlaten. Spreek dit vooraf even af.',
      en: 'You can leave your luggage before check-in or after check-out. Please arrange this in advance.',
      de: 'Erklären Sie, ob Gäste ihr Gepäck früher abgeben oder später stehen lassen können und wo das möglich ist.',
      fr: 'Précisez si les invités peuvent déposer leurs bagages plus tôt ou les laisser plus tard et où cela se fait.',
    },
  },
  {
    id: 'cleaning-service',
    group: 'guest-services',
    icon: 'cleaning',
    titleTranslations: { nl: 'Schoonmaakservice', en: 'Cleaning service', de: 'Reinigungsservice', fr: 'Service de ménage' },
    descriptionTranslations: {
      nl: 'Schoonmaak bij langer verblijf op aanvraag. Laat het ons weten als je extra handdoeken of beddengoed nodig hebt.',
      en: 'Cleaning available on request for longer stays. Let us know if you need extra towels or linen.',
      de: 'Erklären Sie, ob eine Zwischenreinigung möglich ist und wie Gäste sie anfragen können.',
      fr: 'Expliquez si un ménage intermédiaire est disponible et comment les invités peuvent le demander.',
    },
  },
  {
    id: 'public-transport-nearby',
    group: 'location-transport',
    icon: 'bus',
    titleTranslations: { nl: 'OV dichtbij', en: 'Public transport nearby', de: 'ÖPNV in der Nähe', fr: 'Transports proches' },
    descriptionTranslations: {
      nl: 'Bushalte op 200 meter. Treinstation op 10 minuten lopen. Neem lijn 4 richting centrum voor de snelste verbinding.',
      en: 'Bus stop 200 metres away. Train station a 10-minute walk. Take line 4 towards the centre for the fastest connection.',
      de: 'Beschreiben Sie, welche Haltestelle oder welcher Bahnhof in der Nähe liegt und wie Gäste ihn am einfachsten erreichen.',
      fr: 'Indiquez quel arrêt ou quelle gare se trouve à proximité et comment s’y rendre facilement.',
    },
  },
  {
    id: 'airport-transport',
    group: 'location-transport',
    icon: 'plane',
    titleTranslations: { nl: 'Luchthavenvervoer', en: 'Airport transport', de: 'Flughafentransfer', fr: 'Navette aéroport' },
    descriptionTranslations: {
      nl: 'Luchthavenvervoer kan geregeld worden. Neem contact op voor een ophaalservice of bekijk de shuttleopties.',
      en: 'Airport transfer can be arranged. Contact us for a pickup service or check shuttle options.',
      de: 'Erklären Sie, welches Taxi, Shuttle oder welche Route für die Anreise vom Flughafen praktisch ist.',
      fr: 'Expliquez quel taxi, navette ou itinéraire est pratique pour arriver depuis l’aéroport.',
    },
  },
  {
    id: 'bike-rental',
    group: 'location-transport',
    icon: 'bike',
    titleTranslations: { nl: 'Fietsverhuur', en: 'Bike rental', de: 'Fahrradverleih', fr: 'Location de vélos' },
    descriptionTranslations: {
      nl: 'Fietsen beschikbaar voor gasten. Gratis te gebruiken tijdens je verblijf. Fietssloten hangen aan het stuur.',
      en: 'Bikes available for guests. Free to use during your stay. Bike locks are attached to the handlebars.',
      de: 'Fahrräder für Gäste verfügbar. Kostenlos nutzbar während Ihres Aufenthalts. Fahrradschlösser hängen am Lenker.',
      fr: 'Vélos disponibles pour les invités. Gratuits pendant votre séjour. Les cadenas se trouvent sur le guidon.',
    },
  },
  {
    id: 'car-rental',
    group: 'location-transport',
    icon: 'car',
    titleTranslations: { nl: 'Autoverhuur', en: 'Car rental', de: 'Autovermietung', fr: 'Location de voiture' },
    descriptionTranslations: {
      nl: 'Autoverhuur beschikbaar in de buurt. Wij raden aan vooraf te reserveren, vooral in het hoogseizoen.',
      en: 'Car rental available nearby. We recommend booking in advance, especially during peak season.',
      de: 'Erklären Sie, wo Gäste ein Auto mieten können und welche Option sich gut für Tagesausflüge eignet.',
      fr: 'Indiquez où les invités peuvent louer une voiture et quelle option convient aux excursions à la journée.',
    },
  },
  {
    id: 'free-parking-nearby',
    group: 'location-transport',
    icon: 'parking',
    titleTranslations: { nl: 'Gratis parkeren in de buurt', en: 'Free parking nearby', de: 'Kostenloses Parken in der Nähe', fr: 'Parking gratuit à proximité' },
    descriptionTranslations: {
      nl: 'Gratis parkeren op straat mogelijk, direct om de hoek. Maximaal 5 minuten lopen naar het verblijf.',
      en: 'Free street parking available, just around the corner. Maximum 5-minute walk to the property.',
      de: 'Machen Sie deutlich, wo kostenlose Parkplätze verfügbar sind und welcher Fußweg danach am einfachsten ist.',
      fr: 'Indiquez clairement où se trouve le stationnement gratuit et quel chemin à pied est le plus simple ensuite.',
    },
  },
  {
    id: 'smoke-detector',
    group: 'safety',
    icon: 'alert',
    titleTranslations: { nl: 'Rookmelder', en: 'Smoke detector', de: 'Rauchmelder', fr: 'Détecteur de fumée' },
    descriptionTranslations: {
      nl: 'Vertel waar de rookmelders hangen en wat gasten moeten doen als er een alarm afgaat.',
      en: 'Explain where the smoke detectors are and what guests should do if an alarm goes off.',
      de: 'Erklären Sie, wo sich die Rauchmelder befinden und was Gäste bei einem Alarm tun sollen.',
      fr: 'Expliquez où se trouvent les détecteurs de fumée et ce que les invités doivent faire en cas d’alarme.',
    },
  },
  {
    id: 'first-aid',
    group: 'safety',
    icon: 'medical',
    titleTranslations: { nl: 'EHBO-kit', en: 'First aid kit', de: 'Erste-Hilfe-Set', fr: 'Kit de premiers secours' },
    descriptionTranslations: {
      nl: 'Geef aan waar de EHBO-kit ligt en voor welke kleine situaties gasten die kunnen gebruiken.',
      en: 'Tell guests where the first aid kit is and for which small situations they can use it.',
      de: 'Geben Sie an, wo das Erste-Hilfe-Set liegt und für welche kleinen Situationen es gedacht ist.',
      fr: 'Indiquez où se trouve le kit de premiers secours et dans quels petits cas il peut être utilisé.',
    },
  },
  {
    id: 'emergency-numbers',
    group: 'safety',
    icon: 'phone',
    titleTranslations: { nl: 'Noodnummers', en: 'Emergency numbers', de: 'Notrufnummern', fr: 'Numéros d’urgence' },
    descriptionTranslations: {
      nl: 'Zet de belangrijkste noodnummers en het snelste contactpunt voor de host overzichtelijk bij elkaar.',
      en: 'List the most important emergency numbers and the fastest host contact in one clear place.',
      de: 'Listen Sie die wichtigsten Notrufnummern und den schnellsten Kontakt zum Host übersichtlich an einem Ort auf.',
      fr: 'Regroupez clairement les principaux numéros d’urgence et le contact le plus rapide avec l’hôte.',
    },
  },
  {
    id: 'fire-extinguisher',
    group: 'safety',
    icon: 'shield',
    titleTranslations: { nl: 'Brandblusser', en: 'Fire extinguisher', de: 'Feuerlöscher', fr: 'Extincteur' },
    descriptionTranslations: {
      nl: 'Leg uit waar de brandblusser hangt en wanneer gasten direct de host of hulpdiensten moeten bellen.',
      en: 'Explain where the fire extinguisher is and when guests should call the host or emergency services immediately.',
      de: 'Erklären Sie, wo der Feuerlöscher hängt und wann Gäste sofort den Host oder den Notruf kontaktieren sollen.',
      fr: 'Expliquez où se trouve l’extincteur et quand les invités doivent appeler immédiatement l’hôte ou les secours.',
    },
  },
  {
    id: 'garden',
    group: 'outdoor',
    icon: 'leaf',
    titleTranslations: { nl: 'Tuin', en: 'Garden', de: 'Garten', fr: 'Jardin' },
    descriptionTranslations: {
      nl: 'Beschrijf welke buitenruimte gasten gebruiken, of er tuinmeubilair is en of de tuin gedeeld wordt.',
      en: 'Describe the outdoor space guests can use, whether garden furniture is available, and if it is shared.',
      de: 'Beschreiben Sie den Außenbereich, den Gäste nutzen können, ob Gartenmöbel vorhanden sind und ob der Garten geteilt wird.',
      fr: 'Décrivez l’espace extérieur accessible aux invités, s’il y a du mobilier de jardin et s’il est partagé.',
    },
  },
  {
    id: 'terrace',
    group: 'outdoor',
    icon: 'sun',
    titleTranslations: { nl: 'Terras', en: 'Terrace', de: 'Terrasse', fr: 'Terrasse' },
    descriptionTranslations: {
      nl: 'Geef aan of het terras privé is, of er een zitplek is en wanneer het gezellig is om buiten te zitten.',
      en: 'State whether the terrace is private, if there is seating, and when it is nice to sit outside.',
      de: 'Geben Sie an, ob die Terrasse privat ist, ob es Sitzgelegenheiten gibt und wann es schön ist, draußen zu sitzen.',
      fr: 'Indiquez si la terrasse est privée, s’il y a des sièges et quand il est agréable de s’asseoir dehors.',
    },
  },
  {
    id: 'barbecue',
    group: 'outdoor',
    icon: 'fire',
    titleTranslations: { nl: 'Barbecue', en: 'Barbecue', de: 'Grill', fr: 'Barbecue' },
    descriptionTranslations: {
      nl: 'Leg uit of gasten een barbecue mogen gebruiken, waar hij staat en hoe het opruimen werkt.',
      en: 'Explain if guests can use a barbecue, where it is located, and how to clean up afterwards.',
      de: 'Erklären Sie, ob Gäste den Grill nutzen dürfen, wo er steht und wie das Aufräumen funktioniert.',
      fr: 'Expliquez si les invités peuvent utiliser le barbecue, où il se trouve et comment nettoyer après usage.',
    },
  },
  {
    id: 'pool',
    group: 'sports-wellness',
    icon: 'droplet',
    titleTranslations: { nl: 'Zwembad', en: 'Pool', de: 'Pool', fr: 'Piscine' },
    descriptionTranslations: {
      nl: 'Vermeld of het zwembad privé is, de openingstijden en waar handdoeken klaar liggen.',
      en: 'Mention if the pool is private, the opening hours, and where towels are provided.',
      de: 'Geben Sie an, ob der Pool privat ist, die Öffnungszeiten und wo Handtücher bereitliegen.',
      fr: 'Indiquez si la piscine est privée, les horaires d’ouverture et où sont les serviettes.',
    },
  },
  {
    id: 'sauna',
    group: 'sports-wellness',
    icon: 'sparkles',
    titleTranslations: { nl: 'Sauna', en: 'Sauna', de: 'Sauna', fr: 'Sauna' },
    descriptionTranslations: {
      nl: 'Geef aan hoe de sauna werkt, veiligheidstips en beschikbare tijden.',
      en: 'State how to use the sauna, safety tips, and available times.',
      de: 'Geben Sie an, wie die Sauna genutzt wird, Sicherheitshinweise und verfügbare Zeiten.',
      fr: 'Indiquez comment utiliser le sauna, des conseils de sécurité et les horaires disponibles.',
    },
  },
  {
    id: 'fitness',
    group: 'sports-wellness',
    icon: 'dumbbell',
    titleTranslations: { nl: 'Fitness', en: 'Fitness', de: 'Fitness', fr: 'Fitness' },
    descriptionTranslations: {
      nl: 'Beschrijf apparatuur, openingstijden en of er contra-indicaties zijn.',
      en: 'Describe equipment, opening hours, and any contraindications.',
      de: 'Beschreiben Sie Geräte, Öffnungszeiten und etwaige Gegenanzeigen.',
      fr: 'Décrivez les équipements, les horaires et les éventuelles contre-indications.',
    },
  },
  {
    id: 'valet-parking',
    group: 'parking',
    icon: 'car',
    titleTranslations: { nl: 'Valet parkeren', en: 'Valet parking', de: 'Valet-Parken', fr: 'Voiturier' },
    descriptionTranslations: {
      nl: 'Vertel hoe valet parkeren werkt en op welke tijden het beschikbaar is.',
      en: 'Explain how valet parking works and during which hours it is available.',
      de: 'Erklären Sie, wie Valet-Parken funktioniert und zu welchen Zeiten es verfügbar ist.',
      fr: 'Expliquez comment fonctionne le service de voiturier et à quelles heures il est disponible.',
    },
  },
  {
    id: 'covered-parking',
    group: 'parking',
    icon: 'garage',
    titleTranslations: { nl: 'Overdekt parkeren', en: 'Covered parking', de: 'Überdachtes Parken', fr: 'Parking couvert' },
    descriptionTranslations: {
      nl: 'Geef aan of er een overdekte plek is en hoe een plek gereserveerd kan worden.',
      en: 'State whether there is covered parking and how a space can be reserved.',
      de: 'Geben Sie an, ob es überdachtes Parken gibt und wie ein Platz reserviert werden kann.',
      fr: 'Indiquez s’il y a un parking couvert et comment réserver une place.',
    },
  },
  {
    id: 'room-service',
    group: 'food-drink',
    icon: 'coffee',
    titleTranslations: { nl: 'Roomservice', en: 'Room service', de: 'Zimmerservice', fr: 'Service en chambre' },
    descriptionTranslations: {
      nl: 'Leg uit of roomservice kan worden besteld, welke opties er zijn en spoedinfo.',
      en: 'Explain if room service can be ordered, what options exist, and urgent handling.',
      de: 'Erklären Sie, ob Zimmerservice bestellt werden kann, welche Optionen es gibt und wie es eilt.',
      fr: 'Expliquez si le service en chambre est disponible, quelles options sont proposées et comment demander rapidement.',
    },
  },
  {
    id: 'picnic-desserts',
    group: 'food-drink',
    icon: 'utensils',
    titleTranslations: { nl: 'Picknick & drankjes', en: 'Picnic & drinks', de: 'Picknick & Getränke', fr: 'Pique-nique & boissons' },
    descriptionTranslations: {
      nl: 'Beschrijf of gasten een picknickmand kunnen bestellen of drankjes kunnen kopen.',
      en: 'Describe whether guests can order a picnic basket or buy drinks.',
      de: 'Beschreiben Sie, ob Gäste einen Picknickkorb bestellen oder Getränke kaufen können.',
      fr: 'Décrivez si les invités peuvent commander un panier pique-nique ou acheter des boissons.',
    },
  },
  {
    id: 'workspace-desk',
    group: 'business',
    icon: 'laptop',
    titleTranslations: { nl: 'Werkplek bureau', en: 'Workspace desk', de: 'Arbeitsplatz Schreibtisch', fr: 'Bureau' },
    descriptionTranslations: {
      nl: 'Geef details over bureau, stopcontacten en licht voor langdurig werken.',
      en: 'Provide details about desk, outlets, and lighting for extended work.',
      de: 'Geben Sie Details zu Schreibtisch, Steckdosen und Beleuchtung für längerfristiges Arbeiten.',
      fr: 'Donnez des détails sur le bureau, les prises et la lumière pour travailler longtemps.',
    },
  },
  {
    id: 'printer-access',
    group: 'business',
    icon: 'printer',
    titleTranslations: { nl: 'Printertoegang', en: 'Printer access', de: 'Druckerzugang', fr: 'Accès imprimante' },
    descriptionTranslations: {
      nl: 'Leg uit hoe gasten documenten kunnen printen en welke limieten er zijn.',
      en: 'Explain how guests can print documents and any limitations.',
      de: 'Erklären Sie, wie Gäste Dokumente drucken können und welche Beschränkungen gelten.',
      fr: 'Expliquez comment les invités peuvent imprimer des documents et quelles limitations existent.',
    },
  },
  {
    id: 'recycling',
    group: 'other',
    icon: 'recycle',
    titleTranslations: { nl: 'Afval scheiden', en: 'Recycling', de: 'Recycling', fr: 'Tri des déchets' },
    descriptionTranslations: {
      nl: 'Vertel hoe gasten afval kunnen scheiden en waar de containers staan.',
      en: 'Tell guests how to sort waste and where the bins are located.',
      de: 'Erklären Sie, wie Gäste Abfall trennen und wo die Behälter stehen.',
      fr: 'Expliquez comment trier les déchets et où se trouvent les conteneurs.',
    },
  },
  {
    id: 'early-checkin',
    group: 'other',
    icon: 'clock',
    titleTranslations: { nl: 'Vroeg inchecken', en: 'Early check-in', de: 'Früher Check-in', fr: 'Arrivée anticipée' },
    descriptionTranslations: {
      nl: 'Informeer of vroeg inchecken mogelijk is en of er extra kosten aan verbonden zijn.',
      en: 'Inform whether early check-in is possible and if any extra fees apply.',
      de: 'Informieren Sie, ob früher Check-in möglich ist und ob zusätzliche Gebühren anfallen.',
      fr: 'Indiquez si l’arrivée anticipée est possible et s’il y a des frais supplémentaires.',
    },
  },
  {
    id: 'key-safe',
    group: 'other',
    icon: 'key',
    titleTranslations: { nl: 'Sleutelkluisje', en: 'Key safe', de: 'Schlüsselsafe', fr: 'Coffre à clés' },
    descriptionTranslations: {
      nl: 'Geef aan waar het kluisje zit, de code en gebruiksinstructies.',
      en: 'Provide the safe location, code, and usage instructions.',
      de: 'Geben Sie den Standort, den Code und die Bedienungsanleitung des Safes an.',
      fr: 'Indiquez l’emplacement, le code et les instructions d’utilisation du coffre.',
    },
  },
]

const categorySeeds: Record<WizardCategory, Array<Omit<WizardSuggestion, 'id' | 'photo' | 'x' | 'y' | 'source' | 'externalUrl' | 'selected'>>> = {
  bnb: [
    {
      kind: 'voorziening',
      name: 'Bakery & Coffee',
      description: 'Ideale plek voor ontbijt, koffie en een snelle start van de dag.',
      openingHours: 'Dagelijks 07:30 - 17:00',
      contact: '+31 10 123 45 67',
      counter: 12,
      distance: '4 min lopen',
      tags: ['Ontbijt', 'Koffie'],
    },
    {
      kind: 'restaurant',
      name: 'Lokale Bistro',
      description: 'Sfeervol dineradres met lokale gerechten en gastvrije bediening.',
      openingHours: 'Wo - Zo 17:00 - 22:00',
      contact: 'bistro@example.com',
      counter: 34,
      distance: '8 min rijden',
      tags: ['Diner', 'Lokaal'],
    },
    {
      kind: 'beleving',
      name: 'Historisch centrum',
      description: 'Perfect voor een ontspannen wandeling en leuke fotomomenten.',
      openingHours: 'Altijd open',
      contact: 'Toeristisch informatiepunt',
      counter: 18,
      distance: '10 min lopen',
      tags: ['Wandelen', 'Foto'],
    },
    {
      kind: 'route',
      name: 'Fietsroute langs de rivier',
      description: 'Rustige route met mooie uitzichten en korte stopmogelijkheden.',
      openingHours: 'Altijd open',
      contact: 'Routekaart in app',
      counter: 24,
      distance: 'Start dichtbij',
      tags: ['Fietsen', 'Natuur'],
    },
  ],
  vakantiehuis: [
    {
      kind: 'voorziening',
      name: 'Supermarkt dichtbij',
      description: 'Handig voor verse boodschappen en dagelijkse benodigdheden.',
      openingHours: 'Ma - Za 08:00 - 20:00',
      contact: '+31 20 555 12 12',
      counter: 20,
      distance: '6 min rijden',
      tags: ['Boodschappen', 'Praktisch'],
    },
    {
      kind: 'restaurant',
      name: 'Familierestaurant',
      description: 'Ontspannen restaurant met kindvriendelijke sfeer en terras.',
      openingHours: 'Dagelijks 12:00 - 22:00',
      contact: 'info@familierestaurant.nl',
      counter: 28,
      distance: '9 min rijden',
      tags: ['Familie', 'Terras'],
    },
    {
      kind: 'beleving',
      name: 'Uitzichtpunt',
      description: 'Populaire plek voor zonsondergang en rustige avondwandelingen.',
      openingHours: 'Altijd open',
      contact: 'Lokale tip',
      counter: 14,
      distance: '12 min rijden',
      tags: ['Uitzicht', 'Rust'],
    },
    {
      kind: 'route',
      name: 'Boswandeling',
      description: 'Gemakkelijke route voor gasten die natuur en ontspanning zoeken.',
      openingHours: 'Altijd open',
      contact: 'Startpunt bij parkeerplaats',
      counter: 16,
      distance: '5 min rijden',
      tags: ['Wandelen', 'Bos'],
    },
  ],
  stadsgids: [
    {
      kind: 'voorziening',
      name: 'Parkeergarage centrum',
      description: 'Handige parkeertip voor gasten die de stad verkennen.',
      openingHours: '24/7',
      contact: '+31 30 200 30 40',
      counter: 48,
      distance: '3 min lopen',
      tags: ['Parkeren', 'Centrum'],
    },
    {
      kind: 'restaurant',
      name: 'Signature kitchen',
      description: 'Modern restaurant met designinterieur en creatieve menukaart.',
      openingHours: 'Di - Zo 17:30 - 23:00',
      contact: 'reserve@signaturekitchen.com',
      counter: 39,
      distance: '7 min lopen',
      tags: ['Design', 'Cocktails'],
    },
    {
      kind: 'beleving',
      name: 'Museumroute',
      description: 'Combineer cultuur, architectuur en leuke winkelstraten in één middag.',
      openingHours: 'Dagelijks 10:00 - 18:00',
      contact: 'city guide desk',
      counter: 31,
      distance: 'In centrum',
      tags: ['Cultuur', 'Museum'],
    },
    {
      kind: 'route',
      name: 'Avondwandeling highlights',
      description: 'Korte route langs de mooiste plekken voor avondfoto’s.',
      openingHours: 'Altijd open',
      contact: 'Route in app',
      counter: 22,
      distance: 'Start op 2 min',
      tags: ['Wandelen', 'Stad'],
    },
  ],
  wellness: [
    {
      kind: 'voorziening',
      name: 'Yoga studio',
      description: 'Rustige studio voor ochtendlessen en ontspanning.',
      openingHours: 'Dagelijks 08:00 - 18:00',
      contact: '+31 40 456 90 12',
      counter: 19,
      distance: '6 min lopen',
      tags: ['Yoga', 'Ontspanning'],
    },
    {
      kind: 'restaurant',
      name: 'Healthy kitchen',
      description: 'Lichte lunch en verse bowls, populair bij wellnessgasten.',
      openingHours: 'Dagelijks 09:00 - 20:00',
      contact: 'hello@healthykitchen.nl',
      counter: 27,
      distance: '5 min rijden',
      tags: ['Healthy', 'Lunch'],
    },
    {
      kind: 'beleving',
      name: 'Spa circuit',
      description: 'Aanrader voor gasten die hun verblijf extra ontspannend willen maken.',
      openingHours: 'Dagelijks 10:00 - 22:00',
      contact: 'receptie spa',
      counter: 41,
      distance: '8 min rijden',
      tags: ['Spa', 'Wellness'],
    },
    {
      kind: 'route',
      name: 'Mindful morning walk',
      description: 'Korte route door rustige omgeving met plekken om even stil te staan.',
      openingHours: 'Altijd open',
      contact: 'Wandelkaart in app',
      counter: 13,
      distance: 'Start vanuit verblijf',
      tags: ['Wandelen', 'Rust'],
    },
  ],
  familie: [
    {
      kind: 'voorziening',
      name: 'Speeltuin & park',
      description: 'Fijne plek waar kinderen kunnen spelen en ouders kunnen ontspannen.',
      openingHours: 'Altijd open',
      contact: 'Gemeentelijke voorziening',
      counter: 30,
      distance: '5 min lopen',
      tags: ['Kinderen', 'Buiten'],
    },
    {
      kind: 'restaurant',
      name: 'Pannenkoekenhuis',
      description: 'Gezellige klassieker voor gezinnen, met genoeg keuze voor iedereen.',
      openingHours: 'Wo - Zo 12:00 - 21:00',
      contact: '+31 70 555 12 98',
      counter: 44,
      distance: '10 min rijden',
      tags: ['Kindvriendelijk', 'Diner'],
    },
    {
      kind: 'beleving',
      name: 'Dierenweide',
      description: 'Leuk uitstapje voor jonge kinderen en een ontspannen uurtje buiten.',
      openingHours: 'Dagelijks 09:00 - 17:00',
      contact: 'Info bij entree',
      counter: 17,
      distance: '7 min rijden',
      tags: ['Uitje', 'Kinderen'],
    },
    {
      kind: 'route',
      name: 'Familiefietsroute',
      description: 'Veilige route met korte stops, ijsje en speelplek onderweg.',
      openingHours: 'Altijd open',
      contact: 'Route in app',
      counter: 15,
      distance: 'Start dichtbij',
      tags: ['Fietsen', 'Familie'],
    },
  ],
  natuur: [
    {
      kind: 'voorziening',
      name: 'Bezoekerscentrum',
      description: 'Startpunt voor routes, kaarten en lokale seizoensinformatie.',
      openingHours: 'Di - Zo 09:00 - 17:00',
      contact: 'visitor@naturepark.nl',
      counter: 11,
      distance: '8 min rijden',
      tags: ['Routes', 'Info'],
    },
    {
      kind: 'restaurant',
      name: 'Bosrestaurant',
      description: 'Lunch of diner in een groene omgeving met veel rust.',
      openingHours: 'Dagelijks 11:00 - 21:00',
      contact: '+31 50 222 19 19',
      counter: 21,
      distance: '12 min rijden',
      tags: ['Natuur', 'Lunch'],
    },
    {
      kind: 'beleving',
      name: 'Uitkijkpunt',
      description: 'Mooie plek voor ochtendmist, foto’s en een korte stop onderweg.',
      openingHours: 'Altijd open',
      contact: 'Lokale tip',
      counter: 9,
      distance: '15 min rijden',
      tags: ['Uitzicht', 'Foto'],
    },
    {
      kind: 'route',
      name: 'Natuurpad',
      description: 'Afwisselende route door groen gebied, geschikt voor rustige gasten.',
      openingHours: 'Altijd open',
      contact: 'Padmarkering aanwezig',
      counter: 18,
      distance: 'Start op 3 min',
      tags: ['Wandelen', 'Natuur'],
    },
  ],
}

const samplePhotoKeywords = ['stay', 'breakfast', 'village', 'restaurant', 'nature', 'wellness', 'city', 'family']

const kindTitles: Record<Language, Record<SuggestionKind, string>> = {
  nl: { voorziening: 'voorziening', restaurant: 'restaurant', beleving: 'activiteit', route: 'route' },
  en: { voorziening: 'service', restaurant: 'restaurant', beleving: 'activity', route: 'route' },
  de: { voorziening: 'Service', restaurant: 'Restaurant', beleving: 'Aktivität', route: 'Route' },
  fr: { voorziening: 'service', restaurant: 'restaurant', beleving: 'activité', route: 'itinéraire' },
}

const wizardUiStrings: Record<Language, { welcomeFallback: string; welcomeButton: string }> = {
  nl: { welcomeFallback: 'Voel je thuis en gebruik deze app voor alle belangrijke informatie tijdens je verblijf.', welcomeButton: 'Tekst verbeterd en vertaald voor alle gekozen talen.' },
  en: { welcomeFallback: 'Feel at home and use this app for all important information during your stay.', welcomeButton: 'Text improved and translated for all selected languages.' },
  de: { welcomeFallback: 'Fühlen Sie sich wie zu Hause und nutzen Sie diese App für alle wichtigen Informationen während Ihres Aufenthalts.', welcomeButton: 'Text verbessert und für alle ausgewählten Sprachen übersetzt.' },
  fr: { welcomeFallback: 'Sentez-vous comme chez vous et utilisez cette app pour toutes les informations utiles pendant votre séjour.', welcomeButton: 'Texte amélioré et traduit pour toutes les langues sélectionnées.' },
}

export function detectSuggestedLanguages(browserLanguage?: string): { languages: Language[]; defaultLanguage: Language } {
  const lower = (browserLanguage ?? '').toLowerCase()

  if (lower.startsWith('de')) {
    return { languages: ['de', 'en', 'nl'], defaultLanguage: 'de' }
  }
  if (lower.startsWith('fr')) {
    return { languages: ['fr', 'en', 'nl'], defaultLanguage: 'fr' }
  }
  if (lower.startsWith('en')) {
    return { languages: ['en', 'nl', 'de'], defaultLanguage: 'en' }
  }

  return { languages: ['nl', 'en', 'de'], defaultLanguage: 'nl' }
}

export function improveAndTranslateWizardText(input: {
  text: string
  languages: Language[]
  defaultLanguage: Language
  type: WizardAiTextType
  appName?: string
  location?: string
}): { improvedText: string; translations: LocalizedTextMap; notice: string } {
  const improvedText = polishWizardText(input.text, input.type, input.appName, input.location)
  const translations = Object.fromEntries(
    input.languages.map((lang) => [
      lang,
      lang === input.defaultLanguage
        ? improvedText
        : localizeWizardText(improvedText, lang, input.type, input.appName, input.location),
    ])
  ) as LocalizedTextMap

  return {
    improvedText,
    translations,
    notice: wizardUiStrings[input.defaultLanguage].welcomeButton,
  }
}

export async function requestWizardAiText(input: {
  text: string
  languages: Language[]
  defaultLanguage: Language
  type: WizardAiTextType
  mode: 'improve' | 'translate'
  appName?: string
  location?: string
}): Promise<{ improvedText: string; translations: LocalizedTextMap; notice: string }> {
  const response = await fetch('/api/ai/wizard-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const json = await response.json()
  if (!response.ok) {
    throw new Error(typeof json?.error === 'string' ? json.error : 'AI-aanvraag mislukt.')
  }

  return json as { improvedText: string; translations: LocalizedTextMap; notice: string }
}

export function formatWizardAddress(address: Partial<WizardAddress>) {
  const lineOne = [address.street?.trim(), address.houseNumber?.trim()].filter(Boolean).join(' ')
  const lineTwo = [address.postalCode?.trim(), address.city?.trim()].filter(Boolean).join(' ')

  return [lineOne, lineTwo, address.country?.trim()].filter(Boolean).join(', ')
}

export function isWizardAddressComplete(address: Partial<WizardAddress>) {
  return Boolean(
    address.street?.trim() &&
    address.houseNumber?.trim() &&
    address.postalCode?.trim() &&
    address.city?.trim() &&
    address.country?.trim()
  )
}

export async function requestNearbySuggestions(input: {
  address: WizardAddress
  category: WizardCategory
  languages: Language[]
  defaultLanguage: Language
  appName?: string
}): Promise<{
  formattedAddress: string
  latitude: number
  longitude: number
  locations: WizardLocation[]
  suggestions: WizardSuggestion[]
  notice: string
  warnings: string[]
}> {
  const response = await fetch('/api/nearby-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const json = await response.json()
  if (!response.ok) {
    throw new Error(typeof json?.error === 'string' ? json.error : 'Zoeken in de omgeving is mislukt.')
  }

  return json as {
    formattedAddress: string
    latitude: number
    longitude: number
    locations: WizardLocation[]
    suggestions: WizardSuggestion[]
    notice: string
    warnings: string[]
  }
}

export async function requestLocationPhotoSuggestions(input: {
  name: string
  address?: string
  category: 'restaurant' | 'tourism' | 'shops'
  tags?: string[]
}): Promise<{ photos: string[] }> {
  const response = await fetch('/api/location-photo-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  const json = await response.json()
  if (!response.ok) {
    throw new Error(typeof json?.error === 'string' ? json.error : 'Zoeken naar foto’s is mislukt.')
  }

  return json as { photos: string[] }
}

export function locationCategoryToSuggestionKind(category: LocationCategory): SuggestionKind {
  if (category === 'restaurant') return 'restaurant'
  if (category === 'shops') return 'voorziening'
  return 'beleving'
}

export function suggestionKindToLocationCategory(kind: SuggestionKind): LocationCategory {
  if (kind === 'restaurant') return 'restaurant'
  if (kind === 'voorziening') return 'shops'
  return 'tourism'
}

export function generateFacilitySuggestions(category: WizardCategory): WizardFacility[] {
  const defaultIdsByCategory: Record<WizardCategory, string[]> = {
    bnb: ['wifi', 'parking', 'self-checkin', 'breakfast', 'heating', 'smoke-detector', 'zwembad', 'garden', 'terrace', 'workspace-desk'],
    vakantiehuis: ['wifi', 'parking', 'kitchen', 'washing-machine', 'heating', 'free-parking-nearby', 'zwembad', 'garden', 'barbecue', 'early-checkin'],
    stadsgids: ['wifi', 'workspace', 'public-transport-nearby', 'bike-rental', 'luggage-storage', 'emergency-numbers', 'zwembad', 'food-drink', 'coffee-machine'],
    wellness: ['wifi', 'air-conditioning', 'heating', 'breakfast', 'late-checkin', 'first-aid', 'zwembad', 'pool', 'sauna', 'fitness'],
    familie: ['wifi', 'parking', 'kitchen', 'washing-machine', 'breakfast', 'first-aid', 'zwembad', 'recycling', 'key-safe'],
    natuur: ['wifi', 'parking', 'bike-rental', 'free-parking-nearby', 'self-checkin', 'fire-extinguisher', 'zwembad', 'outdoor', 'garden'],
  }
  const defaults = new Set(defaultIdsByCategory[category])

  return facilitySeeds.map((item, index) => ({
    id: item.id,
    group: item.group,
    icon: item.icon,
    title: item.titleTranslations.nl,
    description: item.descriptionTranslations.nl,
    selected: defaults.has(item.id),
    titleTranslations: item.titleTranslations,
    descriptionTranslations: item.descriptionTranslations,
    helperText: item.descriptionTranslations.nl,
    locationDetails: '',
    usageDetails: '',
    timingDetails: '',
  }))
}

export function buildFacilityBody(facility: WizardFacility, lang: Language): string {
  const body = facility.descriptionTranslations?.[lang] ?? facility.description
  const labels = facilityDetailLabels[lang] ?? facilityDetailLabels.nl
  const detailLines = [
    facility.locationDetails?.trim() ? `${labels.location}: ${facility.locationDetails.trim()}` : '',
    facility.usageDetails?.trim() ? `${labels.usage}: ${facility.usageDetails.trim()}` : '',
    facility.timingDetails?.trim() ? `${labels.timing}: ${facility.timingDetails.trim()}` : '',
  ].filter(Boolean)

  return [body.trim(), ...detailLines].filter(Boolean).join('\n')
}

export function generateLocalSuggestions(location: string, category: WizardCategory, languages: Language[] = ['nl', 'en', 'de', 'fr']): WizardSuggestion[] {
  const place = location.trim() || 'de omgeving'
  const seedGroups = buildNearbySeedGroups(category)
  const base = [...seedGroups.voorziening, ...seedGroups.restaurant, ...seedGroups.beleving]

  return base.map((seed, index) => {
    const displayName = `${seed.name} ${place === 'de omgeving' ? '' : `• ${place}`}`.trim()
    return {
      id: `${category}-${seed.kind}-${index + 1}`,
      kind: seed.kind,
      source: seed.kind === 'restaurant' || seed.kind === 'voorziening' ? 'google-maps' : 'tripadvisor',
      name: displayName,
      description: seed.descriptions.nl,
      descriptionTranslations: Object.fromEntries(languages.map((lang) => [lang, seed.descriptions[lang] ?? seed.descriptions.nl])) as LocalizedTextMap,
      photo: getSamplePhotoUrl(place, seed.kind, index),
      openingHours: seed.openingHours,
      contact: seed.contact,
      counter: seed.counter,
      distance: seed.distance,
      externalUrl: seed.kind === 'restaurant' || seed.kind === 'voorziening'
        ? buildGoogleMapsSearchUrl(seed.name, place)
        : buildTripAdvisorSearchUrl(seed.name, place),
      selected: true,
      x: 10 + (index % 5) * 18 + (index % 2) * 3,
      y: 18 + Math.floor(index / 5) * 22 + (index % 3) * 2,
      tags: seed.tags,
    }
  })
}

function createFallbackWizardLocation(suggestion: WizardSuggestion, languages: Language[]): WizardLocation {
  const descriptionTranslations: LocationDescriptions = {
    nl: suggestion.descriptionTranslations?.nl ?? suggestion.description,
    en: suggestion.descriptionTranslations?.en ?? suggestion.description,
    de: suggestion.descriptionTranslations?.de ?? suggestion.description,
    fr: suggestion.descriptionTranslations?.fr ?? suggestion.description,
  }

  for (const lang of languages) {
    descriptionTranslations[lang] = suggestion.descriptionTranslations?.[lang] ?? suggestion.description
  }

  return {
    id: suggestion.id,
    name: suggestion.name,
    category: suggestionKindToLocationCategory(suggestion.kind),
    categories: [suggestionKindToLocationCategory(suggestion.kind)],
    address: '',
    latitude: 0,
    longitude: 0,
    rating: null,
    distance_from_bnb: parseDistanceToKm(suggestion.distance),
    image_reference: suggestion.photo,
    google_maps_link: suggestion.externalUrl,
    recommended_for_guests_reason: suggestion.description,
    descriptions: descriptionTranslations,
    selected: suggestion.selected !== false,
  }
}

function createSuggestionFromLocation(location: WizardLocation, lang: Language): WizardSuggestion {
  const description = location.descriptions[lang] ?? location.descriptions.nl

  return {
    id: location.id,
    kind: locationCategoryToSuggestionKind(location.category),
    source: 'google-maps',
    name: location.name,
    description,
    descriptionTranslations: location.descriptions,
    photo: location.image_reference || getSamplePhotoUrl(location.name, locationCategoryToSuggestionKind(location.category), 0),
    openingHours: '',
    contact: location.address,
    counter: 1,
    distance: formatDistanceLabel(location.distance_from_bnb, lang),
    externalUrl: location.google_maps_link ?? '',
    selected: location.selected,
    x: 50,
    y: 50,
    tags: [location.category, location.address].filter(Boolean),
  }
}

export function buildWizardSiteData(input: WizardBuildInput): SiteData {
  const siteData = createEmptySiteData(input.name)
  const resolvedLocation = input.address?.formatted?.trim() || input.location.trim()
  const mergedSettings: WizardAppSettings = {
    ...siteData.settings,
    settingsEnabled: true,
    languageGateEnabled: true,
    textScaleEnabled: true,
    defaultDarkMode: false,
    defaultTextScale: 1,
    nearbyView: 'list',
    showCountdown: false,
    arrivalDate: undefined,
    checkoutDate: undefined,
    ...input.appSettings,
  }
  siteData.languages = input.languages
  siteData.defaultLanguage = input.defaultLanguage
  siteData.theme = { ...siteData.theme, ...themePresets[input.category] }
  if (input.theme) siteData.theme = { ...siteData.theme, ...input.theme }
  siteData.meta.title = input.name
  siteData.meta.subtitle = `${categoryTitles.nl[input.category]} in ${resolvedLocation}`
  siteData.meta.description = `${input.name} is een ${categoryTitles.nl[input.category]} in ${resolvedLocation} met lokale tips, contactinformatie en slimme suggesties.`
  siteData.meta.location = resolvedLocation
  siteData.meta.category = input.category
  siteData.settings = {
    settingsEnabled: mergedSettings.settingsEnabled,
    languageGateEnabled: mergedSettings.languageGateEnabled,
    textScaleEnabled: mergedSettings.textScaleEnabled,
    defaultDarkMode: mergedSettings.defaultDarkMode,
    defaultTextScale: mergedSettings.defaultTextScale,
    nearbyView: mergedSettings.nearbyView,
  }

  const wizardLocations = (input.locations?.length ? input.locations : input.suggestions.map((item) => createFallbackWizardLocation(item, input.languages)))
    .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id || candidate.name.toLowerCase() === item.name.toLowerCase()) === index)
  const selectedLocations = wizardLocations.filter((item) => item.selected !== false)
  const selectedFacilities = (input.facilities ?? []).filter((item) => item.selected)
  const welcomeText = input.welcomeTranslations?.[input.defaultLanguage] ?? input.welcomeMessage?.trim() ?? buildDefaultWelcomeText(input.name, resolvedLocation)
  const bookingPromoText = input.booking?.promoTranslations?.[input.defaultLanguage]
    ?? input.booking?.promoText?.trim()
    ?? buildDefaultBookingPromoText(input.name)
  const bookingTranslations = Object.fromEntries(
    input.languages.map((lang) => [
      lang,
      input.booking?.promoTranslations?.[lang]
        ?? input.booking?.promoTranslations?.[input.defaultLanguage]
        ?? localizeWizardText(bookingPromoText, lang, 'booking', input.name, resolvedLocation),
    ])
  ) as LocalizedTextMap
  const contactNote = input.contact?.noteTranslations?.[input.defaultLanguage]
    ?? input.contact?.note?.trim()
    ?? buildDefaultContactNote(input.name)
  const contactNoteTranslations = Object.fromEntries(
    input.languages.map((lang) => [
      lang,
      input.contact?.noteTranslations?.[lang]
        ?? input.contact?.noteTranslations?.[input.defaultLanguage]
        ?? localizeWizardText(contactNote, lang, 'contact', input.name, resolvedLocation),
    ])
  ) as LocalizedTextMap
  const environment: EnvironmentData = {
    all: selectedLocations,
    restaurants: selectedLocations.filter((item) => locationHasCategory(item, 'restaurant')),
    tourism: selectedLocations.filter((item) => locationHasCategory(item, 'tourism')),
    shops: selectedLocations.filter((item) => locationHasCategory(item, 'shops')),
  }

  const uploadedPhotoImages: PhotoItem[] = (input.photos ?? []).map((item, index) => ({
    id: item.id || `upload-${index + 1}`,
    url: item.url,
    caption: item.caption,
    alt: item.alt || item.caption || item.category,
  }))
  const fallbackPhotoImages: PhotoItem[] = selectedLocations.slice(0, 6).map((locationItem, index) => ({
    id: `photo-${index + 1}`,
    url: locationItem.image_reference || getSamplePhotoUrl(locationItem.name, locationCategoryToSuggestionKind(locationItem.category), index),
    caption: locationItem.name,
    alt: locationItem.name,
  }))
  const photoImages = [...uploadedPhotoImages, ...fallbackPhotoImages]
    .filter((item, index, array) => item.url && array.findIndex((candidate) => candidate.url === item.url) === index)
    .slice(0, 18)
  const heroImages = [
    ...(input.photos ?? [])
      .filter((item) => item.category === 'bnb-main' || item.category === 'room')
      .map((item) => item.url),
    ...photoImages.map((item) => item.url),
  ].filter((url, index, array) => url && array.indexOf(url) === index)
  const coverImage = (input.photos ?? []).find((item) => (
    item.category === 'bnb-main' || item.category === 'facility' || item.category === 'room'
  ))?.url ?? photoImages[0]?.url ?? ''

  const areaTips: AreaTip[] = selectedLocations
    .filter((item) => !locationHasCategory(item, 'restaurant') || locationHasCategory(item, 'tourism') || locationHasCategory(item, 'shops'))
    .map((item) => ({
      id: item.id,
      emoji: mapKindIcons[locationCategoryToSuggestionKind(getPrimaryAreaCategory(item))],
      category: locationCategoryToSuggestionKind(getPrimaryAreaCategory(item)),
      title: item.name,
      description: item.descriptions[input.defaultLanguage] ?? item.descriptions.nl,
      photo: item.image_reference || getSamplePhotoUrl(item.name, locationCategoryToSuggestionKind(item.category), 0),
      openingHours: '',
      contact: item.address,
      counter: 1,
      distance: formatDistanceLabel(item.distance_from_bnb, input.defaultLanguage),
      url: item.google_maps_link ?? '',
    }))

  const restaurants: RestaurantItem[] = selectedLocations
    .filter((item) => locationHasCategory(item, 'restaurant'))
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.descriptions[input.defaultLanguage] ?? item.descriptions.nl,
      emoji: mapKindIcons.restaurant,
      tags: [formatDistanceLabel(item.distance_from_bnb, input.defaultLanguage), item.address].filter(Boolean),
      photo: item.image_reference || getSamplePhotoUrl(item.name, 'restaurant', 0),
      openingHours: '',
      contact: item.address,
      counter: 1,
      url: item.google_maps_link ?? '',
    }))

  const facilitySections: AccordionSection[] = selectedFacilities.map((item) => ({
    id: item.id,
    icon: item.icon,
    title: item.titleTranslations?.[input.defaultLanguage] ?? item.title,
    body: buildFacilityBody(item, input.defaultLanguage),
  }))

  const houseSections: AccordionSection[] = [
    {
      id: 'welcome',
      icon: 'house',
      title: 'Welkom',
      body: welcomeText,
    },
    ...facilitySections,
  ]

  siteData.content = Object.fromEntries(
    input.languages.map((lang) => [
      lang,
        buildTranslatedContent(lang, input.name, resolvedLocation, input.category, {
          welcomeMessage: input.welcomeTranslations?.[lang] ?? input.welcomeTranslations?.[input.defaultLanguage] ?? welcomeText,
          bookingPromoText: bookingTranslations[lang] ?? bookingPromoText,
          contactNote: contactNoteTranslations[lang] ?? contactNote,
          facilities: selectedFacilities,
          suggestions: selectedLocations.map((item) => createSuggestionFromLocation(item, lang)),
        }),
    ])
  )

  siteData.environment = environment

  siteData.sections = siteData.sections.map((section) => {
    switch (section.type) {
      case 'hero':
        return {
          ...section,
          data: {
            images: heroImages.slice(0, 4),
            showCountdown: mergedSettings.showCountdown,
            arrivalDate: mergedSettings.arrivalDate,
            checkoutDate: mergedSettings.checkoutDate,
          },
        }
      case 'quick-links':
        return {
          ...section,
          data: {
            links: [
              { id: 'house', icon: 'fa-house', label: quickLinkLabels[input.defaultLanguage].house, action: 'house' },
              { id: 'photos', icon: 'fa-images', label: quickLinkLabels[input.defaultLanguage].photos, action: 'photos' },
              { id: 'area', icon: 'fa-map-location-dot', label: quickLinkLabels[input.defaultLanguage].area, action: 'area' },
              { id: 'contact', icon: 'fa-circle-info', label: quickLinkLabels[input.defaultLanguage].contact, action: 'contact' },
            ],
          },
        }
      case 'house-info':
        return {
          ...section,
          data: {
            coverImage,
            sections: houseSections,
          },
        }
      case 'photos':
        return {
          ...section,
          data: { images: photoImages },
        }
      case 'area':
        return {
          ...section,
          data: {
            mapUrl: '',
            tips: areaTips,
          },
        }
      case 'restaurants':
        return {
          ...section,
          data: {
            items: restaurants,
          },
        }
      case 'booking':
        return {
          ...section,
          data: {
            showPromo: true,
            promoText: bookingPromoText,
            bookingUrl: input.booking?.bookingUrl?.trim() ?? '',
            platforms: [],
          },
        }
      case 'contact':
        return {
          ...section,
          data: {
            name: input.contact?.name?.trim() || `${input.name} host`,
            note: contactNote,
            address: input.contact?.address?.trim() || resolvedLocation,
            phone: input.contact?.phone?.trim() ?? '',
            email: input.contact?.email?.trim() ?? '',
            whatsapp: input.contact?.whatsapp?.trim() ?? '',
            socials: [],
          },
        }
      default:
        return section
    }
  })

  return siteData
}

function getLocationCategories(location: WizardLocation) {
  return Array.from(new Set(location.categories?.length ? location.categories : [location.category]))
}

function locationHasCategory(location: WizardLocation, category: LocationCategory) {
  return getLocationCategories(location).includes(category)
}

function getPrimaryAreaCategory(location: WizardLocation): LocationCategory {
  const categories = getLocationCategories(location)
  return categories.find((category) => category !== 'restaurant') ?? location.category
}

export function generateSmartStarterSiteData(input: {
  name: string
  location?: string
  propertyType?: WizardCategory
  vibe?: WizardCategory
  audience?: string
  languages?: Language[]
}): SiteData {
  const category = input.propertyType ?? input.vibe ?? 'bnb'
  const location = input.location?.trim() || 'een mooie plek'
  const languages: Language[] = input.languages?.length ? input.languages : ['nl', 'en']

  return buildWizardSiteData({
    name: input.name,
    location,
    category,
    languages,
    defaultLanguage: languages[0] ?? 'nl',
    welcomeMessage: buildDefaultWelcomeText(input.name, location),
    welcomeTranslations: Object.fromEntries(languages.map((lang) => [lang, localizeWizardText(buildDefaultWelcomeText(input.name, location), lang, 'welcome', input.name, location)])) as LocalizedTextMap,
    booking: {
      promoText: buildDefaultBookingPromoText(input.name),
      promoTranslations: Object.fromEntries(
        languages.map((lang) => [lang, localizeWizardText(buildDefaultBookingPromoText(input.name), lang, 'booking', input.name, location)])
      ) as LocalizedTextMap,
      bookingUrl: '',
    },
    contact: {
      name: `${input.name} host`,
      note: buildDefaultContactNote(input.name),
      noteTranslations: Object.fromEntries(
        languages.map((lang) => [lang, localizeWizardText(buildDefaultContactNote(input.name), lang, 'contact', input.name, location)])
      ) as LocalizedTextMap,
      address: location,
      phone: '',
      email: '',
      whatsapp: '',
    },
    facilities: generateFacilitySuggestions(category),
    suggestions: generateLocalSuggestions(location, category, languages),
  })
}

function buildTranslatedContent(
  lang: Language,
  name: string,
  location: string,
  category: WizardCategory,
  options?: {
    welcomeMessage?: string
    bookingPromoText?: string
    contactNote?: string
    facilities?: WizardFacility[]
    suggestions?: WizardSuggestion[]
  }
): SiteContent {
  const baseTemplate = DEFAULT_CONTENT[lang] ?? DEFAULT_CONTENT.nl
  const base: SiteContent = {
    meta: { ...baseTemplate.meta },
    nav: { ...baseTemplate.nav },
    hero: { ...baseTemplate.hero },
    sections: { ...baseTemplate.sections },
  }

  const categoryTitle = categoryTitles[lang][category]

  const translations: Record<Language, { subtitle: string; description: string; heading: string; subheading: string }> = {
    nl: {
      subtitle: `${categoryTitle} in ${location}`,
      description: `${name} helpt gasten met lokale tips, slimme suggesties, contactinformatie en een overzichtelijke mobiele ervaring.`,
      heading: `Welkom bij ${name}`,
      subheading: `Een professionele ${categoryTitle} voor ${location}, automatisch gevuld met voorbeeldinhoud en lokale suggesties.`,
    },
    en: {
      subtitle: `${categoryTitle} in ${location}`,
      description: `${name} helps guests with local tips, smart suggestions, contact details and a polished mobile-first experience.`,
      heading: `Welcome to ${name}`,
      subheading: `A professional ${categoryTitle} for ${location}, prefilled with sample content and local suggestions.`,
    },
    de: {
      subtitle: `${categoryTitle} in ${location}`,
      description: `${name} unterstützt Gäste mit lokalen Tipps, smarten Vorschlägen, Kontaktdaten und einer klaren mobilen Erfahrung.`,
      heading: `Willkommen bei ${name}`,
      subheading: `Eine professionelle ${categoryTitle} für ${location}, automatisch mit Beispielinhalten und lokalen Tipps gefüllt.`,
    },
    fr: {
      subtitle: `${categoryTitle} à ${location}`,
      description: `${name} aide vos invités avec des conseils locaux, des suggestions intelligentes, des contacts utiles et une expérience mobile soignée.`,
      heading: `Bienvenue chez ${name}`,
      subheading: `Une ${categoryTitle} professionnelle pour ${location}, préremplie avec du contenu d’exemple et des suggestions locales.`,
    },
  }

  return {
    ...base,
    meta: {
      title: name,
      subtitle: translations[lang].subtitle,
      description: translations[lang].description,
    },
    hero: {
      eyebrow: heroEyebrows[lang],
      heading: translations[lang].heading,
      subheading: options?.welcomeMessage ?? translations[lang].subheading,
      countdownLabel: base.hero.countdownLabel,
    },
    sections: buildSectionTranslations(
      lang,
      location,
      options?.facilities ?? [],
      options?.suggestions ?? [],
      options?.bookingPromoText,
      options?.contactNote
    ),
  }
}

function getSamplePhotoUrl(location: string, kind: SuggestionKind, index: number): string {
  const seedBase = `${location}-${kind}-${samplePhotoKeywords[index % samplePhotoKeywords.length]}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
  return `https://picsum.photos/seed/${seedBase}/900/650`
}

function parseDistanceToKm(input: string): number {
  const normalized = input.trim().toLowerCase().replace(',', '.')
  const value = Number.parseFloat(normalized)

  if (!Number.isFinite(value)) return 0
  if (normalized.includes('m') && !normalized.includes('km')) {
    return value / 1000
  }

  return value
}

function formatDistanceLabel(distanceKm: number, lang: Language): string {
  if (!Number.isFinite(distanceKm)) return ''

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000)
    return `${meters} m`
  }

  const value = distanceKm.toFixed(1)
  const unit: Record<Language, string> = {
    nl: 'km afstand',
    en: 'km away',
    de: 'km entfernt',
    fr: 'km',
  }

  return `${value} ${unit[lang]}`
}

function buildGoogleMapsSearchUrl(name: string, location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${location}`)}`
}

function buildTripAdvisorSearchUrl(name: string, location: string): string {
  return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${name} ${location}`)}`
}

export function buildDefaultWelcomeText(name: string, location: string): string {
  return `Welkom bij ${name} in ${location}. Gebruik deze gastenapp voor je aankomst, huisinformatie, tips in de buurt en directe contactmogelijkheden tijdens je verblijf.`
}

function buildDefaultBookingPromoText(name: string): string {
  return `Boek je verblijf bij ${name} direct via de knop hieronder voor de snelste route naar beschikbaarheid en bevestiging.`
}

function buildDefaultContactNote(name: string): string {
  return `Heb je vragen tijdens je verblijf bij ${name}? Neem gerust contact op, we helpen je graag snel verder.`
}

export function polishWizardText(text: string, type: WizardAiTextType, appName?: string, location?: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) {
    if (type === 'welcome') return buildDefaultWelcomeText(appName ?? 'onze locatie', location ?? 'de omgeving')
    if (type === 'facility') return 'Gasten zien hier direct een duidelijke, gastvrije uitleg over deze voorziening.'
    if (type === 'booking') return buildDefaultBookingPromoText(appName ?? 'deze accommodatie')
    if (type === 'contact') return buildDefaultContactNote(appName ?? 'deze accommodatie')
    if (type === 'location') return `Deze plek is een interessante tip voor gasten in ${location ?? 'de omgeving'}.`
    return `Deze plek is een sterke aanrader tijdens een verblijf in ${location ?? 'de omgeving'}.`
  }

  const sentence = /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`
  const normalized = sentence.charAt(0).toUpperCase() + sentence.slice(1)

  if (type === 'welcome') {
    return `${normalized} In deze app vinden gasten snel hun aankomstinfo, praktische huisdetails en tips voor de buurt.`
  }

  if (type === 'facility') {
    return `${normalized} Zo weten gasten meteen wat ze kunnen gebruiken en hoe deze voorziening werkt tijdens hun verblijf.`
  }

  if (type === 'location') {
    return `${normalized} Zo begrijpen gasten snel waarom deze plek handig of leuk is tijdens hun verblijf.`
  }

  if (type === 'booking') {
    return `${normalized} Zo weten gasten direct waar ze veilig en snel kunnen boeken.`
  }

  if (type === 'contact') {
    return `${normalized} Zo weten gasten meteen hoe ze snel hulp of antwoord kunnen krijgen tijdens hun verblijf.`
  }

  return `${normalized} Daardoor is dit een handige aanrader voor gasten die ${location ?? 'de omgeving'} willen ontdekken.`
}

export function localizeWizardText(
  text: string,
  lang: Language,
  type: WizardAiTextType,
  appName?: string,
  location?: string
): string {
  const source = polishWizardText(text, type, appName, location)
  if (lang === 'nl') return source

  const leadMap: Record<Language, Record<typeof type, string>> = {
    en: {
      welcome: `Welcome to ${appName ?? 'our stay'}. `,
      facility: 'Guests immediately get a clear and friendly explanation here. ',
      location: `This is a practical nearby place for guests staying in ${location ?? 'the area'}. `,
      booking: 'Guests instantly see how to book directly and confidently. ',
      contact: 'Guests immediately understand how to reach out for help. ',
      suggestion: `This is a helpful recommendation in ${location ?? 'the area'}. `,
    },
    de: {
      welcome: `Willkommen bei ${appName ?? 'unserer Unterkunft'}. `,
      facility: 'Hier erhalten Gäste sofort eine klare und freundliche Erklärung. ',
      location: `Dies ist ein praktischer Ort in der Nähe für Gäste in ${location ?? 'der Umgebung'}. `,
      booking: 'Gäste sehen sofort, wie sie direkt und sicher buchen können. ',
      contact: 'Gäste verstehen sofort, wie sie schnell Hilfe bekommen können. ',
      suggestion: `Dies ist eine hilfreiche Empfehlung in ${location ?? 'der Umgebung'}. `,
    },
    fr: {
      welcome: `Bienvenue chez ${appName ?? 'notre hébergement'}. `,
      facility: 'Les invités reçoivent ici immédiatement une explication claire et conviviale. ',
      location: `C’est un lieu pratique à proximité pour les invités séjournant à ${location ?? 'proximité'}. `,
      booking: 'Les invités voient immédiatement comment réserver facilement et en toute confiance. ',
      contact: 'Les invités comprennent tout de suite comment obtenir de l’aide rapidement. ',
      suggestion: `C’est une recommandation utile à ${location ?? 'proximité'}. `,
    },
    nl: {
      welcome: '',
      facility: '',
      location: '',
      booking: '',
      contact: '',
      suggestion: '',
    },
  }

  return `${leadMap[lang][type]}${source}`
}

function buildNearbySeedGroups(category: WizardCategory): Record<'voorziening' | 'restaurant' | 'beleving', Array<{
  kind: SuggestionKind
  name: string
  descriptions: Record<Language, string>
  openingHours: string
  contact: string
  counter: number
  distance: string
  tags: string[]
}>> {
  const categoryFocus: Record<WizardCategory, { service: string; food: string; fun: string }> = {
    bnb: { service: 'dagelijkse gemakken', food: 'lokale gastvrijheid', fun: 'charme en beleving' },
    vakantiehuis: { service: 'praktische boodschappen', food: 'ontspannen samen eten', fun: 'rustige uitstapjes' },
    stadsgids: { service: 'snel stedelijk gemak', food: 'stedelijke hotspots', fun: 'cultuur en highlights' },
    wellness: { service: 'comfort en rust', food: 'lichte en gezonde keuzes', fun: 'ontspanning en balans' },
    familie: { service: 'kindvriendelijke gemakken', food: 'laagdrempelige familieplekken', fun: 'uitjes voor jong en oud' },
    natuur: { service: 'route-informatie en basisvoorzieningen', food: 'groene stopplekken', fun: 'natuurbeleving en uitzicht' },
  }

  const focus = categoryFocus[category]

  return {
    voorziening: [
      createNearbySeed('voorziening', 'Supermarkt dichtbij', focus.service, 'Dagelijks 08:00 - 20:00', '+31 10 100 10 10', 18, '4 min rijden', ['Boodschappen', 'Praktisch']),
      createNearbySeed('voorziening', 'Bakery & Coffee', focus.service, 'Dagelijks 07:30 - 17:00', 'hello@bakery.example', 12, '5 min lopen', ['Ontbijt', 'Koffie']),
      createNearbySeed('voorziening', 'Apotheek', focus.service, 'Ma - Za 09:00 - 18:00', '+31 10 200 20 20', 7, '6 min rijden', ['Zorg', 'Medicatie']),
      createNearbySeed('voorziening', 'Fietsverhuur', focus.service, 'Dagelijks 09:00 - 18:30', 'rent@bikes.example', 15, '8 min lopen', ['Fietsen', 'Mobiliteit']),
      createNearbySeed('voorziening', 'Parkeren & OV', focus.service, '24/7', 'Lokale route-informatie', 10, '3 min lopen', ['Bereikbaarheid', 'Praktisch']),
    ],
    restaurant: [
      createNearbySeed('restaurant', 'Lokale Bistro', focus.food, 'Wo - Zo 17:00 - 22:00', 'reserve@bistro.example', 34, '8 min rijden', ['Diner', 'Lokaal']),
      createNearbySeed('restaurant', 'Ontbijtbar', focus.food, 'Dagelijks 08:00 - 15:00', '+31 10 300 30 30', 19, '5 min lopen', ['Ontbijt', 'Brunch']),
      createNearbySeed('restaurant', 'Terras aan het plein', focus.food, 'Dagelijks 11:00 - 23:00', 'plein@food.example', 22, '7 min lopen', ['Terras', 'Lunch']),
      createNearbySeed('restaurant', 'Signature Kitchen', focus.food, 'Di - Zo 17:30 - 23:00', 'book@signature.example', 28, '9 min rijden', ['Design', 'Fine dining']),
      createNearbySeed('restaurant', 'Familietafel', focus.food, 'Dagelijks 12:00 - 21:30', '+31 10 400 40 40', 25, '10 min rijden', ['Gezin', 'Comfort food']),
    ],
    beleving: [
      createNearbySeed('beleving', 'Historisch centrum', focus.fun, 'Altijd open', 'Toeristisch informatiepunt', 21, '10 min lopen', ['Wandelen', 'Foto']),
      createNearbySeed('route', 'Wandelroute langs highlights', focus.fun, 'Altijd open', 'Route in app', 16, 'Start op 4 min', ['Wandelen', 'Route']),
      createNearbySeed('beleving', 'Museum of galerie', focus.fun, 'Dagelijks 10:00 - 18:00', 'tickets@museum.example', 14, '12 min rijden', ['Cultuur', 'Binnen']),
      createNearbySeed('beleving', 'Lokale markt', focus.fun, 'Vr - Zo 09:00 - 17:00', 'Marktplein', 11, '8 min lopen', ['Lokaal', 'Sfeer']),
      createNearbySeed('route', 'Uitzicht- of natuurroute', focus.fun, 'Altijd open', 'Startpunt in app', 13, '6 min rijden', ['Natuur', 'Uitzicht']),
    ],
  }
}

function createNearbySeed(
  kind: SuggestionKind,
  name: string,
  focus: string,
  openingHours: string,
  contact: string,
  counter: number,
  distance: string,
  tags: string[]
) {
  return {
    kind,
    name,
    descriptions: {
      nl: `${name} is een sterke keuze voor ${focus} tijdens het verblijf.`,
      en: `${name} is a strong choice for ${focus} during the stay.`,
      de: `${name} ist eine starke Empfehlung für ${focus} während des Aufenthalts.`,
      fr: `${name} est un excellent choix pour ${focus} pendant le séjour.`,
    },
    openingHours,
    contact,
    counter,
    distance,
    tags,
  }
}

function buildSectionTranslations(
  lang: Language,
  location: string,
  facilities: WizardFacility[],
  suggestions: WizardSuggestion[],
  bookingPromoText?: string,
  contactNote?: string
) {
  return {
    ui: buildUiSectionCopy(lang),
    quickLinks: {
      house: quickLinkLabels[lang].house,
      photos: quickLinkLabels[lang].photos,
      area: quickLinkLabels[lang].area,
      contact: quickLinkLabels[lang].contact,
    },
    house: Object.fromEntries([
      [
        'welcome',
        {
          title: houseStaticTranslations[lang].welcomeTitle,
          body: houseStaticTranslations[lang].welcomeBodyPrefix,
        },
      ],
      ...facilities.map((item) => [
        item.id,
        {
          title: item.titleTranslations?.[lang] ?? item.title,
          body: item.descriptionTranslations?.[lang] ?? item.description,
        },
      ]),
    ]),
    area: Object.fromEntries(
      suggestions
        .filter((item) => item.kind !== 'restaurant')
        .map((item) => [
          item.id,
          {
            description: item.descriptionTranslations?.[lang] ?? item.description,
          },
        ])
    ),
    restaurants: Object.fromEntries(
      suggestions
        .filter((item) => item.kind === 'restaurant')
        .map((item) => [
          item.id,
          {
            description: item.descriptionTranslations?.[lang] ?? item.description,
          },
        ])
    ),
    booking: {
      promoText: bookingPromoText,
    },
    contact: {
      note: contactNote,
    },
  }
}

const quickLinkLabels: Record<Language, Record<'house' | 'photos' | 'area' | 'contact', string>> = {
  nl: { house: 'Huis', photos: 'Foto\'s', area: 'Buurt', contact: 'Info' },
  en: { house: 'House', photos: 'Photos', area: 'Area', contact: 'Info' },
  de: { house: 'Haus', photos: 'Fotos', area: 'Umgebung', contact: 'Info' },
  fr: { house: 'Maison', photos: 'Photos', area: 'Environs', contact: 'Info' },
}

const houseStaticTranslations: Record<Language, { welcomeTitle: string; welcomeBodyPrefix: string }> = {
  nl: {
    welcomeTitle: 'Welkom',
    welcomeBodyPrefix: 'Gebruik deze app voor alle belangrijke informatie, praktische stappen en lokale tips tijdens je verblijf.',
  },
  en: {
    welcomeTitle: 'Welcome',
    welcomeBodyPrefix: 'Use this app for all key information, practical steps, and local tips during your stay.',
  },
  de: {
    welcomeTitle: 'Willkommen',
    welcomeBodyPrefix: 'Nutzen Sie diese App für alle wichtigen Informationen, praktische Schritte und lokale Tipps während Ihres Aufenthalts.',
  },
  fr: {
    welcomeTitle: 'Bienvenue',
    welcomeBodyPrefix: 'Utilisez cette app pour toutes les informations essentielles, les étapes pratiques et les conseils locaux pendant votre séjour.',
  },
}

function buildUiSectionCopy(lang: Language) {
  const ui = {
    nl: {
      languageGateKicker: 'Kies je taal',
      languageGateTitle: 'Welkom',
      languageGateCopy: 'Selecteer je voorkeurstaal om de app direct goed te starten.',
      settingsKicker: 'Instellingen',
      settingsTitle: 'Pas de appweergave aan',
      darkMode: 'Donkere modus',
      themeToggle: 'Wisselen',
      textSize: 'Tekstgrootte',
      textSizeSmall: 'Klein',
      textSizeLarge: 'Groot',
      language: 'Taal',
      amenitiesTitle: 'Voorzieningen',
      areaTitle: 'Omgeving',
      areaKicker: 'Zorgvuldig geselecteerd rond het verblijf',
      routeButton: 'Route openen',
      googleRouteButton: 'Google Maps',
      quickCardShopsTitle: 'Dichtbij',
      quickCardShopsText: 'Supermarkten en snelle boodschappen vlakbij.',
      quickCardTourismTitle: 'Ontdekken',
      quickCardTourismText: 'Routes, uitzicht en lokale highlights.',
      quickCardRestaurantsTitle: 'Eten',
      quickCardRestaurantsText: 'Restaurants in de buurt bekijken.',
      quickCardMapTitle: 'Kaart',
      quickCardMapText: 'Open direct de omgeving in Google Maps.',
      quickLinkHouseBlurb: 'Informatie over de woning en hoe alles werkt.',
      quickLinkPhotosBlurb: 'Een algemeen beeld van de accommodatie.',
      quickLinkAreaBlurb: 'Ontdek wat je in de buurt kunt doen.',
      quickLinkContactBlurb: 'Alle nuttige informatie en contact tijdens je verblijf.',
      listView: 'Lijst',
      mapView: 'Kaart',
      tourismTitle: 'Toerisme',
      shopsTitle: 'Winkels',
      restaurantsTitle: 'Restaurants',
      contactTitle: 'Contact',
      contactName: 'Naam',
      contactPhone: 'Telefoon',
      contactEmail: 'E-mail',
      contactAddress: 'Adres',
      mapsLink: 'Open in Google Maps',
      openLabel: 'Open',
      contactLabel: 'Contact',
      counterLabel: 'Teller',
      bookingCta: 'Boek nu',
      emptyHouse: 'Voeg huisinfo toe in de editor.',
      photosLead: 'Bekijk hier een snelle impressie van de accommodatie.',
      galleryPrevLabel: 'Vorige foto',
      galleryNextLabel: 'Volgende foto',
      emptyPhotos: 'Voeg foto’s toe in de editor.',
      emptyNearby: 'Voeg interessante plekken in de buurt toe in de editor.',
    },
    en: {
      languageGateKicker: 'Choose your language',
      languageGateTitle: 'Welcome',
      languageGateCopy: 'Select your preferred language to start the app correctly right away.',
      settingsKicker: 'Settings',
      settingsTitle: 'Adjust the app display',
      darkMode: 'Dark mode',
      themeToggle: 'Toggle',
      textSize: 'Text size',
      textSizeSmall: 'Small',
      textSizeLarge: 'Large',
      language: 'Language',
      amenitiesTitle: 'Amenities',
      areaTitle: 'Area',
      areaKicker: 'Carefully selected around your stay',
      routeButton: 'Open route',
      googleRouteButton: 'Google Maps',
      quickCardShopsTitle: 'Nearby',
      quickCardShopsText: 'Supermarkets and quick essentials close by.',
      quickCardTourismTitle: 'Explore',
      quickCardTourismText: 'Routes, views and local highlights.',
      quickCardRestaurantsTitle: 'Food',
      quickCardRestaurantsText: 'See restaurants near the stay.',
      quickCardMapTitle: 'Map',
      quickCardMapText: 'Open the area directly in Google Maps.',
      quickLinkHouseBlurb: 'Information about the stay and how everything works.',
      quickLinkPhotosBlurb: 'A quick visual impression of the accommodation.',
      quickLinkAreaBlurb: 'Discover what to do nearby.',
      quickLinkContactBlurb: 'Useful information and contact options during your stay.',
      listView: 'List',
      mapView: 'Map',
      tourismTitle: 'Tourism',
      shopsTitle: 'Shops',
      restaurantsTitle: 'Restaurants',
      contactTitle: 'Contact',
      contactName: 'Name',
      contactPhone: 'Phone',
      contactEmail: 'Email',
      contactAddress: 'Address',
      mapsLink: 'Open in Google Maps',
      openLabel: 'Open',
      contactLabel: 'Contact',
      counterLabel: 'Counter',
      bookingCta: 'Book now',
      emptyHouse: 'Add house information in the editor.',
      photosLead: 'See a quick visual impression of the accommodation here.',
      galleryPrevLabel: 'Previous photo',
      galleryNextLabel: 'Next photo',
      emptyPhotos: 'Add photos in the editor.',
      emptyNearby: 'Add interesting places nearby in the editor.',
    },
    de: {
      languageGateKicker: 'Sprache wählen',
      languageGateTitle: 'Willkommen',
      languageGateCopy: 'Wählen Sie Ihre bevorzugte Sprache, damit die App sofort richtig startet.',
      settingsKicker: 'Einstellungen',
      settingsTitle: 'App-Anzeige anpassen',
      darkMode: 'Dunkelmodus',
      themeToggle: 'Umschalten',
      textSize: 'Textgröße',
      textSizeSmall: 'Klein',
      textSizeLarge: 'Groß',
      language: 'Sprache',
      amenitiesTitle: 'Ausstattung',
      areaTitle: 'Umgebung',
      areaKicker: 'Sorgfältig ausgewählt rund um den Aufenthalt',
      routeButton: 'Route öffnen',
      googleRouteButton: 'Google Maps',
      quickCardShopsTitle: 'In der Nähe',
      quickCardShopsText: 'Supermärkte und schnelle Einkäufe ganz nah.',
      quickCardTourismTitle: 'Entdecken',
      quickCardTourismText: 'Routen, Aussicht und lokale Highlights.',
      quickCardRestaurantsTitle: 'Essen',
      quickCardRestaurantsText: 'Restaurants in der Nähe ansehen.',
      quickCardMapTitle: 'Karte',
      quickCardMapText: 'Die Umgebung direkt in Google Maps öffnen.',
      quickLinkHouseBlurb: 'Informationen zur Unterkunft und wie alles funktioniert.',
      quickLinkPhotosBlurb: 'Ein schneller Eindruck von der Unterkunft.',
      quickLinkAreaBlurb: 'Entdecken Sie, was Sie in der Nähe tun können.',
      quickLinkContactBlurb: 'Nützliche Informationen und Kontakte für Ihren Aufenthalt.',
      listView: 'Liste',
      mapView: 'Karte',
      tourismTitle: 'Tourismus',
      shopsTitle: 'Läden',
      restaurantsTitle: 'Restaurants',
      contactTitle: 'Kontakt',
      contactName: 'Name',
      contactPhone: 'Telefon',
      contactEmail: 'E-Mail',
      contactAddress: 'Adresse',
      mapsLink: 'In Google Maps öffnen',
      openLabel: 'Geöffnet',
      contactLabel: 'Kontakt',
      counterLabel: 'Zähler',
      bookingCta: 'Jetzt buchen',
      emptyHouse: 'Fügen Sie Hausinfos im Editor hinzu.',
      photosLead: 'Hier sehen Sie einen schnellen Eindruck der Unterkunft.',
      galleryPrevLabel: 'Vorheriges Foto',
      galleryNextLabel: 'Nächstes Foto',
      emptyPhotos: 'Fügen Sie Fotos im Editor hinzu.',
      emptyNearby: 'Fügen Sie interessante Orte in der Nähe im Editor hinzu.',
    },
    fr: {
      languageGateKicker: 'Choisissez votre langue',
      languageGateTitle: 'Bienvenue',
      languageGateCopy: 'Sélectionnez votre langue préférée pour démarrer correctement l’app immédiatement.',
      settingsKicker: 'Réglages',
      settingsTitle: 'Ajustez l’affichage de l’app',
      darkMode: 'Mode sombre',
      themeToggle: 'Basculer',
      textSize: 'Taille du texte',
      textSizeSmall: 'Petit',
      textSizeLarge: 'Grand',
      language: 'Langue',
      amenitiesTitle: 'Équipements',
      areaTitle: 'Environs',
      areaKicker: 'Sélection soignée autour du séjour',
      routeButton: 'Ouvrir l’itinéraire',
      googleRouteButton: 'Google Maps',
      quickCardShopsTitle: 'Tout près',
      quickCardShopsText: 'Supermarchés et achats rapides à proximité.',
      quickCardTourismTitle: 'Découvrir',
      quickCardTourismText: 'Itinéraires, vues et points forts locaux.',
      quickCardRestaurantsTitle: 'Manger',
      quickCardRestaurantsText: 'Voir les restaurants à proximité.',
      quickCardMapTitle: 'Carte',
      quickCardMapText: 'Ouvrir directement la zone dans Google Maps.',
      quickLinkHouseBlurb: 'Informations sur le logement et son fonctionnement.',
      quickLinkPhotosBlurb: 'Un aperçu rapide de l’hébergement.',
      quickLinkAreaBlurb: 'Découvrez quoi faire à proximité.',
      quickLinkContactBlurb: 'Infos utiles et contacts pendant votre séjour.',
      listView: 'Liste',
      mapView: 'Carte',
      tourismTitle: 'Tourisme',
      shopsTitle: 'Boutiques',
      restaurantsTitle: 'Restaurants',
      contactTitle: 'Contact',
      contactName: 'Nom',
      contactPhone: 'Téléphone',
      contactEmail: 'E-mail',
      contactAddress: 'Adresse',
      mapsLink: 'Ouvrir dans Google Maps',
      openLabel: 'Ouvert',
      contactLabel: 'Contact',
      counterLabel: 'Compteur',
      bookingCta: 'Réserver',
      emptyHouse: 'Ajoutez les infos du logement dans l’éditeur.',
      photosLead: 'Découvrez ici un aperçu rapide de l’hébergement.',
      galleryPrevLabel: 'Photo précédente',
      galleryNextLabel: 'Photo suivante',
      emptyPhotos: 'Ajoutez des photos dans l’éditeur.',
      emptyNearby: 'Ajoutez des lieux intéressants à proximité dans l’éditeur.',
    },
  }

  return ui[lang]
}
