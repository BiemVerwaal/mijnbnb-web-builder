"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CalendarCheck,
  ChevronDown,
  ExternalLink,
  Globe2,
  Home,
  Image as ImageIcon,
  Landmark,
  List,
  Mail,
  Map,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Wand2,
} from "lucide-react";
import LocationPhotoList from "@/components/wizard/LocationPhotoList";
import LocationMap from "@/components/wizard/LocationMap";
import BnbPhotoPanel from "@/components/wizard/BnbPhotoPanel";
import type { PhotoResult } from "@/components/wizard/PhotoPickerModal";
import AppIcon from "@/components/ui/AppIcon";
import {
  buildFacilityBody,
  buildDefaultWelcomeText,
  buildWizardSiteData,
  detectSuggestedLanguages,
  generateFacilitySuggestions,
  formatWizardAddress,
  isWizardAddressComplete,
  type LocalizedTextMap,
  requestNearbySuggestions,
  requestLocationPhotoSuggestions,
  requestWizardAiText,
  type WizardAddress,
  type WizardAppSettings,
  type WizardBookingDetails,
  type WizardCategory,
  type WizardContactDetails,
  type WizardFacility,
  type WizardFacilityGroup,
  type WizardLocation,
  type WizardPhoto,
  type WizardPhotoCategory,
  type WizardSuggestion,
} from "@/lib/site-ai";
import type { Language, LocationCategory, SiteTheme } from "@/types";
import { DEFAULT_THEME } from "@/lib/template-engine";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

interface WizardDraftState {
  step: WizardStep;
  name: string;
  address: WizardAddress;
  category: WizardCategory;
  languages: Language[];
  defaultLanguage: Language;
  welcomeText: string;
  welcomeTranslations: LocalizedTextMap;
  facilities: WizardFacility[];
  photos: WizardPhoto[];
  booking: WizardBookingDetails;
  contact: WizardContactDetails;
  appSettings: WizardAppSettings;
  locations: WizardLocation[];
  suggestions: WizardSuggestion[];
  resultsView: "list" | "map";
  locationFilter: LocationCategory | "all";
  locationSort: "distance" | "rating" | "name";
}

const categoryCatalog: Record<
  WizardCategory,
  Record<Language, { title: string; description: string; emoji: string }>
> = {
  bnb: {
    nl: {
      title: "BnB gastenapp",
      description: "Warme hostbeleving zoals in de template.",
      emoji: "house",
    },
    en: {
      title: "B&B guest app",
      description: "Warm host experience matching the template.",
      emoji: "house",
    },
    de: {
      title: "BnB Gäste-App",
      description: "Warme Gastgeber-Erfahrung passend zur Vorlage.",
      emoji: "house",
    },
    fr: {
      title: "App d’accueil BnB",
      description: "Expérience d’accueil chaleureuse comme dans le template.",
      emoji: "house",
    },
  },
  vakantiehuis: {
    nl: {
      title: "Vakantiehuis",
      description: "Praktische info en lokale tips voor zelfstandig verblijf.",
      emoji: "key",
    },
    en: {
      title: "Holiday home",
      description: "Practical info and local tips for self-catering stays.",
      emoji: "key",
    },
    de: {
      title: "Ferienhaus",
      description:
        "Praktische Infos und lokale Tipps für unabhängige Aufenthalte.",
      emoji: "key",
    },
    fr: {
      title: "Maison de vacances",
      description:
        "Infos pratiques et conseils locaux pour un séjour autonome.",
      emoji: "key",
    },
  },
  stadsgids: {
    nl: {
      title: "Stadsgids",
      description: "Voor hotspots, routes en stedelijke gastapps.",
      emoji: "building",
    },
    en: {
      title: "City guide",
      description: "For hotspots, routes, and urban guest apps.",
      emoji: "building",
    },
    de: {
      title: "Stadtguide",
      description: "Für Hotspots, Routen und urbane Gäste-Apps.",
      emoji: "building",
    },
    fr: {
      title: "Guide urbain",
      description: "Pour les hotspots, itinéraires et apps de séjour en ville.",
      emoji: "building",
    },
  },
  wellness: {
    nl: {
      title: "Wellness verblijf",
      description: "Rustige UX, luxe details en wellness-gevoel.",
      emoji: "sparkles",
    },
    en: {
      title: "Wellness stay",
      description: "Calm UX, refined details, and a wellness feel.",
      emoji: "sparkles",
    },
    de: {
      title: "Wellness-Aufenthalt",
      description: "Ruhige UX, edle Details und Wellness-Gefühl.",
      emoji: "sparkles",
    },
    fr: {
      title: "Séjour bien-être",
      description: "UX apaisée, détails soignés et ambiance bien-être.",
      emoji: "sparkles",
    },
  },
  familie: {
    nl: {
      title: "Familieverblijf",
      description: "Kindvriendelijke tips en heldere voorzieningen.",
      emoji: "users",
    },
    en: {
      title: "Family stay",
      description: "Family-friendly tips and clear amenities.",
      emoji: "users",
    },
    de: {
      title: "Familienaufenthalt",
      description: "Familienfreundliche Tipps und klare Ausstattung.",
      emoji: "users",
    },
    fr: {
      title: "Séjour familial",
      description: "Conseils familiaux et équipements bien expliqués.",
      emoji: "users",
    },
  },
  natuur: {
    nl: {
      title: "Natuurverblijf",
      description: "Routes, rust en lokale natuurervaringen.",
      emoji: "leaf",
    },
    en: {
      title: "Nature stay",
      description: "Routes, calm, and local nature experiences.",
      emoji: "leaf",
    },
    de: {
      title: "Naturaufenthalt",
      description: "Routen, Ruhe und lokale Naturerlebnisse.",
      emoji: "leaf",
    },
    fr: {
      title: "Séjour nature",
      description: "Itinéraires, calme et expériences nature locales.",
      emoji: "leaf",
    },
  },
};

const placeFilters: Array<LocationCategory | "all"> = [
  "all",
  "restaurant",
  "tourism",
  "shops",
];

const placeCopy: Record<
  Language,
  {
    filterAll: string;
    filterRestaurant: string;
    filterTourism: string;
    filterShops: string;
    sortDistance: string;
    sortRating: string;
    rating: string;
    address: string;
    categoryConfirmTitle: string;
    categoryConfirmText: string;
    selectionLimit: string;
    noPlacesFound: string;
    fetchNotice: string;
  }
> = {
  nl: {
    filterAll: "Alles",
    filterRestaurant: "Restaurants",
    filterTourism: "Toerisme",
    filterShops: "Winkels",
    sortDistance: "Sorteer op afstand",
    sortRating: "Sorteer op rating",
    rating: "Rating",
    address: "Adres",
    categoryConfirmTitle:
      "Controleer de categorieën van je geselecteerde plekken",
    categoryConfirmText:
      "Hier bepaal je definitief of een plek onder restaurants, tourism of shops valt. De app zet ze daarna automatisch in de juiste omgeving-sectie.",
    selectionLimit: "Je kunt maximaal 30 plekken selecteren.",
    noPlacesFound: "Nog geen plekken gevonden voor dit adres.",
    fetchNotice: "De AI-zoekstap vult echte plekken in rondom het BnB-adres.",
  },
  en: {
    filterAll: "All",
    filterRestaurant: "Restaurants",
    filterTourism: "Tourism",
    filterShops: "Shops",
    sortDistance: "Sort by distance",
    sortRating: "Sort by rating",
    rating: "Rating",
    address: "Address",
    categoryConfirmTitle: "Confirm the categories of your selected places",
    categoryConfirmText:
      "Here you decide whether a place belongs under restaurants, tourism, or shops. The app will then place them automatically in the correct environment section.",
    selectionLimit: "You can select up to 30 places.",
    noPlacesFound: "No places found for this address yet.",
    fetchNotice:
      "The AI fetch step fills the wizard with real places around the BnB address.",
  },
  de: {
    filterAll: "Alle",
    filterRestaurant: "Restaurants",
    filterTourism: "Tourismus",
    filterShops: "Läden",
    sortDistance: "Nach Entfernung sortieren",
    sortRating: "Nach Bewertung sortieren",
    rating: "Bewertung",
    address: "Adresse",
    categoryConfirmTitle: "Prüfen Sie die Kategorien Ihrer ausgewählten Orte",
    categoryConfirmText:
      "Hier legen Sie fest, ob ein Ort zu Restaurants, Tourismus oder Shops gehört. Die App ordnet ihn danach automatisch dem richtigen Umgebungsbereich zu.",
    selectionLimit: "Sie können maximal 30 Orte auswählen.",
    noPlacesFound: "Für diese Adresse wurden noch keine Orte gefunden.",
    fetchNotice:
      "Der KI-Abruf füllt den Wizard mit echten Orten rund um die BnB-Adresse.",
  },
  fr: {
    filterAll: "Tout",
    filterRestaurant: "Restaurants",
    filterTourism: "Tourisme",
    filterShops: "Boutiques",
    sortDistance: "Trier par distance",
    sortRating: "Trier par note",
    rating: "Note",
    address: "Adresse",
    categoryConfirmTitle: "Vérifiez les catégories des lieux sélectionnés",
    categoryConfirmText:
      "Ici, vous confirmez si un lieu appartient à restaurants, tourism ou shops. L’app le rangera ensuite automatiquement dans la bonne section environnement.",
    selectionLimit: "Vous pouvez sélectionner jusqu’à 30 lieux.",
    noPlacesFound: "Aucun lieu trouvé pour cette adresse pour le moment.",
    fetchNotice:
      "L’étape IA remplit l’assistant avec de vrais lieux autour de l’adresse du BnB.",
  },
};

const facilityGroupLabels: Record<
  Language,
  Record<WizardFacilityGroup, { title: string; description: string }>
> = {
  nl: {
    "bnb-facilities": {
      title: "BnB voorzieningen",
      description:
        "Basisvoorzieningen die gasten direct in de accommodatie gebruiken.",
    },
    "guest-services": {
      title: "Gastservices",
      description: "Services rond aankomst, verblijf en extra gemak.",
    },
    "location-transport": {
      title: "Locatie & vervoer",
      description: "Bereikbaarheid en handige vervoersopties in de buurt.",
    },
    safety: {
      title: "Veiligheid",
      description: "Belangrijke veiligheidsinfo die gasten snel moeten vinden.",
    },
    general: {
      title: "Algemene voorzieningen",
      description: "Extra mogelijkheden om het verblijf nog fijner te maken.",
    },
    outdoor: {
      title: "Buitenruimte",
      description: "Beschikbaarheid van tuin, terras of buitenmeubilair.",
    },
    "sports-wellness": {
      title: "Sport & wellness",
      description: "Zwembad, sauna, fitness of ontspanningsopties.",
    },
    parking: {
      title: "Parkeren",
      description: "Parkeeropties bij het verblijf of in de buurt.",
    },
    "food-drink": {
      title: "Eten & drinken",
      description: "Koffie, ontbijt, restaurant- of keukendiensten.",
    },
    business: {
      title: "Zakelijk",
      description: "Werkplek, wifi en zakelijke voorzieningen.",
    },
    other: {
      title: "Overig",
      description: "Andere voorzieningen die je graag wilt benoemen.",
    },
  },
  en: {
    "bnb-facilities": {
      title: "BnB facilities",
      description: "Core in-stay amenities guests use right away.",
    },
    "guest-services": {
      title: "Guest services",
      description: "Arrival, stay, and convenience services for guests.",
    },
    "location-transport": {
      title: "Location & transport",
      description: "Access, transport, and mobility options nearby.",
    },
    safety: {
      title: "Safety",
      description: "Important safety information guests should find quickly.",
    },
    general: {
      title: "General",
      description: "General amenities that enhance the guest experience.",
    },
    outdoor: {
      title: "Outdoor",
      description: "Garden, patio, terrace or open-air facilities.",
    },
    "sports-wellness": {
      title: "Sports & Wellness",
      description: "Pool, sauna, fitness, or relaxation amenities.",
    },
    parking: {
      title: "Parking",
      description: "On-site or nearby parking options.",
    },
    "food-drink": {
      title: "Food & Drink",
      description: "Breakfast, kitchen, or dining services.",
    },
    business: {
      title: "Business",
      description: "Workspace, wifi, and business-friendly features.",
    },
    other: {
      title: "Other",
      description: "Other amenities you want to highlight.",
    },
  },
  de: {
    "bnb-facilities": {
      title: "BnB-Ausstattung",
      description:
        "Grundausstattung, die Gäste direkt in der Unterkunft nutzen.",
    },
    "guest-services": {
      title: "Gastservices",
      description: "Services rund um Ankunft, Aufenthalt und Komfort.",
    },
    "location-transport": {
      title: "Lage & Verkehr",
      description:
        "Anreise, Mobilität und praktische Transportoptionen in der Nähe.",
    },
    safety: {
      title: "Sicherheit",
      description:
        "Wichtige Sicherheitsinfos, die Gäste schnell finden sollten.",
    },
    general: {
      title: "Allgemein",
      description: "Weitere Services, die den Aufenthalt verfeinern.",
    },
    outdoor: {
      title: "Außenbereich",
      description: "Garten, Terrasse oder Außenmöbel.",
    },
    "sports-wellness": {
      title: "Sport & Wellness",
      description: "Pool, Sauna, Fitness oder Erholung.",
    },
    parking: {
      title: "Parken",
      description: "Parkmöglichkeiten vor Ort oder in der Nähe.",
    },
    "food-drink": {
      title: "Essen & Trinken",
      description: "Frühstück, Küche oder Verpflegungsangebote.",
    },
    business: {
      title: "Business",
      description: "Arbeitsplatz, WLAN und Business-Optionen.",
    },
    other: {
      title: "Andere",
      description: "Weitere Besonderheiten und Extras.",
    },
  },
  fr: {
    "bnb-facilities": {
      title: "Équipements BnB",
      description: "Équipements de base utilisés directement dans le logement.",
    },
    "guest-services": {
      title: "Services invités",
      description: "Services liés à l’arrivée, au séjour et au confort.",
    },
    "location-transport": {
      title: "Emplacement & transport",
      description:
        "Accès, mobilité et options de transport pratiques à proximité.",
    },
    safety: {
      title: "Sécurité",
      description:
        "Informations de sécurité importantes à retrouver rapidement.",
    },
    general: {
      title: "Général",
      description: "Équipements complémentaires pour un séjour plus agréable.",
    },
    outdoor: {
      title: "Extérieur",
      description: "Jardin, terrasse ou espaces ouverts.",
    },
    "sports-wellness": {
      title: "Sport & Bien-être",
      description: "Piscine, sauna, fitness ou détente.",
    },
    parking: {
      title: "Parking",
      description: "Options de stationnement sur place ou à proximité.",
    },
    "food-drink": {
      title: "Restauration",
      description: "Petit-déjeuner, cuisine ou service de boisson.",
    },
    business: {
      title: "Professionnel",
      description: "Espace de travail, wifi et services business.",
    },
    other: {
      title: "Autre",
      description: "Autres équipements à mettre en avant.",
    },
  },
};
const settingsCopy: Record<
  Language,
  {
    currentStep: string;
    remainingSteps: string;
    wizardSetup: string;
    photosTitle: string;
    photosIntro: string;
    uploadButton: string;
    noPhotos: string;
    photoCaption: string;
    removePhoto: string;
    bookingTitle: string;
    bookingIntro: string;
    bookingPromo: string;
    bookingLink: string;
    contactTitle: string;
    contactIntro: string;
    contactName: string;
    contactNote: string;
    contactPhone: string;
    contactEmail: string;
    contactWhatsapp: string;
    contactAddress: string;
    settingsTitle: string;
    settingsIntro: string;
    settingsButton: string;
    languageGate: string;
    darkMode: string;
    textScale: string;
    countdown: string;
    arrivalDate: string;
    checkoutDate: string;
  }
> = {
  nl: {
    currentStep: "Huidige stap",
    remainingSteps: "Resterende stappen",
    wizardSetup: "Wizard-opzet",
    photosTitle: "Foto’s uploaden",
    photosIntro:
      "Upload per soort foto de beelden die in de gegenereerde app zichtbaar moeten worden.",
    uploadButton: "Foto’s kiezen",
    noPhotos: "Nog geen foto’s toegevoegd in deze groep.",
    photoCaption: "Bijschrift",
    removePhoto: "Verwijderen",
    bookingTitle: "Boeken",
    bookingIntro:
      "Voeg een directe boekings-CTA en link toe die in de app zichtbaar wordt.",
    bookingPromo: "Boekingstekst",
    bookingLink: "Boekingslink",
    contactTitle: "Contact",
    contactIntro:
      "Vul hier de host- en contactgegevens in die gasten in de app te zien krijgen.",
    contactName: "Naam host of locatie",
    contactNote: "Korte contacttekst",
    contactPhone: "Telefoon",
    contactEmail: "E-mail",
    contactWhatsapp: "WhatsApp",
    contactAddress: "Contactadres",
    settingsTitle: "App-instellingen",
    settingsIntro:
      "Deze instellingen sturen de settings-knop en basisweergave van de uiteindelijke gastenapp.",
    settingsButton: "Settings-knop tonen",
    languageGate: "Taalselectie bij openen tonen",
    darkMode: "Donkere modus standaard aan",
    textScale: "Tekstgrootte",
    countdown: "Aankomst-countdown tonen",
    arrivalDate: "Aankomstdatum",
    checkoutDate: "Vertrekdatum",
  },
  en: {
    currentStep: "Current step",
    remainingSteps: "Steps remaining",
    wizardSetup: "Wizard setup",
    photosTitle: "Upload photos",
    photosIntro:
      "Upload each photo type that should appear inside the generated guest app.",
    uploadButton: "Choose photos",
    noPhotos: "No photos added in this group yet.",
    photoCaption: "Caption",
    removePhoto: "Remove",
    bookingTitle: "Booking",
    bookingIntro: "Add the direct booking CTA and link shown in the guest app.",
    bookingPromo: "Booking text",
    bookingLink: "Booking link",
    contactTitle: "Contact",
    contactIntro:
      "Enter the host and contact details guests should see inside the app.",
    contactName: "Host or location name",
    contactNote: "Short contact note",
    contactPhone: "Phone",
    contactEmail: "Email",
    contactWhatsapp: "WhatsApp",
    contactAddress: "Contact address",
    settingsTitle: "App settings",
    settingsIntro:
      "These settings drive the settings button and base display of the final guest app.",
    settingsButton: "Show settings button",
    languageGate: "Show language gate on open",
    darkMode: "Enable dark mode by default",
    textScale: "Text size",
    countdown: "Show arrival countdown",
    arrivalDate: "Arrival date",
    checkoutDate: "Checkout date",
  },
  de: {
    currentStep: "Aktueller Schritt",
    remainingSteps: "Verbleibende Schritte",
    wizardSetup: "Assistenten-Setup",
    photosTitle: "Fotos hochladen",
    photosIntro:
      "Laden Sie pro Fototyp die Bilder hoch, die in der generierten Gäste-App erscheinen sollen.",
    uploadButton: "Fotos auswählen",
    noPhotos: "In dieser Gruppe wurden noch keine Fotos hinzugefügt.",
    photoCaption: "Bildunterschrift",
    removePhoto: "Entfernen",
    bookingTitle: "Buchen",
    bookingIntro:
      "Fügen Sie eine direkte Buchungs-CTA und den passenden Link für die Gäste-App hinzu.",
    bookingPromo: "Buchungstext",
    bookingLink: "Buchungslink",
    contactTitle: "Kontakt",
    contactIntro:
      "Tragen Sie hier die Host- und Kontaktdaten ein, die Gäste in der App sehen sollen.",
    contactName: "Name des Hosts oder Standorts",
    contactNote: "Kurzer Kontakthinweis",
    contactPhone: "Telefon",
    contactEmail: "E-Mail",
    contactWhatsapp: "WhatsApp",
    contactAddress: "Kontaktadresse",
    settingsTitle: "App-Einstellungen",
    settingsIntro:
      "Diese Einstellungen steuern die Settings-Schaltfläche und die Grunddarstellung der finalen Gäste-App.",
    settingsButton: "Settings-Schaltfläche anzeigen",
    languageGate: "Sprachauswahl beim Öffnen anzeigen",
    darkMode: "Dunkelmodus standardmäßig aktiv",
    textScale: "Textgröße",
    countdown: "Ankunfts-Countdown anzeigen",
    arrivalDate: "Anreisedatum",
    checkoutDate: "Abreisedatum",
  },
  fr: {
    currentStep: "Étape actuelle",
    remainingSteps: "Étapes restantes",
    wizardSetup: "Configuration de l’assistant",
    photosTitle: "Téléverser des photos",
    photosIntro:
      "Téléversez les photos qui doivent apparaître dans l’app invité générée.",
    uploadButton: "Choisir des photos",
    noPhotos: "Aucune photo ajoutée dans ce groupe pour le moment.",
    photoCaption: "Légende",
    removePhoto: "Supprimer",
    bookingTitle: "Réservation",
    bookingIntro:
      "Ajoutez le CTA de réservation directe et le lien affichés dans l’app.",
    bookingPromo: "Texte de réservation",
    bookingLink: "Lien de réservation",
    contactTitle: "Contact",
    contactIntro:
      "Renseignez ici les coordonnées de l’hôte visibles par les invités dans l’app.",
    contactName: "Nom de l’hôte ou du lieu",
    contactNote: "Petit message de contact",
    contactPhone: "Téléphone",
    contactEmail: "E-mail",
    contactWhatsapp: "WhatsApp",
    contactAddress: "Adresse de contact",
    settingsTitle: "Réglages de l’app",
    settingsIntro:
      "Ces réglages pilotent le bouton des paramètres et l’affichage de base de l’app finale.",
    settingsButton: "Afficher le bouton réglages",
    languageGate: "Afficher le choix de langue à l’ouverture",
    darkMode: "Mode sombre activé par défaut",
    textScale: "Taille du texte",
    countdown: "Afficher le compte à rebours d’arrivée",
    arrivalDate: "Date d’arrivée",
    checkoutDate: "Date de départ",
  },
};

const wizardCopy: Record<
  Language,
  {
    kicker: string;
    title: string;
    intro: string;
    detectTranslate: string;
    progress: string;
    stepOf: string;
    back: string;
    next: string;
    finish: string;
    creating: string;
    backDashboard: string;
    appLanguages: string;
    defaultSuffix: string;
    infoAiTitle: string;
    infoAiText: string;
    infoTranslateTitle: string;
    infoTranslateText: string;
    infoMapTitle: string;
    infoMapText: string;
    stepLabels: string[];
    stepHints: string[];
    appName: string;
    appNamePlaceholder: string;
    appNameHelp: string;
    location: string;
    locationPlaceholder: string;
    addressStreet: string;
    addressHouseNumber: string;
    addressPostalCode: string;
    addressCity: string;
    addressCountry: string;
    addressSearch: string;
    addressSearchHelp: string;
    addressResolved: string;
    addressSearching: string;
    category: string;
    categoryTitle?: string;
    categoryHelp?: string;
    categorySelected?: string;
    categoryEffect?: string;
    welcomeTitle?: string;
    welcomeField: string;
    welcomePlaceholder: string;
    welcomeHelp: string;
    welcomePreview: string;
    amenitiesTitle: string;
    amenitiesIntro: string;
    amenityShown: string;
    amenityDescription: string;
    amenityDetailsTitle: string;
    amenityLocationLabel: string;
    amenityUsageLabel: string;
    amenityTimingLabel: string;
    amenitySelectionTitle: string;
    amenityPreviewTitle: string;
    amenityPreviewIntro: string;
    amenityEmptyState: string;
    amenityTooltipLabel: string;
    nearbyTitle: string;
    nearbyRefresh: string;
    listView: string;
    mapView: string;
    openSource: string;
    selected: string;
    include: string;
    name: string;
    description: string;
    openingHours: string;
    contact: string;
    counter: string;
    distance: string;
    tags: string;
    photoSuggestion: string;
    sortDistance: string;
    sortRating: string;
    sourceMaps: string;
    sourceTrips: string;
    sourceMapsText: string;
    sourceTripsText: string;
    summary: string;
    autoAdded: string;
    autoItems: string[];
    finishHintTitle: string;
    finishHintText: string;
    statsAvailable: string;
    statsSelected: string;
    statsResults: string;
    statsRestaurants: string;
    statsAmenities: string;
    statsActivities: string;
    detectNotice: string;
    aiDone: string;
    aiImprove: string;
    aiTranslate: string;
    duplicatedName: string;
  }
> = {
  nl: {
    kicker: "Project wizard",
    title: "Bouw je app stap voor stap in dezelfde stijl als de template.",
    intro:
      "Deze wizard maakt een professionele eerste opzet van jouw gastenapp. Op basis van adres, categorie en gekozen onderdelen vullen we de app slim, meertalig en template-consistent in.",
    detectTranslate: "Taal herkennen & vertalen",
    progress: "Voortgang",
    stepOf: "Stap",
    back: "Vorige stap",
    next: "Volgende stap",
    finish: "Wizard afronden en editor openen →",
    creating: "Project aanmaken…",
    backDashboard: "Terug naar dashboard",
    appLanguages: "Talen in app",
    defaultSuffix: "standaard",
    infoAiTitle: "Lokale AI-assistent",
    infoAiText:
      "Verbetert teksten, maakt voorbeeldcontent en bewaart vertaalde varianten zonder betaalde API.",
    infoTranslateTitle: "Volledige taalwisseling",
    infoTranslateText:
      "De gekozen taal wordt gebruikt in de wizard, de gegenereerde app en dynamische beschrijvingen.",
    infoMapTitle: "5 + 5 + 5 suggesties",
    infoMapText:
      "De wizard toont restaurants, supermarkten/services en activiteiten in lijst- en kaartweergave.",
    stepLabels: [
      "App naam",
      "Adres / locatie",
      "Categorie",
      "Welkomstinstructie",
      "Voorzieningen",
      "Locaties bevestigen",
      "Foto\u2019s",
      "Boeken",
      "Contact",
      "Instellingen",
      "Stijl & afronden",
    ],
    stepHints: [
      "Kies de naam en merkuitstraling van je app.",
      "Gebruik een adres of plaats voor lokale context.",
      "Kies het soort verblijf of ervaring.",
      "Schrijf de welkomstinstructie voor het homescreen.",
      "Selecteer de voorzieningen die in de BnB aanwezig zijn.",
      "Kies welke locaties en activiteiten je wilt toevoegen.",
      "Wijs foto\u2019s toe aan locaties en je BnB.",
      "Stel je boekingsblok en directe link in.",
      "Vul contactgegevens en notitie voor gasten aan.",
      "Bepaal taal-, weergave- en datuminstellingen.",
      "Kies een stijl en kleurthema voor je app, dan afronden.",
    ],
    appName: "Naam van de app",
    appNamePlaceholder: "Bijv. Villa Zonnedauw, LEKker Genieten…",
    appNameHelp:
      "De wizard gebruikt deze naam in dezelfde warme, professionele schrijfstijl als in de template.",
    location: "Adres / locatie",
    locationPlaceholder: "Bijv. Voorstraat 12, Ammerstol",
    addressStreet: "Straat",
    addressHouseNumber: "Huisnummer",
    addressPostalCode: "Postcode",
    addressCity: "Plaats",
    addressCountry: "Land",
    addressSearch: "Adres controleren en omgeving zoeken",
    addressSearchHelp:
      "Gebruik echte navigatievelden. We zoeken daarna automatisch restaurants, supermarkten en activiteiten rondom dit adres.",
    addressResolved: "Gevonden adres",
    addressSearching: "Adres en omgeving worden opgezocht…",
    category: "Categorie",
    categoryTitle: "Kies het type verblijf",
    categoryHelp:
      "De categorie bepaalt de stijl, kleurtoon en standaardteksten van je app. Je kunt later alles aanpassen, maar dit geeft de beste startpositie.",
    categorySelected: "Je koos:",
    categoryEffect:
      "De app krijgt automatisch de bijpassende kleur, toon en standaard-teksten. In de editor kun je dit altijd verfijnen.",
    welcomeField: "Tekst voor het homescreen",
    welcomePlaceholder:
      "Bijvoorbeeld: welkom, uitleg over aankomst, waar gasten alles kunnen vinden…",
    welcomeHelp:
      "Deze tekst komt op het homescreen en verandert automatisch mee wanneer de app-taal wijzigt.",
    welcomePreview: "Zo start de welkomsttekst in de app",
    amenitiesTitle: "Kies welke voorzieningen aanwezig zijn",
    amenitiesIntro:
      "Elke gekozen voorziening wordt netjes uitgelegd in de house-info van de app. Met de AI-knop verbeter je de tekst en maak je direct vertalingen voor alle gekozen talen.",
    amenityShown: "Wordt getoond in de house-info sectie van de app.",
    amenityDescription: "AI-uitleg voor gasten",
    amenityDetailsTitle: "Extra details",
    amenityLocationLabel: "Locatie of plek",
    amenityUsageLabel: "Gebruik / instructie",
    amenityTimingLabel: "Tijden of momenten",
    amenitySelectionTitle: "Geselecteerde voorzieningen",
    amenityPreviewTitle: "Live preview voor gasten",
    amenityPreviewIntro:
      "Zo ziet de house-info eruit met jouw geselecteerde voorzieningen.",
    amenityEmptyState:
      "Selecteer links een voorziening om uitleg en extra details toe te voegen.",
    amenityTooltipLabel: "Tip voor operator",
    nearbyTitle: "Selecteer locaties in de buurt",
    nearbyRefresh: "Zoek lokale suggesties opnieuw",
    listView: "Lijst",
    mapView: "Kaart",
    openSource: "Open bron",
    selected: "Geselecteerd",
    include: "Opnemen",
    name: "Naam",
    description: "Beschrijving",
    openingHours: "Openingstijden",
    contact: "Contactinformatie",
    counter: "Teller",
    distance: "Afstand",
    tags: "Tags",
    photoSuggestion: "Foto suggestie",
    sortDistance: "Sorteer op afstand",
    sortRating: "Sorteer op rating",
    sourceMaps: "OpenStreetMap kaartdata",
    sourceTrips: "AI beschrijvingen",
    sourceMapsText:
      "Restaurants, supermarkten en activiteiten worden echt opgehaald rond het ingevulde adres.",
    sourceTripsText:
      "AI schrijft per gevonden plek een korte gastvriendelijke omschrijving die je daarna verder kunt vertalen of bewerken.",
    summary: "Samenvatting",
    autoAdded: "Wat wordt automatisch toegevoegd?",
    autoItems: [
      "voorbeeldteksten en interface-copy in meerdere talen",
      "welkomstinstructie voor het homescreen met AI-vertalingen",
      "geselecteerde BnB-voorzieningen met meertalige uitleg",
      "restaurants, services en activiteiten op de juiste plek in de app",
      "template-achtige structuur, iconen en live preview als startpunt",
    ],
    finishHintTitle: "AI-suggesties voor UX en inhoud",
    finishHintText:
      "De eerste versie bevat al nette voorbeeldcontent. Daarna kun je in de editor alles verder verfijnen, herschikken en publiceren.",
    statsAvailable: "Beschikbaar",
    statsSelected: "Geselecteerd",
    statsResults: "Resultaten",
    statsRestaurants: "Restaurants",
    statsAmenities: "Voorzieningen",
    statsActivities: "Activiteiten",
    detectNotice: "Taalherkenning klaar",
    aiDone:
      "AI heeft de tekst verbeterd en vertalingen voor alle geselecteerde talen opgeslagen.",
    aiImprove: "AI verbeteren",
    aiTranslate: "AI vertalen",
    duplicatedName: "Deze naam is al in gebruik. Kies een andere naam.",
  },
  en: {
    kicker: "Project wizard",
    title: "Build your app step by step in the same style as the template.",
    intro:
      "This wizard creates a polished first version of your guest app. Based on address, category, and selected content, the app is filled intelligently, multilingual, and template-aligned.",
    detectTranslate: "Detect language & translate",
    progress: "Progress",
    stepOf: "Step",
    back: "Previous step",
    next: "Next step",
    finish: "Finish wizard and open editor →",
    creating: "Creating project…",
    backDashboard: "Back to dashboard",
    appLanguages: "App languages",
    defaultSuffix: "default",
    infoAiTitle: "Local AI assistant",
    infoAiText:
      "Improves text, creates starter content, and stores translated variants without a paid API.",
    infoTranslateTitle: "Full language switching",
    infoTranslateText:
      "The selected language is used in the wizard, the generated app, and dynamic descriptions.",
    infoMapTitle: "5 + 5 + 5 suggestions",
    infoMapText:
      "The wizard shows restaurants, supermarkets/services, and activities in list and map view.",
    stepLabels: [
      "App name",
      "Address / location",
      "Category",
      "Welcome instruction",
      "Amenities",
      "Confirm locations",
      "Photos",
      "Booking",
      "Contact",
      "Settings",
      "Style & finish",
    ],
    stepHints: [
      "Choose the name and brand feel of your app.",
      "Use an address or place for local context.",
      "Choose the type of stay or experience.",
      "Write the welcome instruction for the home screen.",
      "Select which amenities are available in the stay.",
      "Choose which nearby locations and activities to add.",
      "Assign photos to locations and your BnB.",
      "Set up the booking block and direct link.",
      "Add host contact details and a guest note.",
      "Adjust language, display, and date settings.",
      "Choose a style and colour theme for your app, then finish.",
    ],
    appName: "App name",
    appNamePlaceholder: "For example: Villa Zonnedauw, LEKker Genieten…",
    appNameHelp:
      "The wizard uses this name in the same warm, professional writing style as the template.",
    location: "Address / location",
    locationPlaceholder: "For example: Voorstraat 12, Ammerstol",
    addressStreet: "Street",
    addressHouseNumber: "House number",
    addressPostalCode: "Postal code",
    addressCity: "City",
    addressCountry: "Country",
    addressSearch: "Validate address and search nearby",
    addressSearchHelp:
      "Use real navigation fields. We then automatically look up restaurants, supermarkets, and activities around this address.",
    addressResolved: "Resolved address",
    addressSearching: "Looking up the address and nearby places…",
    category: "Category",
    categoryTitle: "Choose your stay type",
    categoryHelp:
      "The category sets the style, colours and default content of your app. You can change everything later, but this gives you the best starting point.",
    categorySelected: "You chose:",
    categoryEffect:
      "The app automatically gets matching colours, tone and default texts. You can always refine this in the editor.",
    welcomeField: "Home screen text",
    welcomePlaceholder:
      "For example: welcome guests, explain arrival, and tell them where to find everything…",
    welcomeHelp:
      "This text appears on the home screen and automatically changes when the app language changes.",
    welcomePreview: "This is how the welcome text starts in the app",
    amenitiesTitle: "Choose which amenities are available",
    amenitiesIntro:
      "Each selected amenity is explained clearly in the house info section. Use the AI button to improve the text and instantly create translations for all chosen languages.",
    amenityShown: "Shown in the house-info section of the app.",
    amenityDescription: "AI explanation for guests",
    amenityDetailsTitle: "Extra details",
    amenityLocationLabel: "Location or spot",
    amenityUsageLabel: "Usage / instructions",
    amenityTimingLabel: "Times or moments",
    amenitySelectionTitle: "Selected amenities",
    amenityPreviewTitle: "Live guest preview",
    amenityPreviewIntro:
      "This is how the house info looks with your selected amenities.",
    amenityEmptyState:
      "Select an amenity on the left to add guidance and extra details.",
    amenityTooltipLabel: "Operator tip",
    nearbyTitle: "Select nearby locations",
    nearbyRefresh: "Search local suggestions again",
    listView: "List",
    mapView: "Map",
    openSource: "Open source",
    selected: "Selected",
    include: "Include",
    name: "Name",
    description: "Description",
    openingHours: "Opening hours",
    contact: "Contact details",
    counter: "Counter",
    distance: "Distance",
    tags: "Tags",
    photoSuggestion: "Photo suggestion",
    sortDistance: "Sort by distance",
    sortRating: "Sort by rating",
    sourceMaps: "OpenStreetMap data",
    sourceTrips: "AI descriptions",
    sourceMapsText:
      "Restaurants, supermarkets, and activities are fetched as real nearby places around the entered address.",
    sourceTripsText:
      "AI writes a short guest-friendly description for each result so you can refine or translate it afterwards.",
    summary: "Summary",
    autoAdded: "What will be added automatically?",
    autoItems: [
      "starter texts and interface copy in multiple languages",
      "welcome instruction for the home screen with AI translations",
      "selected amenities with multilingual explanations",
      "restaurants, services, and activities in the correct app sections",
      "template-like structure, icons, and live preview as a starting point",
    ],
    finishHintTitle: "AI suggestions for UX and content",
    finishHintText:
      "The first version already contains polished starter content. After that, you can refine, reorder, and publish everything in the editor.",
    statsAvailable: "Available",
    statsSelected: "Selected",
    statsResults: "Results",
    statsRestaurants: "Restaurants",
    statsAmenities: "Amenities",
    statsActivities: "Activities",
    detectNotice: "Language detection ready",
    aiDone:
      "AI improved the text and saved translations for all selected languages.",
    aiImprove: "AI improve",
    aiTranslate: "AI translate",
    duplicatedName: "This name is already in use. Choose another one.",
  },
  de: {
    kicker: "Projektassistent",
    title: "Erstellen Sie Ihre App Schritt für Schritt im Stil der Vorlage.",
    intro:
      "Dieser Assistent erstellt eine professionelle erste Version Ihrer Gäste-App. Auf Basis von Adresse, Kategorie und Auswahl wird die App intelligent, mehrsprachig und im Template-Stil vorbereitet.",
    detectTranslate: "Sprache erkennen & übersetzen",
    progress: "Fortschritt",
    stepOf: "Schritt",
    back: "Vorheriger Schritt",
    next: "Nächster Schritt",
    finish: "Assistent abschließen und Editor öffnen →",
    creating: "Projekt wird erstellt…",
    backDashboard: "Zurück zum Dashboard",
    appLanguages: "App-Sprachen",
    defaultSuffix: "Standard",
    infoAiTitle: "Lokaler KI-Assistent",
    infoAiText:
      "Verbessert Texte, erstellt Startinhalte und speichert Übersetzungen ohne kostenpflichtige API.",
    infoTranslateTitle: "Vollständiger Sprachwechsel",
    infoTranslateText:
      "Die gewählte Sprache gilt im Assistenten, in der generierten App und in dynamischen Beschreibungen.",
    infoMapTitle: "5 + 5 + 5 Vorschläge",
    infoMapText:
      "Der Assistent zeigt Restaurants, Supermärkte/Services und Aktivitäten in Listen- und Kartenansicht.",
    stepLabels: [
      "App-Name",
      "Adresse / Ort",
      "Kategorie",
      "Willkommenshinweis",
      "Ausstattung",
      "Orte best\u00e4tigen",
      "Fotos",
      "Buchung",
      "Kontakt",
      "Einstellungen",
      "Stil & Abschluss",
    ],
    stepHints: [
      "Wählen Sie Name und Stil Ihrer App.",
      "Verwenden Sie Adresse oder Ort für den lokalen Kontext.",
      "Wählen Sie die Art des Aufenthalts oder Erlebnisses.",
      "Schreiben Sie den Willkommenshinweis für den Startbildschirm.",
      "Wählen Sie die vorhandene Ausstattung.",
      "Wählen Sie Orte und Aktivitäten in der Nähe aus.",
      "Weisen Sie Fotos den Orten und Ihrer Unterkunft zu.",
      "Richten Sie den Buchungsblock und den Direktlink ein.",
      "Ergänzen Sie Kontaktdaten und eine Gastnotiz.",
      "Passen Sie Sprach-, Anzeige- und Datumseinstellungen an.",
      "Wählen Sie Stil und Farbthema für Ihre App, dann abschließen.",
    ],
    appName: "App-Name",
    appNamePlaceholder: "Zum Beispiel: Villa Zonnedauw…",
    appNameHelp:
      "Der Assistent verwendet denselben warmen, professionellen Stil wie die Vorlage.",
    location: "Adresse / Ort",
    locationPlaceholder: "Zum Beispiel: Voorstraat 12, Ammerstol",
    addressStreet: "Straße",
    addressHouseNumber: "Hausnummer",
    addressPostalCode: "Postleitzahl",
    addressCity: "Ort",
    addressCountry: "Land",
    addressSearch: "Adresse prüfen und Umgebung suchen",
    addressSearchHelp:
      "Verwenden Sie echte Navigationsfelder. Danach suchen wir automatisch Restaurants, Supermärkte und Aktivitäten rund um diese Adresse.",
    addressResolved: "Gefundene Adresse",
    addressSearching: "Adresse und Umgebung werden gesucht…",
    category: "Kategorie",
    categoryTitle: "Art des Aufenthalts wählen",
    categoryHelp:
      "Die Kategorie bestimmt Stil, Farbton und Standardtexte der App. Sie können später alles anpassen – dies gibt Ihnen den besten Ausgangspunkt.",
    categorySelected: "Ihre Wahl:",
    categoryEffect:
      "Die App erhält automatisch passende Farben, Ton und Standardtexte. Sie können dies jederzeit im Editor verfeinern.",
    welcomeField: "Text für den Startbildschirm",
    welcomePlaceholder:
      "Zum Beispiel: Begrüßung, Anreisehinweise und wo Gäste alles finden…",
    welcomeHelp:
      "Dieser Text erscheint auf dem Startbildschirm und ändert sich automatisch mit der App-Sprache.",
    welcomePreview: "So beginnt der Willkommenshinweis in der App",
    amenitiesTitle: "Wählen Sie die vorhandene Ausstattung",
    amenitiesIntro:
      "Jede ausgewählte Ausstattung wird in den Hausinfos klar erklärt. Mit der KI-Schaltfläche verbessern Sie den Text und erstellen sofort Übersetzungen.",
    amenityShown: "Wird im Hausinfo-Bereich der App angezeigt.",
    amenityDescription: "KI-Erklärung für Gäste",
    amenityDetailsTitle: "Zusatzdetails",
    amenityLocationLabel: "Ort oder Platz",
    amenityUsageLabel: "Nutzung / Anleitung",
    amenityTimingLabel: "Zeiten oder Momente",
    amenitySelectionTitle: "Ausgewählte Ausstattungen",
    amenityPreviewTitle: "Live-Vorschau für Gäste",
    amenityPreviewIntro:
      "So sehen die Hausinfos mit Ihren ausgewählten Ausstattungen aus.",
    amenityEmptyState:
      "Wählen Sie links eine Ausstattung aus, um Hinweise und Zusatzdetails hinzuzufügen.",
    amenityTooltipLabel: "Hinweis für Betreiber",
    nearbyTitle: "Orte in der Nähe auswählen",
    nearbyRefresh: "Lokale Vorschläge erneut suchen",
    listView: "Liste",
    mapView: "Karte",
    openSource: "Quelle öffnen",
    selected: "Ausgewählt",
    include: "Aufnehmen",
    name: "Name",
    description: "Beschreibung",
    openingHours: "Öffnungszeiten",
    contact: "Kontakt",
    counter: "Zähler",
    distance: "Entfernung",
    tags: "Tags",
    photoSuggestion: "Fotovorschlag",
    sortDistance: "Nach Entfernung sortieren",
    sortRating: "Nach Bewertung sortieren",
    sourceMaps: "OpenStreetMap-Daten",
    sourceTrips: "KI-Beschreibungen",
    sourceMapsText:
      "Restaurants, Supermärkte und Aktivitäten werden als echte Orte rund um die eingegebene Adresse geladen.",
    sourceTripsText:
      "Die KI schreibt zu jedem Ergebnis eine kurze gastfreundliche Beschreibung, die Sie danach weiter verfeinern oder übersetzen können.",
    summary: "Zusammenfassung",
    autoAdded: "Was wird automatisch hinzugefügt?",
    autoItems: [
      "Startertexte und Interface-Texte in mehreren Sprachen",
      "Willkommenshinweis für den Startbildschirm mit KI-Übersetzungen",
      "ausgewählte Ausstattung mit mehrsprachigen Erklärungen",
      "Restaurants, Services und Aktivitäten an der richtigen Stelle in der App",
      "struktur, Icons und Live-Vorschau im Stil der Vorlage",
    ],
    finishHintTitle: "KI-Vorschläge für UX und Inhalte",
    finishHintText:
      "Die erste Version enthält bereits gepflegte Startinhalte. Danach können Sie alles im Editor weiter verfeinern, sortieren und veröffentlichen.",
    statsAvailable: "Verfügbar",
    statsSelected: "Ausgewählt",
    statsResults: "Ergebnisse",
    statsRestaurants: "Restaurants",
    statsAmenities: "Ausstattung",
    statsActivities: "Aktivitäten",
    detectNotice: "Spracherkennung bereit",
    aiDone:
      "Die KI hat den Text verbessert und Übersetzungen für alle gewählten Sprachen gespeichert.",
    aiImprove: "KI verbessern",
    aiTranslate: "KI übersetzen",
    duplicatedName:
      "Dieser Name wird bereits verwendet. Bitte wählen Sie einen anderen.",
  },
  fr: {
    kicker: "Assistant projet",
    title: "Créez votre app pas à pas dans le style du template.",
    intro:
      "Cet assistant prépare une première version soignée de votre app invité. À partir de l’adresse, de la catégorie et de votre sélection, l’app est remplie de manière intelligente, multilingue et cohérente avec le template.",
    detectTranslate: "Détecter la langue & traduire",
    progress: "Progression",
    stepOf: "Étape",
    back: "Étape précédente",
    next: "Étape suivante",
    finish: "Terminer l’assistant et ouvrir l’éditeur →",
    creating: "Création du projet…",
    backDashboard: "Retour au tableau de bord",
    appLanguages: "Langues de l’app",
    defaultSuffix: "par défaut",
    infoAiTitle: "Assistant IA local",
    infoAiText:
      "Améliore les textes, crée du contenu de départ et conserve les traductions sans API payante.",
    infoTranslateTitle: "Changement de langue complet",
    infoTranslateText:
      "La langue choisie est utilisée dans l’assistant, dans l’app générée et dans les descriptions dynamiques.",
    infoMapTitle: "5 + 5 + 5 suggestions",
    infoMapText:
      "L’assistant affiche restaurants, supermarchés/services et activités en vue liste et carte.",
    stepLabels: [
      "Nom de l\u2019app",
      "Adresse / lieu",
      "Catégorie",
      "Instruction d\u2019accueil",
      "Équipements",
      "Confirmer les lieux",
      "Photos",
      "Réservation",
      "Contact",
      "Réglages",
      "Style & finaliser",
    ],
    stepHints: [
      "Choisissez le nom et l’identité de votre app.",
      "Utilisez une adresse ou un lieu pour le contexte local.",
      "Choisissez le type de séjour ou d’expérience.",
      "Rédigez l’instruction d’accueil pour l’écran d’accueil.",
      "Sélectionnez les équipements disponibles.",
      "Choisissez les lieux et activités à ajouter.",
      "Attribuez des photos aux lieux et à votre hébergement.",
      "Configurez le bloc de réservation et le lien direct.",
      "Ajoutez les coordonnées et une note pour les invités.",
      "Ajustez les réglages de langue, d'affichage et de dates.",
      "Choisissez un style et une palette, puis finalisez.",
    ],
    appName: "Nom de l’app",
    appNamePlaceholder: "Par exemple : Villa Zonnedauw…",
    appNameHelp:
      "L’assistant utilise le même ton chaleureux et professionnel que le template.",
    location: "Adresse / lieu",
    locationPlaceholder: "Par exemple : Voorstraat 12, Ammerstol",
    addressStreet: "Rue",
    addressHouseNumber: "Numéro",
    addressPostalCode: "Code postal",
    addressCity: "Ville",
    addressCountry: "Pays",
    addressSearch: "Vérifier l’adresse et chercher autour",
    addressSearchHelp:
      "Utilisez de vrais champs d’adresse. Nous cherchons ensuite automatiquement des restaurants, supermarchés et activités autour de cette adresse.",
    addressResolved: "Adresse trouvée",
    addressSearching: "Recherche de l’adresse et des lieux à proximité…",
    category: "Catégorie",
    welcomeTitle: "Instruction d’accueil",
    welcomeField: "Texte de l’écran d’accueil",
    welcomePlaceholder:
      "Par exemple : message de bienvenue, arrivée, où trouver les infos…",
    welcomeHelp:
      "Ce texte apparaît sur l’écran d’accueil et change automatiquement quand la langue de l’app change.",
    welcomePreview: "Voici comment commence le texte d’accueil dans l’app",
    amenitiesTitle: "Choisissez les équipements disponibles",
    amenitiesIntro:
      "Chaque équipement sélectionné est expliqué clairement dans les infos du logement. Le bouton IA améliore le texte et crée immédiatement les traductions.",
    amenityShown: "Affiché dans la section house-info de l’app.",
    amenityDescription: "Explication IA pour les invités",
    amenityDetailsTitle: "Details supplementaires",
    amenityLocationLabel: "Emplacement",
    amenityUsageLabel: "Usage / instructions",
    amenityTimingLabel: "Horaires ou moments",
    amenitySelectionTitle: "Equipements selectionnes",
    amenityPreviewTitle: "Apercu invite en direct",
    amenityPreviewIntro:
      "Voici comment les infos du logement apparaissent avec vos equipements selectionnes.",
    amenityEmptyState:
      "Selectionnez un equipement a gauche pour ajouter une explication et des details.",
    amenityTooltipLabel: "Conseil operateur",
    nearbyTitle: "Sélectionnez les lieux à proximité",
    nearbyRefresh: "Relancer la recherche locale",
    listView: "Liste",
    mapView: "Carte",
    openSource: "Ouvrir la source",
    selected: "Sélectionné",
    include: "Inclure",
    name: "Nom",
    description: "Description",
    openingHours: "Horaires",
    contact: "Contact",
    counter: "Compteur",
    distance: "Distance",
    tags: "Tags",
    photoSuggestion: "Suggestion photo",
    sortDistance: "Trier par distance",
    sortRating: "Trier par évaluation",
    sourceMaps: "Données OpenStreetMap",
    sourceTrips: "Descriptions IA",
    sourceMapsText:
      "Restaurants, supermarchés et activités sont récupérés comme lieux réels autour de l’adresse saisie.",
    sourceTripsText:
      "L’IA rédige une courte description accueillante pour chaque résultat, que vous pourrez ensuite affiner ou traduire.",
    summary: "Résumé",
    autoAdded: "Qu’est-ce qui sera ajouté automatiquement ?",
    autoItems: [
      "textes de départ et libellés d’interface en plusieurs langues",
      "instruction d’accueil de l’écran d’accueil avec traductions IA",
      "équipements sélectionnés avec explications multilingues",
      "restaurants, services et activités à la bonne place dans l’app",
      "structure, icônes et aperçu live dans l’esprit du template",
    ],
    finishHintTitle: "Suggestions IA pour l’UX et le contenu",
    finishHintText:
      "La première version contient déjà un contenu de départ soigné. Ensuite, vous pourrez tout affiner, réorganiser et publier dans l’éditeur.",
    statsAvailable: "Disponibles",
    statsSelected: "Sélectionnés",
    statsResults: "Résultats",
    statsRestaurants: "Restaurants",
    statsAmenities: "Équipements",
    statsActivities: "Activités",
    detectNotice: "Détection de langue prête",
    aiDone:
      "L’IA a amélioré le texte et enregistré les traductions pour toutes les langues sélectionnées.",
    aiImprove: "IA améliorer",
    aiTranslate: "IA traduire",
    duplicatedName: "Ce nom est déjà utilisé. Choisissez-en un autre.",
  },
};

export default function NewProjectPage() {
  const router = useRouter();
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [searchReady, setSearchReady] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [wizardStarted, setWizardStarted] = useState(false);

  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState("");
  const [address, setAddress] = useState<WizardAddress>({
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    country: "Nederland",
  });
  const [category, setCategory] = useState<WizardCategory>("bnb");
  const [languages, setLanguages] = useState<Language[]>(["nl", "en"]);
  const [defaultLanguage, setDefaultLanguage] = useState<Language>("nl");
  const [welcomeText, setWelcomeText] = useState<string>(
    buildDefaultWelcomeText("jouw accommodatie", "de omgeving")
  );
  const [welcomeTranslations, setWelcomeTranslations] =
    useState<LocalizedTextMap>({});
  const [facilities, setFacilities] = useState<WizardFacility[]>(
    generateFacilitySuggestions("bnb"),
  );
  const [activeFacilityGroup, setActiveFacilityGroup] =
    useState<WizardFacilityGroup>("bnb-facilities");
  const [activeFacilityId, setActiveFacilityId] = useState<string | null>(null);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<WizardPhoto[]>([]);
  const [booking, setBooking] = useState<WizardBookingDetails>({
    promoText: "",
    promoTranslations: {},
    bookingUrl: "",
  });
  const [contact, setContact] = useState<WizardContactDetails>({
    name: "",
    note: "",
    noteTranslations: {},
    address: "",
    phone: "",
    email: "",
    whatsapp: "",
  });
  const [appSettings, setAppSettings] = useState<WizardAppSettings>({
    settingsEnabled: true,
    languageGateEnabled: true,
    textScaleEnabled: true,
    defaultDarkMode: false,
    defaultTextScale: 1,
    nearbyView: "list",
    showCountdown: false,
    arrivalDate: "",
    checkoutDate: "",
  });
  const [wizardTheme, setWizardTheme] = useState<Partial<SiteTheme>>({});
  const [locations, setLocations] = useState<WizardLocation[]>([]);
  const [suggestions, setSuggestions] = useState<WizardSuggestion[]>([]);
  const [resultsView, setResultsView] = useState<"list" | "map">("list");
  const [locationFilter, setLocationFilter] = useState<
    LocationCategory | "all"
  >("all");
  const [locationSort, setLocationSort] = useState<"distance" | "rating" | "name">(
    "distance",
  );
  const [locationSearch, setLocationSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyProgress, setNearbyProgress] = useState(0);
  const [nearbyStage, setNearbyStage] = useState("");
  const [nearbyWarnings, setNearbyWarnings] = useState<string[]>([]);
  const [lastNearbyQuery, setLastNearbyQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [translationNotice, setTranslationNotice] = useState<string | null>(
    null,
  );
  const [locationPhotoResults, setLocationPhotoResults] = useState<
    Record<string, PhotoResult[]>
  >({});
  const [locationPhotosLoading, setLocationPhotosLoading] = useState(false);
  const [locationPhotosProgress, setLocationPhotosProgress] = useState({
    done: 0,
    total: 0,
  });
  const [photoStage, setPhotoStage] = useState("");
  const [locationPhotosFetched, setLocationPhotosFetched] = useState(false);
  const [showManualLocationForm, setShowManualLocationForm] = useState(false);
  const [customLocationName, setCustomLocationName] = useState("");
  const [customLocationAddress, setCustomLocationAddress] = useState("");
  const [customLocationCategory, setCustomLocationCategory] = useState<"restaurant" | "tourism" | "shops">("tourism");
  const [facilitySearch, setFacilitySearch] = useState("");
  const [customFacilityTitle, setCustomFacilityTitle] = useState("");
  const [facilityPreviewExpanded, setFacilityPreviewExpanded] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState(10);

  const ui = wizardCopy[defaultLanguage];
  const placesUi = placeCopy[defaultLanguage];
  const wizardUi = settingsCopy[defaultLanguage];
  const subtleNearbyWarnings = nearbyWarnings.filter(
    (warning) =>
      warning.includes("standaard nearby-data wordt gebruikt") ||
      warning.includes("AI kon geen nearby-locaties structureren") ||
      warning.includes("De gevonden plekken zijn wel geladen"),
  );
  const visibleNearbyWarnings = nearbyWarnings.filter(
    (warning) => !subtleNearbyWarnings.includes(warning),
  );
  const wizardDraftKey = useMemo(
    () => `wizard-draft:${editingProjectId ?? "new"}`,
    [editingProjectId],
  );
  const location = useMemo(
    () => address.formatted?.trim() || formatWizardAddress(address),
    [address],
  );
  const nearbyQueryKey = useMemo(
    () =>
      `${formatWizardAddress(address)}|${category}|${defaultLanguage}|${languages.join(",")}`,
    [address, category, defaultLanguage, languages],
  );
  const steps = ui.stepLabels.map((label, index) => ({
    id: (index + 1) as WizardStep,
    label,
    hint: ui.stepHints[index],
  }));
  const categoryOptions = (
    Object.keys(categoryCatalog) as WizardCategory[]
  ).map((value) => ({
    value,
    ...categoryCatalog[value][defaultLanguage],
  }));
  const facilityGroups = useMemo(
    () =>
      (
        Object.keys(
          facilityGroupLabels[defaultLanguage],
        ) as WizardFacilityGroup[]
      ).map((group) => ({
        group,
        meta: facilityGroupLabels[defaultLanguage][group],
        items: facilities.filter((item) => item.group === group),
      })),
    [defaultLanguage, facilities],
  );

  const filteredFacilityGroups = useMemo(() => {
    const query = facilitySearch.trim().toLowerCase();
    if (!query) return facilityGroups;

    return facilityGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          (item.titleTranslations?.[defaultLanguage] ?? item.title)
            .toLowerCase()
            .includes(query),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [facilityGroups, facilitySearch, defaultLanguage]);
  const selectedFacilities = useMemo(
    () => facilities.filter((item) => item.selected),
    [facilities],
  );
  const activeFacility = useMemo(
    () =>
      facilities.find((item) => item.id === activeFacilityId) ??
      facilityGroups.find((group) => group.group === activeFacilityGroup)
        ?.items[0] ??
      facilities[0] ??
      null,
    [activeFacilityGroup, activeFacilityId, facilities, facilityGroups],
  );

  const activeFacilityGroupData = useMemo(
    () =>
      filteredFacilityGroups.find(
        (group) => group.group === activeFacilityGroup,
      ) ??
      facilityGroups.find((group) => group.group === activeFacilityGroup) ??
      facilityGroups[0] ??
      null,
    [filteredFacilityGroups, facilityGroups, activeFacilityGroup],
  );

  const stats = useMemo(
    () => ({
      total: locations.length || suggestions.length,
      selected: locations.filter((item) => item.selected !== false).length,
      restaurants: locations.filter((item) => item.category === "restaurant")
        .length,
      services: locations.filter((item) => item.category === "shops").length,
      experiences: locations.filter((item) => item.category === "tourism")
        .length,
      selectedFacilities: facilities.filter((item) => item.selected).length,
    }),
    [facilities, locations, suggestions],
  );

  const selectedLocations = useMemo(
    () => locations.filter((item) => item.selected !== false),
    [locations],
  );

  const visibleLocations = useMemo(() => {
    const query = locationSearch.trim().toLowerCase();
    const filtered = locations.filter((item) => {
      const groupMatch = locationFilter === "all" || item.category === locationFilter
      const textMatch =
        !query ||
        (item.name ?? "").toLowerCase().includes(query) ||
        (item.address ?? "").toLowerCase().includes(query)
      const distanceMatch = (item.distance_from_bnb ?? 0) <= maxDistanceKm
      return groupMatch && textMatch && distanceMatch
    });

    return [...filtered].sort((a, b) => {
      if ((a.selected !== false) !== (b.selected !== false))
        return a.selected === false ? 1 : -1;

      if (locationSort === "name") {
        return (a.name ?? "").localeCompare(b.name ?? "");
      }
      if (locationSort === "rating") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      return (a.distance_from_bnb ?? 0) - (b.distance_from_bnb ?? 0);
    });
  }, [locationFilter, locationSort, locationSearch, locations, maxDistanceKm]);

  const activeLocation = useMemo(
    () =>
      locations.find((item) => item.id === activeLocationId) ??
      visibleLocations[0] ??
      locations[0] ??
      null,
    [activeLocationId, locations, visibleLocations],
  );

  const applyWizardDraft = useMemo(
    () => (draft: Partial<WizardDraftState>) => {
      if (draft.step) setStep(draft.step);
      if (typeof draft.name === "string") setName(draft.name);
      if (draft.address) setAddress(draft.address);
      if (draft.category) setCategory(draft.category);
      if (draft.languages?.length) setLanguages(draft.languages);
      if (draft.defaultLanguage) setDefaultLanguage(draft.defaultLanguage);
      if (typeof draft.welcomeText === "string")
        setWelcomeText(draft.welcomeText);
      if (draft.welcomeTranslations)
        setWelcomeTranslations(draft.welcomeTranslations);
      if (draft.facilities) setFacilities(draft.facilities);
      if (draft.photos) setPhotos(draft.photos);
      if (draft.booking) setBooking(draft.booking);
      if (draft.contact) setContact(draft.contact);
      if (draft.appSettings) setAppSettings(draft.appSettings);
      if (draft.locations) setLocations(draft.locations);
      if (draft.suggestions) setSuggestions(draft.suggestions);
      if (draft.resultsView) setResultsView(draft.resultsView);
      if (draft.locationFilter) setLocationFilter(draft.locationFilter);
      if (draft.locationSort) setLocationSort(draft.locationSort);
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const projectId = new URLSearchParams(window.location.search).get(
      "projectId",
    );
    setEditingProjectId(projectId);
    if (projectId) {
      setWizardStarted(true);
    }
    setSearchReady(true);
  }, []);

  useEffect(() => {
    if (!searchReady || editingProjectId) return;
    const storedDraft = window.sessionStorage.getItem(wizardDraftKey);

    if (storedDraft) {
      try {
        applyWizardDraft(JSON.parse(storedDraft) as Partial<WizardDraftState>);
        setTranslationNotice("Eerder ingevulde wizardgegevens zijn hersteld.");
      } catch {
        window.sessionStorage.removeItem(wizardDraftKey);
      }
      setDraftReady(true);
      return;
    }

    const detected = detectSuggestedLanguages(
      typeof window !== "undefined" ? window.navigator.language : undefined,
    );
    setLanguages(detected.languages);
    setDefaultLanguage(detected.defaultLanguage);
    setTranslationNotice(
      `${wizardCopy[detected.defaultLanguage].detectNotice}: ${detected.defaultLanguage.toUpperCase()}`,
    );
    setDraftReady(true);
  }, [applyWizardDraft, editingProjectId, searchReady, wizardDraftKey]);

  useEffect(() => {
    setFacilities((prev) => {
      const next = generateFacilitySuggestions(category);
      return next.map((item) => {
        const existing = prev.find((candidate) => candidate.id === item.id);
        return existing
          ? {
              ...item,
              selected: existing.selected,
              description: existing.description,
              descriptionTranslations:
                existing.descriptionTranslations ??
                item.descriptionTranslations,
              helperText: existing.helperText ?? item.helperText,
              locationDetails: existing.locationDetails ?? item.locationDetails,
              usageDetails: existing.usageDetails ?? item.usageDetails,
              timingDetails: existing.timingDetails ?? item.timingDetails,
            }
          : item;
      });
    });
  }, [category]);

  useEffect(() => {
    if (!facilityGroups.some((group) => group.group === activeFacilityGroup)) {
      setActiveFacilityGroup(facilityGroups[0]?.group ?? "bnb-facilities");
    }
  }, [activeFacilityGroup, facilityGroups]);

  useEffect(() => {
    const itemsInActiveGroup =
      facilityGroups.find((group) => group.group === activeFacilityGroup)
        ?.items ?? [];
    if (
      activeFacilityId &&
      itemsInActiveGroup.some((item) => item.id === activeFacilityId)
    )
      return;
    setActiveFacilityId(itemsInActiveGroup[0]?.id ?? facilities[0]?.id ?? null);
  }, [activeFacilityGroup, activeFacilityId, facilities, facilityGroups]);

  useEffect(() => {
    if (
      activeLocationId &&
      visibleLocations.some((item) => item.id === activeLocationId)
    )
      return;
    setActiveLocationId(visibleLocations[0]?.id ?? locations[0]?.id ?? null);
  }, [activeLocationId, locations, visibleLocations]);

  useEffect(() => {
    if (
      step >= 6 &&
      isWizardAddressComplete(address) &&
      nearbyQueryKey !== lastNearbyQuery
    ) {
      void searchNearby();
    }
  }, [address, category, languages, lastNearbyQuery, nearbyQueryKey, step]);

  useEffect(() => {
    if (
      step === 7 &&
      !locationPhotosFetched &&
      !locationPhotosLoading &&
      selectedLocations.length > 0
    ) {
      void fetchLocationPhotos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" && step < steps.length && canGoNext()) {
        setStep((prev) => (Math.min(steps.length, prev + 1) as WizardStep));
      }
      if (event.key === "ArrowLeft" && step > 1) {
        setStep((prev) => (Math.max(1, prev - 1) as WizardStep));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step, steps.length]);

  useEffect(() => {
    if (!nearbyLoading) {
      setNearbyProgress(0);
      return;
    }

    setNearbyProgress(15);
    const interval = setInterval(() => {
      setNearbyProgress((prev) => Math.min(prev + 12, 88));
    }, 350);

    return () => clearInterval(interval);
  }, [nearbyLoading]);

  useEffect(() => {
    setWelcomeText((prev) => welcomeTranslations[defaultLanguage] ?? prev);
    setBooking((prev) => ({
      ...prev,
      promoText: prev.promoTranslations[defaultLanguage] ?? prev.promoText,
    }));
    setContact((prev) => ({
      ...prev,
      note: prev.noteTranslations[defaultLanguage] ?? prev.note,
    }));
    setFacilities((prev) =>
      prev.map((item) => ({
        ...item,
        title: item.titleTranslations?.[defaultLanguage] ?? item.title,
        description:
          item.descriptionTranslations?.[defaultLanguage] ?? item.description,
        helperText:
          item.descriptionTranslations?.[defaultLanguage] ?? item.helperText,
      })),
    );
    setSuggestions((prev) =>
      prev.map((item) => ({
        ...item,
        description:
          item.descriptionTranslations?.[defaultLanguage] ?? item.description,
      })),
    );
  }, [defaultLanguage, welcomeTranslations]);

  useEffect(() => {
    if (!searchReady || !editingProjectId) return;

    let cancelled = false;

    async function loadProjectIntoWizard() {
      setLoading(true);
      setError(null);

      const { getProject } = await import("@/lib/storage");
      const data = getProject(editingProjectId!);
      if (cancelled) return;

      if (!data) {
        setError("Bestaand project kon niet in de wizard worden geladen.");
        setLoading(false);
        return;
      }

      const project = data as unknown as {
        name: string;
        site_data: {
          languages?: Language[];
          defaultLanguage?: Language;
          meta?: { location?: string; category?: WizardCategory };
          settings?: WizardAppSettings;
          environment?: { all?: WizardLocation[] };
          content?: Partial<
            Record<
              Language,
              {
                hero?: { subheading?: string };
                sections?: Record<string, unknown>;
              }
            >
          >;
          sections?: Array<{ type: string; data?: Record<string, unknown> }>;
        };
      };

      const siteData = project.site_data;
      const nextLanguages: Language[] = siteData.languages?.length
        ? siteData.languages
        : ["nl", "en"];
      const nextDefaultLanguage: Language =
        siteData.defaultLanguage &&
        nextLanguages.includes(siteData.defaultLanguage)
          ? siteData.defaultLanguage
          : (nextLanguages[0] ?? "nl");
      const nextCategory = siteData.meta?.category ?? "bnb";
      const nextLocation = siteData.meta?.location ?? "";
      const heroSection =
        siteData.sections?.find((section) => section.type === "hero")?.data ??
        {};
      const bookingSection =
        siteData.sections?.find((section) => section.type === "booking")
          ?.data ?? {};
      const contactSection =
        siteData.sections?.find((section) => section.type === "contact")
          ?.data ?? {};
      const houseInfoSection =
        siteData.sections?.find((section) => section.type === "house-info")
          ?.data ?? {};
      const photosSection =
        siteData.sections?.find((section) => section.type === "photos")?.data ??
        {};
      const contentByLanguage: Partial<
        Record<
          Language,
          { hero?: { subheading?: string }; sections?: Record<string, unknown> }
        >
      > = siteData.content ?? {};
      const selectedFacilityIds = new Set(
        (
          (houseInfoSection as { sections?: Array<{ id?: string }> })
            .sections ?? []
        )
          .map((section) => section.id)
          .filter(
            (id): id is string =>
              typeof id === "string" &&
              !["welcome", "how-to-use", "ai-suggestions"].includes(id),
          ),
      );
      const bookingTranslations = Object.fromEntries(
        nextLanguages.map((lang: Language): [Language, string] => [
          lang,
          (
            contentByLanguage[lang]?.sections?.booking as
              | { promoText?: string }
              | undefined
          )?.promoText ??
            String((bookingSection as { promoText?: string }).promoText ?? ""),
        ]),
      ) as LocalizedTextMap;
      const contactNoteTranslations = Object.fromEntries(
        nextLanguages.map((lang: Language): [Language, string] => [
          lang,
          (
            contentByLanguage[lang]?.sections?.contact as
              | { note?: string }
              | undefined
          )?.note ?? String((contactSection as { note?: string }).note ?? ""),
        ]),
      ) as LocalizedTextMap;

      setName(project.name ?? "");
      setLanguages(nextLanguages);
      setDefaultLanguage(nextDefaultLanguage);
      setCategory(nextCategory);
      setAddress({
        street: "",
        houseNumber: "",
        postalCode: "",
        city: "",
        country: "",
        formatted: nextLocation,
      });
      setWelcomeTranslations(
        Object.fromEntries(
          nextLanguages.map((lang: Language): [Language, string] => [
            lang,
            contentByLanguage[lang]?.hero?.subheading ??
              contentByLanguage[nextDefaultLanguage]?.hero?.subheading ??
              "",
          ]),
        ) as LocalizedTextMap,
      );
      setWelcomeText(
        contentByLanguage[nextDefaultLanguage]?.hero?.subheading ?? "",
      );
      setFacilities(
        generateFacilitySuggestions(nextCategory).map((item) => {
          const matchedSection = (
            (
              houseInfoSection as {
                sections?: Array<{ id?: string; body?: string }>;
              }
            ).sections ?? []
          ).find((section) => section.id === item.id);
          return {
            ...item,
            selected: selectedFacilityIds.has(item.id),
            description: matchedSection?.body ?? item.description,
          };
        }),
      );
      setLocations(
        (siteData.environment?.all ?? []).map((item) => ({
          ...item,
          categories: item.categories?.length
            ? item.categories
            : [item.category],
        })),
      );
      setSuggestions([]);
      setPhotos(
        (
          (
            photosSection as {
              images?: Array<{ url?: string; caption?: string; alt?: string }>;
            }
          ).images ?? []
        )
          .map((item, index) => ({
            id: `existing-photo-${index + 1}`,
            url: item.url ?? "",
            caption: item.caption ?? "",
            alt: item.alt ?? item.caption ?? "",
            category: "bnb-main" as const,
          }))
          .filter((item) => item.url),
      );
      setBooking({
        promoText: bookingTranslations[nextDefaultLanguage] ?? "",
        promoTranslations: bookingTranslations,
        bookingUrl: String(
          (bookingSection as { bookingUrl?: string }).bookingUrl ?? "",
        ),
      });
      setContact({
        name: String((contactSection as { name?: string }).name ?? ""),
        note: contactNoteTranslations[nextDefaultLanguage] ?? "",
        noteTranslations: contactNoteTranslations,
        address: String(
          (contactSection as { address?: string }).address ?? nextLocation,
        ),
        phone: String((contactSection as { phone?: string }).phone ?? ""),
        email: String((contactSection as { email?: string }).email ?? ""),
        whatsapp: String(
          (contactSection as { whatsapp?: string }).whatsapp ?? "",
        ),
      });
      setAppSettings({
        settingsEnabled: siteData.settings?.settingsEnabled ?? true,
        languageGateEnabled: siteData.settings?.languageGateEnabled ?? true,
        textScaleEnabled: siteData.settings?.textScaleEnabled ?? true,
        defaultDarkMode: siteData.settings?.defaultDarkMode ?? false,
        defaultTextScale: siteData.settings?.defaultTextScale ?? 1,
        nearbyView: siteData.settings?.nearbyView ?? "list",
        showCountdown: Boolean(
          (heroSection as { showCountdown?: boolean }).showCountdown,
        ),
        arrivalDate: String(
          (heroSection as { arrivalDate?: string }).arrivalDate ?? "",
        ),
        checkoutDate: String(
          (heroSection as { checkoutDate?: string }).checkoutDate ?? "",
        ),
      });
      const storedDraft = window.sessionStorage.getItem(wizardDraftKey);
      if (storedDraft) {
        try {
          applyWizardDraft(
            JSON.parse(storedDraft) as Partial<WizardDraftState>,
          );
          setTranslationNotice(
            "Vorige wizardaanpassingen voor dit project zijn hersteld.",
          );
        } catch {
          window.sessionStorage.removeItem(wizardDraftKey);
        }
      }
      setTranslationNotice("Bestaand project in wizard geladen.");
      setLoading(false);
      setDraftReady(true);
    }

    void loadProjectIntoWizard();

    return () => {
      cancelled = true;
    };
  }, [
    applyWizardDraft,
    editingProjectId,
    searchReady,
    wizardDraftKey,
  ]);

  useEffect(() => {
    if (!searchReady || !draftReady || typeof window === "undefined") return;

    const draft: WizardDraftState = {
      step,
      name,
      address,
      category,
      languages,
      defaultLanguage,
      welcomeText,
      welcomeTranslations,
      facilities,
      photos,
      booking,
      contact,
      appSettings,
      locations,
      suggestions,
      resultsView,
      locationFilter,
      locationSort,
    };

    try {
      const json = JSON.stringify(draft);
      if (json.length < 4_500_000) {
        window.sessionStorage.setItem(wizardDraftKey, json);
      } else {
        // Te groot – sla draft op zonder zware velden
        const lite = { ...draft, photos: [], suggestions: [] };
        window.sessionStorage.setItem(wizardDraftKey, JSON.stringify(lite));
      }
    } catch {
      // QuotaExceededError – negeer, draft wordt niet opgeslagen
    }
  }, [
    address,
    appSettings,
    booking,
    category,
    contact,
    defaultLanguage,
    draftReady,
    facilities,
    languages,
    locationFilter,
    locationSort,
    locations,
    name,
    photos,
    resultsView,
    searchReady,
    step,
    suggestions,
    welcomeText,
    welcomeTranslations,
    wizardDraftKey,
  ]);

  function toSlug(str: string) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
  }

  function canGoNext() {
    if (step === 1) return name.trim().length > 1;
    if (step === 2) return isWizardAddressComplete(address);
    if (step === 3) return Boolean(category);
    if (step === 4) return welcomeText.trim().length > 10;
    if (step === 5) return facilities.some((item) => item.selected);
    if (step === 6) return selectedLocations.length > 0;
    if (step === 7) return true;
    if (step === 8) return true;
    if (step === 9) return true;
    if (step === 10) return true;
    return true;
  }

  function detectAndTranslate() {
    const detected = detectSuggestedLanguages(
      typeof window !== "undefined" ? window.navigator.language : undefined,
    );
    setLanguages(detected.languages);
    setDefaultLanguage(detected.defaultLanguage);
    setTranslationNotice(
      `${wizardCopy[detected.defaultLanguage].detectNotice}: ${detected.languages.map((lang) => lang.toUpperCase()).join(", ")}`,
    );
  }

  function updateWelcome(value: string) {
    setWelcomeText(value);
    setWelcomeTranslations(() => ({
      [defaultLanguage]: value,
    }));
  }

  async function runWelcomeAi(mode: "improve" | "translate") {
    try {
      setAiLoading(`welcome:${mode}`);
      setError(null);
      setTranslationNotice(null);
      const result = await requestWizardAiText({
        text: welcomeText,
        languages,
        defaultLanguage,
        type: "welcome",
        mode,
        appName: name || "je verblijf",
        location,
      });
      setWelcomeText(result.improvedText);
      setWelcomeTranslations((prev) =>
        mode === "improve"
          ? { ...prev, [defaultLanguage]: result.improvedText }
          : result.translations,
      );
      setTranslationNotice(result.notice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI-aanvraag mislukt.");
    } finally {
      setAiLoading(null);
    }
  }

  async function runBookingAi(mode: "improve" | "translate") {
    if (!booking.promoText.trim()) return;

    try {
      setAiLoading(`booking:${mode}`);
      setError(null);
      setTranslationNotice(null);
      const result = await requestWizardAiText({
        text: booking.promoText,
        languages,
        defaultLanguage,
        type: "booking",
        mode,
        appName: name || "je verblijf",
        location,
      });
      setBooking((prev) => ({
        ...prev,
        promoText: result.improvedText,
        promoTranslations:
          mode === "improve"
            ? {
                ...prev.promoTranslations,
                [defaultLanguage]: result.improvedText,
              }
            : result.translations,
      }));
      setTranslationNotice(result.notice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI-aanvraag mislukt.");
    } finally {
      setAiLoading(null);
    }
  }

  async function runContactAi(mode: "improve" | "translate") {
    if (!contact.note.trim()) return;

    try {
      setAiLoading(`contact:${mode}`);
      setError(null);
      setTranslationNotice(null);
      const result = await requestWizardAiText({
        text: contact.note,
        languages,
        defaultLanguage,
        type: "contact",
        mode,
        appName: name || "je verblijf",
        location,
      });
      setContact((prev) => ({
        ...prev,
        note: result.improvedText,
        noteTranslations:
          mode === "improve"
            ? {
                ...prev.noteTranslations,
                [defaultLanguage]: result.improvedText,
              }
            : result.translations,
      }));
      setTranslationNotice(result.notice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI-aanvraag mislukt.");
    } finally {
      setAiLoading(null);
    }
  }

  function updateAddressField(field: keyof WizardAddress, value: string) {
    setAddress((prev) => ({
      ...prev,
      [field]: value,
      formatted: undefined,
      latitude: undefined,
      longitude: undefined,
    }));
    setLocations([]);
    setSuggestions([]);
    setNearbyWarnings([]);
    setLastNearbyQuery(null);
  }

  function updateLocation(id: string, patch: Partial<WizardLocation>) {
    setLocations((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              category:
                patch.categories?.[0] ?? patch.category ?? item.category,
              categories: patch.categories
                ? Array.from(new Set(patch.categories))
                : patch.category
                  ? Array.from(
                      new Set([
                        patch.category,
                        ...(item.categories?.length
                          ? item.categories
                          : [item.category]
                        ).filter((category) => category !== patch.category),
                      ]),
                    )
                  : item.categories,
              descriptions: patch.descriptions
                ? { ...item.descriptions, ...patch.descriptions }
                : item.descriptions,
            }
          : item,
      ),
    );
  }

  function getLocationCategories(item: WizardLocation) {
    return Array.from(
      new Set(item.categories?.length ? item.categories : [item.category]),
    );
  }

  function countLocationsInCategory(category: LocationCategory) {
    return selectedLocations.filter((item) =>
      getLocationCategories(item).includes(category),
    ).length;
  }

  function toggleLocationCategory(id: string, category: LocationCategory) {
    const item = locations.find((locationItem) => locationItem.id === id);
    if (!item) return;

    const currentCategories = getLocationCategories(item);
    const nextCategories = currentCategories.includes(category)
      ? currentCategories.filter((value) => value !== category)
      : [...currentCategories, category];

    if (!nextCategories.length) {
      setTranslationNotice(
        "Laat minimaal één categorie actief voor deze plek.",
      );
      return;
    }

    updateLocation(id, {
      category: nextCategories[0],
      categories: nextCategories,
    });
  }

  function toggleLocationSelection(id: string) {
    const current = locations.find((item) => item.id === id);
    if (!current) return;

    if (current.selected === false) {
      if (selectedLocations.length >= 30) {
        setError(placesUi.selectionLimit);
        return;
      }
      setError(null);
      updateLocation(id, { selected: true });
      return;
    }

    updateLocation(id, { selected: false });
  }

  function toggleSelectAllLocations() {
    const allSelected =
      locations.length > 0 && selectedLocations.length === locations.length;

    setLocations((prev) =>
      prev.map((item) => ({
        ...item,
        selected: allSelected ? false : true,
      })),
    );

    if (!allSelected && locations.length > 30) {
      setError(placesUi.selectionLimit);
    } else {
      setError(null);
    }
  }

  function addCustomFacility() {
    const title = customFacilityTitle.trim();
    if (!title) {
      setError("Voer een naam in voor een nieuwe voorziening.");
      return;
    }

    const slug = toSlug(title);
    if (!slug) {
      setError("Ongeldige titel voor de voorziening.");
      return;
    }

    if (facilities.some((item) => item.id === slug)) {
      setError("Er bestaat al een voorziening met deze naam.");
      return;
    }

    const newFacility: WizardFacility = {
      id: slug,
      group: activeFacilityGroup,
      icon: "plus",
      title,
      titleTranslations: {
        [defaultLanguage]: title,
      },
      description: "",
      selected: true,
    };

    setFacilities((prev) => [...prev, newFacility]);
    setActiveFacilityId(slug);
    setCustomFacilityTitle("");
    setError(null);
    setTranslationNotice("Aangepaste voorziening toegevoegd en geselecteerd.");
  }

  async function searchNearby(force = false) {
    if (!isWizardAddressComplete(address)) return;
    if (!force && nearbyQueryKey === lastNearbyQuery) return;

    try {
      setNearbyLoading(true);
      setError(null);
      setNearbyWarnings([]);
      setTranslationNotice(null);
      setNearbyStage("📍 Adres opzoeken…");

      // Stage-updates tijdens de fetch
      const stageTimer = setInterval(() => {
        setNearbyStage((prev) => {
          if (prev.includes("Adres")) return "🗺️ Locaties ophalen via OpenStreetMap…";
          if (prev.includes("OpenStreetMap")) return "📸 Foto's en beschrijvingen zoeken…";
          if (prev.includes("Foto")) return "🤖 AI verrijkt de locatiedata…";
          if (prev.includes("AI")) return "✨ Bijna klaar — resultaten verwerken…";
          return prev;
        });
      }, 4000);

      const result = await requestNearbySuggestions({
        address,
        category,
        languages,
        defaultLanguage,
        appName: name || "de gastenapp",
      });

      clearInterval(stageTimer);

      setAddress((prev) => ({
        ...prev,
        formatted: result.formattedAddress,
        latitude: result.latitude,
        longitude: result.longitude,
      }));
      const normalizedLocations = result.locations
        .map((item) => ({
          ...item,
          selected: item.selected !== false,
          categories: item.categories?.length ? item.categories : [item.category],
        }))
        .filter(
          (item, index, array) =>
            array.findIndex(
              (candidate) =>
                candidate.id === item.id ||
                candidate.name.toLowerCase() === item.name.toLowerCase(),
            ) === index,
        )
        .slice(0, 30);

      setNearbyStage(`✅ ${normalizedLocations.length} locaties gevonden!`);
      setLocations(normalizedLocations);
      setSuggestions(result.suggestions);
      setNearbyWarnings(result.warnings);
      setTranslationNotice(result.notice);
      setLastNearbyQuery(nearbyQueryKey);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Zoeken in de omgeving is mislukt.",
      );
      setNearbyStage("");
    } finally {
      setNearbyLoading(false);
      setNearbyProgress(100);
      setTimeout(() => {
        setNearbyProgress(0);
        setNearbyStage("");
      }, 2000);
    }
  }

  function updateFacility(id: string, patch: Partial<WizardFacility>) {
    setFacilities((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              descriptionTranslations:
                patch.descriptionTranslations ??
                (patch.description !== undefined
                  ? { [defaultLanguage]: patch.description }
                  : item.descriptionTranslations),
            }
          : item,
      ),
    );
  }

  function updatePhoto(id: string, patch: Partial<WizardPhoto>) {
    setPhotos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function handlePhotoUpload(
    categoryKey: WizardPhotoCategory,
    fileList: FileList | null,
  ) {
    if (!fileList?.length) return;

    const uploaded = await Promise.all(
      Array.from(fileList).map(
        async (file, index) =>
          ({
            id: `${categoryKey}-${Date.now()}-${index}`,
            url: await fileToDataUrl(file),
            category: categoryKey,
            caption: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " "),
            alt: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " "),
          }) satisfies WizardPhoto,
      ),
    );

    setPhotos((prev) => [...prev, ...uploaded]);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((item) => item.id !== id));
  }

  function updateAppSettings(patch: Partial<WizardAppSettings>) {
    setAppSettings((prev) => ({ ...prev, ...patch }));
  }

  async function runFacilityAi(id: string, mode: "improve" | "translate") {
    const facility = facilities.find((item) => item.id === id);
    if (!facility) return;

    try {
      setAiLoading(`facility:${id}:${mode}`);
      setError(null);
      setTranslationNotice(null);
      const result = await requestWizardAiText({
        text: facility.description,
        languages,
        defaultLanguage,
        type: "facility",
        mode,
        appName: name || "de app",
        location,
      });
      updateFacility(id, {
        description: result.improvedText,
        descriptionTranslations:
          mode === "improve"
            ? {
                ...(facility.descriptionTranslations ?? {}),
                [defaultLanguage]: result.improvedText,
              }
            : result.translations,
      });
      setTranslationNotice(result.notice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI-aanvraag mislukt.");
    } finally {
      setAiLoading(null);
    }
  }

  async function runLocationAi(id: string, mode: "improve" | "translate") {
    const item = locations.find((locationItem) => locationItem.id === id);
    if (!item) return;

    try {
      setAiLoading(`location:${id}:${mode}`);
      setError(null);
      setTranslationNotice(null);
      const result = await requestWizardAiText({
        text: item.descriptions[defaultLanguage] ?? item.descriptions.nl ?? "",
        languages,
        defaultLanguage,
        type: "location",
        mode,
        appName: name || "de app",
        location,
      });
      updateLocation(id, {
        descriptions:
          mode === "improve"
            ? { ...item.descriptions, [defaultLanguage]: result.improvedText }
            : {
                nl: result.translations.nl ?? item.descriptions.nl,
                en: result.translations.en ?? item.descriptions.en,
                de: result.translations.de ?? item.descriptions.de,
                fr: result.translations.fr ?? item.descriptions.fr,
              },
      });
      setTranslationNotice(result.notice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI-aanvraag mislukt.");
    } finally {
      setAiLoading(null);
    }
  }

  async function fetchLocationPhotos() {
    if (selectedLocations.length === 0) return;

    // Alleen locaties zonder foto ophalen om snelheid te verbeteren
    const locationsNeedingPhotos = selectedLocations.filter(
      (loc) => !loc.image_reference,
    );

    setLocationPhotosLoading(true);
    setPhotoStage(`🔍 ${locationsNeedingPhotos.length} locaties zonder foto gevonden…`);
    setLocationPhotosProgress({
      done: selectedLocations.length - locationsNeedingPhotos.length,
      total: selectedLocations.length,
    });

    if (locationsNeedingPhotos.length === 0) {
      setPhotoStage("✅ Alle locaties hebben al een foto!");
      setLocationPhotosFetched(true);
      setLocationPhotosLoading(false);
      setLocationPhotosProgress({
        done: selectedLocations.length,
        total: selectedLocations.length,
      });
      setTimeout(() => setPhotoStage(""), 3000);
      return;
    }

    // Stage timer voor visuele feedback
    const stages = [
      `📸 Foto's zoeken voor ${locationsNeedingPhotos.length} locaties…`,
      "🌐 Wikimedia & online bronnen doorzoeken…",
      "🖼️ Beste foto's selecteren per locatie…",
      "✨ Bijna klaar — resultaten verwerken…",
    ];
    let stageIdx = 0;
    setPhotoStage(stages[0]);
    const stageTimer = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setPhotoStage(stages[stageIdx]);
      }
    }, 5000);

    try {
      const payload = locationsNeedingPhotos.map((loc) => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
        category: loc.category,
      }));

      const res = await fetch("/api/location-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: payload }),
      });

      if (!res.ok) throw new Error("Foto-ophalen mislukt.");
      const { results } = (await res.json()) as {
        results: Record<string, PhotoResult[]>;
      };

      setLocationPhotoResults((prev) => ({ ...prev, ...results }));

      let photosFound = 0;
      for (const loc of locationsNeedingPhotos) {
        const photos = results[loc.id];
        if (photos?.length) {
          photosFound++;
          const best =
            photos.find((p) => p.confidence === "high") ?? photos[0];
          updateLocation(loc.id, { image_reference: best.url });
        }
      }

      clearInterval(stageTimer);
      setPhotoStage(`✅ ${photosFound} foto's gevonden!`);
      setLocationPhotosFetched(true);
      setLocationPhotosProgress({
        done: selectedLocations.length,
        total: selectedLocations.length,
      });
      setTimeout(() => setPhotoStage(""), 4000);
    } catch (err) {
      clearInterval(stageTimer);
      setPhotoStage("");
      setError(
        err instanceof Error ? err.message : "Foto-ophalen mislukt.",
      );
    } finally {
      setLocationPhotosLoading(false);
    }
  }

  function handleLocationPhotoSelect(locationId: string, url: string) {
    updateLocation(locationId, { image_reference: url });
  }

  async function handleSearchMorePhotos(query: string): Promise<PhotoResult[]> {
    try {
      const res = await fetch("/api/location-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations: [{ name: query, address: query }],
        }),
      });
      if (!res.ok) return [];
      const { results } = (await res.json()) as {
        results: Record<string, PhotoResult[]>;
      };
      return results[query] ?? [];
    } catch {
      return [];
    }
  }

  function updateSuggestion(id: string, patch: Partial<WizardSuggestion>) {
    setSuggestions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              descriptionTranslations:
                patch.descriptionTranslations ??
                (patch.description !== undefined
                  ? { [defaultLanguage]: patch.description }
                  : item.descriptionTranslations),
            }
          : item,
      ),
    );
  }

  async function runSuggestionAi(id: string, mode: "improve" | "translate") {
    const suggestion = suggestions.find((item) => item.id === id);
    if (!suggestion) return;

    try {
      setAiLoading(`suggestion:${id}:${mode}`);
      setError(null);
      setTranslationNotice(null);
      const result = await requestWizardAiText({
        text: suggestion.description,
        languages,
        defaultLanguage,
        type: "suggestion",
        mode,
        appName: name || "de app",
        location,
      });
      updateSuggestion(id, {
        description: result.improvedText,
        descriptionTranslations:
          mode === "improve"
            ? {
                ...(suggestion.descriptionTranslations ?? {}),
                [defaultLanguage]: result.improvedText,
              }
            : result.translations,
      });
      setTranslationNotice(result.notice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI-aanvraag mislukt.");
    } finally {
      setAiLoading(null);
    }
  }

  function toggleLanguage(lang: Language) {
    setLanguages((prev) => {
      if (prev.includes(lang)) {
        if (lang === defaultLanguage) return prev;
        return prev.filter((l) => l !== lang);
      }
      return [...prev, lang];
    });
  }

  function navigateToStep(targetStep: WizardStep) {
    setError(null);
    setStep(targetStep);
  }

  async function handleCreateProject() {
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const slug = toSlug(name);
    const siteData = buildWizardSiteData({
      name: name.trim(),
      location: location.trim(),
      address: {
        ...address,
        formatted: location.trim(),
      },
      category,
      languages,
      defaultLanguage,
      welcomeMessage: welcomeText.trim(),
      welcomeTranslations,
      facilities,
      photos,
      booking,
      contact,
      appSettings,
      locations,
      suggestions,
      theme: Object.keys(wizardTheme).length > 0 ? wizardTheme : undefined,
    });

    if (editingProjectId) {
      const { updateProject } = await import("@/lib/storage");
      const result = updateProject(editingProjectId, {
        name: name.trim(),
        slug,
        site_data: siteData,
      });

      if (!result) {
        setError("Update mislukt.");
        setLoading(false);
        return;
      }

      window.sessionStorage.removeItem(wizardDraftKey);
      router.push(`/display/${editingProjectId}`);
      return;
    }

    const { createProject: createStorageProject } = await import("@/lib/storage");
    const newProject = createStorageProject(name.trim());
    const { updateProject: updateNew } = await import("@/lib/storage");
    updateNew(newProject.id, { slug, site_data: siteData });

    window.sessionStorage.removeItem(wizardDraftKey);
    router.push(`/display/${newProject.id}`);
  }


  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_92%_-10%,rgba(230,125,77,0.18),transparent_30%),radial-gradient(circle_at_-10%_10%,rgba(20,90,99,0.14),transparent_28%)]" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Link
          href={
            editingProjectId
              ? `/display/${editingProjectId}`
              : "/"
          }
          className="btn-ghost gap-2 mb-6 inline-flex"
        >
          <ArrowLeft size={16} />
          {editingProjectId ? "Terug naar display" : ui.backDashboard}
        </Link>

        {draftReady && !editingProjectId && !wizardStarted ? (
          <div className="mx-auto max-w-3xl">
            <div className="card border-white/80 bg-white/94 shadow-[0_28px_80px_rgba(15,53,60,0.12)]">
              <div className="rounded-[28px] border border-brand/10 bg-[linear-gradient(180deg,rgba(20,90,99,0.06),rgba(255,255,255,0.96))] p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/8 text-brand">
                    <Globe2 size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand/60">
                      Welkom / Welcome
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                      Maak je gastenapp in een paar stappen
                    </h1>
                    <p className="mt-4 text-sm leading-7 text-ink-soft">
                      Deze wizard helpt je om stap voor stap een professionele
                      gastenapp te maken. Kies eerst de taal van de wizard en
                      welke talen je gasten straks in de app kunnen kiezen.
                    </p>
                  </div>
                </div>

                {/* ── Wizard-taal kiezen ── */}
                <div className="mt-6 rounded-[24px] border border-brand/10 bg-white/85 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand/60">
                        Taal van de wizard
                      </p>
                      <p className="mt-2 text-xs leading-5 text-ink-soft">
                        Klik op een taal om die als standaard in te stellen.
                        De wizard wordt in deze taal getoond.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={detectAndTranslate}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand/5 px-3 py-2 text-xs font-extrabold text-brand transition-all hover:bg-brand/10"
                    >
                      <Globe2 size={14} />
                      {ui.detectTranslate}
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(["nl", "en", "de", "fr"] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          if (!languages.includes(lang)) {
                            toggleLanguage(lang);
                          }
                          setDefaultLanguage(lang);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                          defaultLanguage === lang
                            ? "bg-brand text-white shadow-md"
                            : "bg-brand/5 text-brand hover:bg-brand/10"
                        }`}
                      >
                        {{ nl: "🇳🇱 Nederlands", en: "🇬🇧 English", de: "🇩🇪 Deutsch", fr: "🇫🇷 Français" }[lang]}
                        {defaultLanguage === lang ? " ✓" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── App-talen selecteren ── */}
                <div className="mt-4 rounded-[24px] border border-brand/10 bg-white/85 p-4 sm:p-5">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand/60">
                    {ui.appLanguages}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-ink-soft">
                    Selecteer welke talen beschikbaar zijn in de app voor je gasten.
                    De wizardtaal hierboven wordt automatisch meegenomen.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["nl", "en", "de", "fr"] as Language[]).map((lang) => {
                      const isDefault = defaultLanguage === lang;
                      const isActive = languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => { if (!isDefault) toggleLanguage(lang); }}
                          disabled={isDefault}
                          className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${
                            isActive
                              ? "bg-brand text-white"
                              : "bg-brand/5 text-brand hover:bg-brand/10"
                          } ${isDefault ? "opacity-80 cursor-not-allowed" : ""}`}
                        >
                          {lang.toUpperCase()}
                          {isDefault ? ` • ${ui.defaultSuffix}` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Twee knoppen ── */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <Link
                    href="/"
                    className="btn-ghost text-center"
                  >
                    Annuleren
                  </Link>
                  <button
                    type="button"
                    onClick={() => setWizardStarted(true)}
                    className="btn-primary"
                  >
                    Start wizard →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 items-start">
            <aside className="hidden">
              <div className="card !p-4 space-y-4 border border-brand/20 bg-white/90 backdrop-blur-lg shadow-lg">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand/70">
                    {ui.progress}
                  </p>
                  <h1 className="text-xl font-extrabold text-ink mt-1.5">
                    {steps[step - 1].label}
                  </h1>
                  <p className="text-xs text-ink-soft mt-1.5 leading-5">
                    {steps[step - 1].hint}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatPill
                    label={wizardUi.currentStep}
                    value={`${step}/${steps.length}`}
                  />
                  <StatPill
                    label={wizardUi.remainingSteps}
                    value={String(steps.length - step)}
                  />
                </div>

                <div className="h-2 rounded-full bg-brand/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${(step / steps.length) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {steps.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateToStep(item.id)}
                      className={`w-full rounded-2xl px-2.5 py-2.5 text-left transition-all min-h-[64px] ${
                        step === item.id
                          ? "bg-brand/10 ring-1 ring-brand/15"
                          : "hover:bg-brand/5"
                      }`}
                    >
                      <div className="flex h-full min-h-[44px] flex-col items-start justify-start gap-2">
                        <div
                          className={`h-7 min-w-7 rounded-full flex items-center justify-center px-2 text-[11px] font-extrabold ${
                            step === item.id
                              ? "bg-brand text-white"
                              : step > item.id
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {step > item.id ? <Check size={14} /> : item.id}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-ink leading-4 break-words">
                            {item.label}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="card shadow-[0_28px_90px_rgba(11,42,54,0.19)] border border-brand/15 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-lg">
              <div className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-brand/10 px-4 py-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xs font-bold text-brand">
                    Stap {step} van {steps.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-ink-soft">Toetsen: ← / →</span>
                    <button
                      type="button"
                      onClick={() => setCompactMode((prev) => !prev)}
                      className="rounded-full border border-brand/20 bg-white px-2 py-1 text-[10px] font-extrabold text-brand hover:bg-brand/10"
                    >
                      Compact {compactMode ? "Uit" : "Aan"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-4 overflow-x-auto -mx-4 px-4 py-2 bg-white/70 border-b border-brand/10">
                <div className="flex gap-2 min-w-max">
                  {steps.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateToStep(item.id)}
                      className={`rounded-full transition ${
                        compactMode
                          ? "w-10 h-10 px-0 py-0 text-[10px]"
                          : "px-3 py-1.5 text-xs"
                      } ${
                        step === item.id
                          ? "bg-brand text-white"
                          : "bg-white text-brand border border-brand/20 hover:bg-brand/10"
                      }`}
                    >
                      {compactMode ? item.id : `${item.id}. ${item.label}`}
                    </button>
                  ))}
                </div>
                <div className="mt-3 h-2 rounded-full bg-brand/10">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${(step / steps.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand/70">
                    {ui.stepOf} {step} / {steps.length}
                  </p>
                  <h2 className="text-2xl font-extrabold text-ink mt-1">
                    {steps[step - 1].label}
                  </h2>
                </div>

                {step === 1 && (
                  <button
                    type="button"
                    onClick={detectAndTranslate}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand/5 text-brand text-xs font-extrabold hover:bg-brand/10 transition-all"
                  >
                    <Globe2 size={14} />
                    {ui.detectTranslate}
                  </button>
                )}
              </div>

              {translationNotice && (
                <div className="mb-5 rounded-2xl border border-brand/10 bg-brand/5 px-4 py-3 text-xs text-ink-soft">
                  {translationNotice}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="label">{ui.appName}</label>
                    <input
                      className="input text-lg"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={ui.appNamePlaceholder}
                      autoFocus
                    />
                    <p className="text-xs text-ink-soft mt-2">
                      {ui.appNameHelp}
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-[1.4fr_0.7fr] gap-3">
                    <Field label={ui.addressStreet}>
                      <input
                        className="input text-base"
                        value={address.street}
                        onChange={(e) =>
                          updateAddressField("street", e.target.value)
                        }
                        placeholder="Voorstraat"
                        autoFocus
                      />
                    </Field>
                    <Field label={ui.addressHouseNumber}>
                      <input
                        className="input text-base"
                        value={address.houseNumber}
                        onChange={(e) =>
                          updateAddressField("houseNumber", e.target.value)
                        }
                        placeholder="12"
                      />
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label={ui.addressPostalCode}>
                      <input
                        className="input text-base"
                        value={address.postalCode}
                        onChange={(e) =>
                          updateAddressField("postalCode", e.target.value)
                        }
                        placeholder="2865 XL"
                      />
                    </Field>
                    <Field label={ui.addressCity}>
                      <input
                        className="input text-base"
                        value={address.city}
                        onChange={(e) =>
                          updateAddressField("city", e.target.value)
                        }
                        placeholder="Ammerstol"
                      />
                    </Field>
                  </div>

                  <Field label={ui.addressCountry}>
                    <input
                      className="input text-base"
                      value={address.country}
                      onChange={(e) =>
                        updateAddressField("country", e.target.value)
                      }
                      placeholder="Nederland"
                    />
                  </Field>

                  <div className="rounded-[24px] border border-brand/10 bg-brand/5 p-4 space-y-3">
                    <p className="text-sm text-ink-soft leading-6">
                      {ui.addressSearchHelp}
                    </p>
                    <button
                      type="button"
                      onClick={() => searchNearby(true)}
                      disabled={
                        !isWizardAddressComplete(address) || nearbyLoading
                      }
                      className="btn-primary disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {nearbyLoading ? ui.addressSearching : ui.addressSearch}
                    </button>

                    {location && (
                      <div className="rounded-2xl bg-white/80 border border-brand/10 px-4 py-3">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand/60">
                          {address.formatted ? ui.addressResolved : ui.location}
                        </p>
                        <p className="text-sm text-ink mt-2">{location}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  {/* Uitleg wat deze stap doet */}
                  <div className="rounded-[24px] border border-brand/10 bg-brand/5 p-4">
                    <p className="text-sm font-extrabold text-ink flex items-center gap-2">
                      <AppIcon name="building" className="h-4 w-4 text-brand" />
                      {ui.categoryTitle ?? "Kies het type verblijf"}
                    </p>
                    <p className="text-sm text-ink-soft mt-2 leading-6">
                      {ui.categoryHelp ??
                        "De categorie bepaalt de stijl, kleurtoon en standaard-inhoud van je app. Je kunt later alles aanpassen, maar dit geeft de beste startpositie."}
                    </p>
                  </div>

                  {/* Categorie-kaarten */}
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {categoryOptions.map((option) => {
                      const isActive = category === option.value;
                      const themeColors: Record<
                        WizardCategory,
                        { from: string; to: string }
                      > = {
                        bnb: { from: "#145a63", to: "#e67d4d" },
                        vakantiehuis: { from: "#2f6750", to: "#cf8654" },
                        stadsgids: { from: "#183f58", to: "#d68f58" },
                        wellness: { from: "#40676a", to: "#de8b73" },
                        familie: { from: "#28656c", to: "#e58b55" },
                        natuur: { from: "#305f50", to: "#cb8658" },
                      };
                      const colors = themeColors[option.value];
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setCategory(option.value)}
                          className={`text-left rounded-[24px] border p-4 transition-all group relative overflow-hidden ${
                            isActive
                              ? "border-brand/30 bg-white shadow-[0_14px_32px_rgba(20,90,99,0.12)]"
                              : "border-brand/10 bg-white hover:border-brand/20 hover:shadow-md"
                          }`}
                        >
                          {/* Kleurstreep linksboven */}
                          <div
                            className="absolute top-0 left-0 right-0 h-1 rounded-t-[24px]"
                            style={{
                              background: isActive
                                ? `linear-gradient(to right, ${colors.from}, ${colors.to})`
                                : "transparent",
                            }}
                          />
                          <div className="flex items-start gap-3 mt-1">
                            {/* Kleur-icoon */}
                            <span
                              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                              style={{
                                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                              }}
                            >
                              <AppIcon
                                name={option.emoji}
                                className="h-5 w-5"
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-extrabold text-ink">
                                  {option.title}
                                </p>
                                {isActive && (
                                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                                    <Check size={11} />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-ink-soft mt-1 leading-5">
                                {option.description}
                              </p>
                            </div>
                          </div>

                          {/* Mini kleurpalet preview */}
                          <div className="flex gap-1.5 mt-3 pl-14">
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ background: colors.from }}
                              title="Primaire kleur"
                            />
                            <div
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ background: colors.to }}
                              title="Accentkleur"
                            />
                            <div
                              className="w-4 h-4 rounded-full shadow-sm border border-gray-100"
                              style={{ background: "#f8f4ec" }}
                              title="Achtergrond"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Geselecteerde categorie uitleg */}
                  {category && (
                    <div className="rounded-[22px] border border-accent/20 bg-accent/5 p-4 flex gap-3 items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <AppIcon
                          name={
                            categoryCatalog[category][defaultLanguage].emoji
                          }
                          className="h-5 w-5 text-accent"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-ink">
                          {ui.categorySelected ?? "Je koos:"}{" "}
                          {categoryCatalog[category][defaultLanguage].title}
                        </p>
                        <p className="text-sm text-ink-soft mt-1 leading-6">
                          {ui.categoryEffect ??
                            "De app krijgt automatisch de bijpassende kleur, toon en standaard-teksten. In de editor kun je dit altijd verfijnen."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-accent/20 bg-accent/5 p-4">
                    <p className="text-sm font-extrabold text-ink flex items-center gap-2">
                      <Home size={16} className="text-accent" />
                      {ui.welcomeTitle}
                    </p>
                    <p className="text-sm text-ink-soft mt-2 leading-6">
                      {ui.welcomeHelp}
                    </p>
                  </div>

                  <Field label={ui.welcomeField}>
                    <div className="space-y-3">
                      <textarea
                        rows={5}
                        className="input text-sm resize-none"
                        value={welcomeText}
                        onChange={(e) => updateWelcome(e.target.value)}
                        placeholder={ui.welcomePlaceholder}
                      />
                      <AiActionGroup
                        onImprove={() => runWelcomeAi("improve")}
                        onTranslate={() => runWelcomeAi("translate")}
                        improveLoading={aiLoading === "welcome:improve"}
                        translateLoading={aiLoading === "welcome:translate"}
                        improveLabel={ui.aiImprove}
                        translateLabel={ui.aiTranslate}
                      />
                    </div>
                  </Field>

                  <MiniHint
                    title={ui.welcomePreview}
                    text={
                      (welcomeTranslations[defaultLanguage] ?? welcomeText) ||
                      ui.welcomePlaceholder
                    }
                  />
                  <TranslationPreview
                    translations={welcomeTranslations}
                    languages={languages}
                  />
                </div>
              )}

              {step === 5 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <StatPill
                      label={ui.statsAvailable}
                      value={String(facilities.length)}
                    />
                    <StatPill
                      label={ui.statsSelected}
                      value={String(stats.selectedFacilities)}
                    />
                    <StatPill label="AI" value="On" />
                  </div>

                  <div className="rounded-[24px] border border-brand/10 bg-brand/5 p-4">
                    <p className="text-sm font-extrabold text-ink flex items-center gap-2">
                      <Home size={16} className="text-brand" />
                      {ui.amenitiesTitle}
                    </p>
                    <p className="text-sm text-ink-soft mt-2 leading-6">
                      {ui.amenitiesIntro}
                    </p>

                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input
                        className="input text-xs"
                        value={facilitySearch}
                        onChange={(e) => setFacilitySearch(e.target.value)}
                        placeholder="Zoek voorzieningen…"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFacilitySearch("");
                          setActiveFacilityGroup("bnb-facilities");
                        }}
                        className="rounded-xl bg-brand/10 text-brand px-3 py-2 text-xs font-extrabold hover:bg-brand/20 transition-all"
                      >
                        Reset filter
                      </button>
                    </div>

                    <div className="mt-2 sm:flex sm:items-center sm:gap-2">
                      <input
                        className="input text-xs flex-1"
                        value={customFacilityTitle}
                        onChange={(e) => setCustomFacilityTitle(e.target.value)}
                        placeholder="Eigen voorziening toevoegen…"
                      />
                      <button
                        type="button"
                        onClick={addCustomFacility}
                        className="mt-2 sm:mt-0 rounded-xl bg-brand text-white px-3 py-2 text-xs font-extrabold hover:bg-brand/80 transition-all"
                      >
                        Toevoegen
                      </button>
                    </div>

                    <p className="text-[11px] text-ink-soft mt-1">
                      Zoek bestaande voorzieningen of voeg snel je eigen idee
                      toe.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {filteredFacilityGroups
                      .filter((groupData) => groupData.items.length > 0)
                      .map(({ group, meta, items }) => {
                        const selectedCount = items.filter(
                          (item) => item.selected,
                        ).length;
                        return (
                          <button
                            key={group}
                            type="button"
                            onClick={() => setActiveFacilityGroup(group)}
                            className={`rounded-[20px] border px-4 py-3 text-left transition-all ${
                              activeFacilityGroup === group
                                ? "border-brand/25 bg-white shadow-[0_10px_24px_rgba(20,90,99,0.08)] ring-1 ring-brand/10"
                                : "border-brand/10 bg-white hover:border-brand/20"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-extrabold text-ink">
                                  {meta.title}
                                </p>
                                <p className="text-[11px] text-ink-soft mt-1 leading-5">
                                  {meta.description}
                                </p>
                              </div>
                              <span className="rounded-full bg-brand/8 px-2.5 py-1 text-[11px] font-extrabold text-brand">
                                {selectedCount}/{items.length}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {filteredFacilityGroups.length === 0 && (
                    <div className="rounded-[20px] border border-dashed border-brand/20 bg-white/80 p-4 text-sm text-ink-soft">
                      Geen voorzieningen gevonden voor deze zoekterm. Probeer
                      een andere naam of leeg het filter.
                    </div>
                  )}

                  <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-5 items-start">
                    <div className="rounded-[24px] border border-brand/10 bg-white p-3 sm:p-4">
                      <div>
                        <p className="text-sm font-extrabold text-ink">
                          {activeFacilityGroupData?.meta.title}
                        </p>
                        <p className="text-sm text-ink-soft mt-2 leading-6">
                          {activeFacilityGroupData?.meta.description}
                        </p>
                      </div>

                      <div className="mt-4 space-y-2">
                        {(activeFacilityGroupData?.items ?? []).map((item) => (
                          <div
                            key={item.id}
                            className={`rounded-[20px] border px-3 py-2.5 sm:py-3 transition-all ${
                              activeFacility?.id === item.id
                                ? "border-brand/25 bg-brand/5 shadow-[0_10px_22px_rgba(20,90,99,0.06)]"
                                : "border-brand/10 bg-bg"
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <button
                                type="button"
                                onClick={() => setActiveFacilityId(item.id)}
                                className="flex-1 min-w-0 flex items-center gap-3 text-left"
                              >
                                <div
                                  className={`h-10 w-10 shrink-0 rounded-2xl border flex items-center justify-center text-lg ${
                                    activeFacility?.id === item.id
                                      ? "bg-white border-brand/15 shadow-sm"
                                      : "bg-white border-brand/10"
                                  }`}
                                >
                                  <AppIcon
                                    name={item.icon}
                                    className="h-4 w-4"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-extrabold text-ink">
                                      {item.titleTranslations?.[
                                        defaultLanguage
                                      ] ?? item.title}
                                    </p>
                                    {item.selected && (
                                      <span className="rounded-full bg-brand/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-brand">
                                        {ui.selected}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-ink-soft mt-1 leading-4 truncate">
                                    {item.helperText || item.description}
                                  </p>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  updateFacility(item.id, {
                                    selected: !item.selected,
                                  });
                                  setActiveFacilityId(item.id);
                                }}
                                className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-extrabold transition-all ${
                                  item.selected
                                    ? "bg-brand text-white"
                                    : "bg-white text-brand border border-brand/10 hover:bg-brand/5"
                                }`}
                              >
                                {item.selected ? ui.selected : ui.include}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="xl:sticky xl:top-8 space-y-4">
                      {activeFacility ? (
                        <>
                          <div className="rounded-[28px] border border-brand/10 bg-white p-5 shadow-[0_18px_40px_rgba(20,90,99,0.08)]">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="h-12 w-12 rounded-[18px] bg-brand/5 border border-brand/10 shadow-sm flex items-center justify-center text-xl">
                                  <AppIcon
                                    name={activeFacility.icon}
                                    className="h-5 w-5"
                                  />
                                </div>
                                <div>
                                  <p className="text-base font-extrabold text-ink">
                                    {activeFacility.titleTranslations?.[
                                      defaultLanguage
                                    ] ?? activeFacility.title}
                                  </p>
                                  <p className="text-xs text-ink-soft mt-1">
                                    {ui.amenityTooltipLabel}:{" "}
                                    {activeFacility.helperText ||
                                      activeFacility.description}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  updateFacility(activeFacility.id, {
                                    selected: !activeFacility.selected,
                                  })
                                }
                                className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold transition-all ${
                                  activeFacility.selected
                                    ? "bg-brand text-white"
                                    : "bg-white text-brand border border-brand/10 hover:bg-brand/5"
                                }`}
                              >
                                {activeFacility.selected
                                  ? ui.selected
                                  : ui.include}
                              </button>
                            </div>

                            <div className="grid gap-4 mt-5">
                              <Field label={ui.amenityDescription}>
                                <div className="space-y-3">
                                  <textarea
                                    rows={4}
                                    className="input text-sm resize-none"
                                    value={activeFacility.description}
                                    onChange={(e) =>
                                      updateFacility(activeFacility.id, {
                                        description: e.target.value,
                                      })
                                    }
                                  />
                                  <AiActionGroup
                                    onImprove={() =>
                                      runFacilityAi(
                                        activeFacility.id,
                                        "improve",
                                      )
                                    }
                                    onTranslate={() =>
                                      runFacilityAi(
                                        activeFacility.id,
                                        "translate",
                                      )
                                    }
                                    improveLoading={
                                      aiLoading ===
                                      `facility:${activeFacility.id}:improve`
                                    }
                                    translateLoading={
                                      aiLoading ===
                                      `facility:${activeFacility.id}:translate`
                                    }
                                    improveLabel={ui.aiImprove}
                                    translateLabel={ui.aiTranslate}
                                  />
                                  <TranslationPreview
                                    translations={
                                      activeFacility.descriptionTranslations
                                    }
                                    languages={languages}
                                  />
                                </div>
                              </Field>

                              <Field label={ui.amenityDetailsTitle}>
                                <div className="grid sm:grid-cols-3 gap-3">
                                  <input
                                    className="input text-sm"
                                    value={activeFacility.locationDetails ?? ""}
                                    onChange={(e) =>
                                      updateFacility(activeFacility.id, {
                                        locationDetails: e.target.value,
                                      })
                                    }
                                    placeholder={ui.amenityLocationLabel}
                                  />
                                  <input
                                    className="input text-sm"
                                    value={activeFacility.usageDetails ?? ""}
                                    onChange={(e) =>
                                      updateFacility(activeFacility.id, {
                                        usageDetails: e.target.value,
                                      })
                                    }
                                    placeholder={ui.amenityUsageLabel}
                                  />
                                  <input
                                    className="input text-sm"
                                    value={activeFacility.timingDetails ?? ""}
                                    onChange={(e) =>
                                      updateFacility(activeFacility.id, {
                                        timingDetails: e.target.value,
                                      })
                                    }
                                    placeholder={ui.amenityTimingLabel}
                                  />
                                </div>
                              </Field>
                            </div>
                          </div>

                          <div className="rounded-[28px] border border-brand/10 bg-white p-5 shadow-[0_18px_40px_rgba(20,90,99,0.08)]">
                            <p className="text-sm font-extrabold text-ink">
                              {ui.amenityPreviewTitle}
                            </p>
                            <p className="text-sm text-ink-soft mt-2 leading-6">
                              {ui.amenityPreviewIntro}
                            </p>

                            <div className="mt-4 rounded-[24px] border border-brand/10 bg-[linear-gradient(180deg,#faf6ef,#f6efe4)] p-4">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                                    <Home size={15} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-extrabold text-ink">
                                      {ui.amenitiesTitle}
                                    </p>
                                    <p className="text-xs text-ink-soft">
                                      {selectedFacilities.length}{" "}
                                      {ui.statsAmenities.toLowerCase()}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFacilityPreviewExpanded((prev) => !prev)
                                  }
                                  className="text-xs font-extrabold text-brand underline"
                                >
                                  {facilityPreviewExpanded
                                    ? "Verberg preview"
                                    : "Toon preview"}
                                </button>
                              </div>

                              {facilityPreviewExpanded ? (
                                <div className="mt-4 flex justify-center">
                                  <div className="w-full max-w-[340px] rounded-[44px] border border-black/25 bg-black text-white shadow-[0_14px_30px_rgba(0,0,0,0.3)]">
                                    <div className="h-6 rounded-t-[40px] bg-black/80 flex items-center justify-center">
                                      <div className="h-1 w-14 rounded-full bg-white/40" />
                                    </div>
                                    <div className="h-4 bg-black/80" />
                                    <div className="max-h-[310px] overflow-y-auto bg-white px-3 py-3 text-black rounded-b-[40px]">
                                      <div className="mb-2 flex items-center justify-between">
                                        <p className="text-xs font-extrabold text-ink">
                                          Voorzieningen in je app
                                        </p>
                                        <span className="text-[11px] text-ink-soft">
                                          Preview
                                        </span>
                                      </div>
                                      {selectedFacilities.length > 0 ? (
                                        selectedFacilities.map((item) => (
                                          <div
                                            key={item.id}
                                            className="mb-2 rounded-xl border border-brand/15 bg-bg p-3"
                                          >
                                            <div className="flex items-start gap-2">
                                              <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                                                <AppIcon
                                                  name={item.icon}
                                                  className="h-4 w-4"
                                                />
                                              </div>
                                              <div className="min-w-0">
                                                <p className="text-sm font-extrabold text-ink">
                                                  {item.titleTranslations?.[
                                                    defaultLanguage
                                                  ] ?? item.title}
                                                </p>
                                                <p className="text-xs text-ink-soft mt-1 leading-5">
                                                  {item
                                                    .descriptionTranslations?.[
                                                    defaultLanguage
                                                  ] ?? item.description}
                                                </p>
                                                <div className="mt-2 text-[10px] text-ink-soft">
                                                  {Object.entries(
                                                    item.titleTranslations ??
                                                      {},
                                                  ).map(([lang, title]) => (
                                                    <p
                                                      key={`${item.id}-${lang}`}
                                                    >
                                                      {lang.toUpperCase()}:{" "}
                                                      {title}
                                                    </p>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="rounded-lg border border-dashed border-ink/30 bg-brand/10 px-3 py-3 text-xs text-ink-soft">
                                          {ui.amenityEmptyState}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4 text-sm text-ink-soft">
                                  Klik op ‘Toon preview’ om (iPhone-stijl) het
                                  eindproduct te zien met voorzieningen en
                                  vertalingen.
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-brand/20 bg-white/80 p-6 text-sm text-ink-soft">
                          {ui.amenityEmptyState}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="grid xl:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">
                  {/* ── Left column: search controls + location list ── */}
                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-brand/10 bg-white p-3 sm:p-5 shadow-[0_20px_60px_rgba(15,53,60,0.06)]">
                      <div className="flex flex-col sm:flex-wrap sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand/60">
                            Selecteer locaties in de buurt
                          </p>
                          <p className="text-sm text-ink-soft mt-1">
                            {location || ui.locationPlaceholder}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => searchNearby(true)}
                            disabled={
                              !isWizardAddressComplete(address) || nearbyLoading
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 text-accent text-xs font-extrabold hover:bg-accent/15 transition-all disabled:opacity-60 w-full sm:w-auto justify-center"
                          >
                            <Search size={14} />
                            {nearbyLoading
                              ? ui.addressSearching
                              : ui.nearbyRefresh}
                          </button>
                          <button
                            type="button"
                            onClick={() => setResultsView("list")}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-extrabold ${resultsView === "list" ? "bg-brand text-white" : "bg-brand/5 text-brand"}`}
                          >
                            <List size={13} />
                            {ui.listView}
                          </button>
                          <button
                            type="button"
                            onClick={() => setResultsView("map")}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-extrabold ${resultsView === "map" ? "bg-brand text-white" : "bg-brand/5 text-brand"}`}
                          >
                            <Map size={13} />
                            {ui.mapView}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 h-2 rounded-full bg-brand/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{ width: `${nearbyProgress}%` }}
                        />
                      </div>
                      {nearbyStage && (
                        <p className="mt-2 text-xs font-bold text-brand animate-pulse">
                          {nearbyStage}
                        </p>
                      )}

                      {/* Filter pills */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {placeFilters.map((filterValue) => (
                          <button
                            key={filterValue}
                            type="button"
                            onClick={() => setLocationFilter(filterValue)}
                            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${locationFilter === filterValue ? "bg-brand text-white" : "bg-brand/5 text-brand hover:bg-brand/10"}`}
                          >
                            {formatLocationFilterLabel(
                              filterValue,
                              defaultLanguage,
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Distance slider */}
                      <div className="mt-4 rounded-[16px] border border-brand/10 bg-brand/3 px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-extrabold text-ink">
                            📏 Max afstand
                          </label>
                          <span className="text-xs font-extrabold text-brand tabular-nums">
                            {maxDistanceKm < 1 ? `${Math.round(maxDistanceKm * 1000)} m` : `${maxDistanceKm} km`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={10}
                          step={0.5}
                          value={maxDistanceKm}
                          onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-brand/15 accent-brand"
                        />
                        <div className="flex justify-between mt-1 text-[10px] text-ink-soft">
                          <span>500m</span>
                          <span>5 km</span>
                          <span>10 km</span>
                        </div>
                      </div>

                      {/* Stats pills */}
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <StatPill
                          label={ui.statsResults}
                          value={String(stats.total)}
                        />
                        <StatPill
                          label={ui.statsSelected}
                          value={String(stats.selected)}
                        />
                        <StatPill
                          label={ui.statsRestaurants}
                          value={String(stats.restaurants)}
                        />
                        <StatPill
                          label={ui.statsAmenities}
                          value={String(stats.services)}
                        />
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <input
                          className="input text-xs"
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          placeholder="Zoek locatie (naam of adres)"
                        />
                        <select
                          className="input text-xs"
                          value={locationSort}
                          onChange={(e) => setLocationSort(e.target.value as any)}
                        >
                          <option value="distance">{ui.sortDistance}</option>
                          <option value="name">Sorteer op naam</option>
                          <option value="rating">{ui.sortRating}</option>
                        </select>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setShowManualLocationForm((v) => !v)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand text-white text-xs font-extrabold hover:bg-brand/80 transition-all"
                        >
                          <MapPin size={13} />
                          {showManualLocationForm ? "Formulier sluiten" : "Handmatig locatie toevoegen"}
                        </button>
                        <button
                          type="button"
                          onClick={toggleSelectAllLocations}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand/10 text-brand text-xs font-extrabold hover:bg-brand/15 transition-all"
                        >
                          {selectedLocations.length === locations.length
                            ? "Deselecteer alles"
                            : "Selecteer alles"}
                        </button>
                      </div>

                      {/* Manual location add form */}
                      {showManualLocationForm && (
                        <div className="mt-3 rounded-[20px] border border-accent/20 bg-accent/5 p-4 space-y-3">
                          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent/80">
                            Handmatig locatie toevoegen
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              className="input text-xs"
                              value={customLocationName}
                              onChange={(e) => setCustomLocationName(e.target.value)}
                              placeholder="Naam van de locatie"
                            />
                            <input
                              className="input text-xs"
                              value={customLocationAddress}
                              onChange={(e) => setCustomLocationAddress(e.target.value)}
                              placeholder="Volledig adres (straat, stad, land)"
                            />
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <select
                              className="input text-xs"
                              value={customLocationCategory}
                              onChange={(e) => setCustomLocationCategory(e.target.value as any)}
                            >
                              <option value="tourism">
                                {formatLocationCategoryLabel("tourism", defaultLanguage)}
                              </option>
                              <option value="restaurant">
                                {formatLocationCategoryLabel("restaurant", defaultLanguage)}
                              </option>
                              <option value="shops">
                                {formatLocationCategoryLabel("shops", defaultLanguage)}
                              </option>
                            </select>
                            {customLocationAddress.trim() && (
                              <a
                                href={`https://www.google.com/maps/search/${encodeURIComponent(customLocationAddress.trim())}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-brand/15 text-brand text-xs font-extrabold hover:bg-brand/5 transition-all"
                              >
                                <ExternalLink size={13} />
                                Controleer adres in Google Maps
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const trimName = customLocationName.trim();
                                const trimAddr = customLocationAddress.trim();
                                if (!trimName) return;
                                if (
                                  locations.some(
                                    (item) =>
                                      item.name?.toLowerCase() === trimName.toLowerCase(),
                                  )
                                )
                                  return;
                                const newLocation: WizardLocation = {
                                  id: `custom-location-${Date.now()}`,
                                  name: trimName,
                                  category: customLocationCategory,
                                  address: trimAddr || trimName,
                                  latitude: 0,
                                  longitude: 0,
                                  distance_from_bnb: 0,
                                  descriptions: {
                                    nl: trimName,
                                    en: trimName,
                                    de: trimName,
                                    fr: trimName,
                                  },
                                  selected: true,
                                  google_maps_link: trimAddr
                                    ? `https://www.google.com/maps/search/${encodeURIComponent(trimAddr)}`
                                    : undefined,
                                };
                                setLocations((prev) => [newLocation, ...prev]);
                                setCustomLocationName("");
                                setCustomLocationAddress("");
                                setCustomLocationCategory("tourism");
                                setShowManualLocationForm(false);
                              }}
                              disabled={!customLocationName.trim()}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-extrabold hover:bg-accent/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Check size={13} />
                              Locatie toevoegen
                            </button>
                            <p className="text-[11px] text-ink-soft self-center leading-4">
                              Vul een adres in zodat Google Maps en foto&apos;s werken.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Subtle warnings */}
                      {subtleNearbyWarnings.length > 0 && (
                        <p className="mt-3 text-xs text-brand/60">
                          Nearby AI viel terug op standaardresultaten. Je
                          plekken zijn wel geladen.
                        </p>
                      )}
                      {visibleNearbyWarnings.length > 0 && (
                        <div className="mt-3 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1">
                          {visibleNearbyWarnings.map((w) => (
                            <p key={w}>{w}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Map view */}
                    {resultsView === "map" && locations.length > 0 && (
                      <LocationMap
                        locations={locations}
                        centerLat={address.latitude ?? 52.0}
                        centerLng={address.longitude ?? 5.0}
                        activeId={activeLocationId}
                        onSelect={(id) => setActiveLocationId(id)}
                        onToggle={(id) => toggleLocationSelection(id)}
                      />
                    )}

                    {/* Buurttips */}
                    {selectedLocations.length > 0 && !nearbyLoading && (
                      <div className="rounded-[24px] border border-accent/15 bg-accent/5 p-4">
                        <p className="text-sm font-extrabold text-ink flex items-center gap-2">
                          <Sparkles size={14} className="text-accent" />
                          Tips over de buurt
                        </p>
                        <div className="mt-3 space-y-2">
                          {stats.restaurants > 0 && (
                            <p className="text-xs text-ink-soft leading-5">
                              🍽️ Er {stats.restaurants === 1 ? "is" : "zijn"}{" "}
                              <strong>{stats.restaurants} restaurant{stats.restaurants !== 1 ? "s" : ""}</strong> in
                              de buurt gevonden. Gasten waarderen altijd lokale eettips.
                            </p>
                          )}
                          {stats.experiences > 0 && (
                            <p className="text-xs text-ink-soft leading-5">
                              🎯 <strong>{stats.experiences} activiteit{stats.experiences !== 1 ? "en" : ""}</strong> gevonden
                              in de omgeving — ideaal om je gasten een compleet verblijf te bieden.
                            </p>
                          )}
                          {stats.services > 0 && (
                            <p className="text-xs text-ink-soft leading-5">
                              🏪 <strong>{stats.services} voorziening{stats.services !== 1 ? "en" : ""}</strong> dichtbij
                              — denk aan supermarkten, apotheken en OV-haltes.
                            </p>
                          )}
                          <p className="text-xs text-ink-soft leading-5">
                            💡 Tip: voeg ook je eigen B&amp;B toe als locatie zodat gasten die terugvinden op de kaart.
                            Gebruik het zoekveld hierboven om handmatig locaties toe te voegen.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Location list */}
                    {visibleLocations.length > 0 ? (
                      <div className="rounded-[28px] border border-brand/10 bg-white overflow-hidden shadow-[0_20px_60px_rgba(15,53,60,0.06)]">
                        <div className="px-5 py-4 border-b border-brand/8 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-extrabold text-ink">
                              {ui.summary}
                            </p>
                            <p className="text-xs text-ink-soft mt-1">
                              Klik op een locatie om die rechts te bewerken.
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand/8 text-brand text-xs font-extrabold">
                            <Check size={12} />
                            {stats.selected} / {stats.total}
                          </span>
                        </div>

                        <div className="max-h-[680px] overflow-y-auto divide-y divide-brand/6">
                          {visibleLocations.map((item) => {
                            const isSelected = item.selected !== false;
                            const isActive = activeLocation?.id === item.id;
                            return (
                              <div
                                key={item.id}
                                onClick={() => setActiveLocationId(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setActiveLocationId(item.id);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 cursor-pointer transition-colors ${isActive ? "bg-brand/6" : "bg-white hover:bg-brand/3"} ${!isSelected ? "opacity-55" : ""}`}
                              >
                                {/* Thumbnail */}
                                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-brand/5 border border-brand/8">
                                  <img
                                    src={
                                      item.image_reference ||
                                      getLocationFallbackImage(item)
                                    }
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-extrabold text-ink truncate">
                                    {item.name}
                                  </p>
                                  <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                                    <span className="text-[11px] rounded-full bg-brand/5 px-2 py-0.5 font-extrabold uppercase tracking-wide text-brand">
                                      {formatLocationCategoryLabel(
                                        item.category,
                                        defaultLanguage,
                                      )}
                                    </span>
                                    <span className="text-[11px] text-ink-soft">
                                      {formatDistanceKm(item.distance_from_bnb)}
                                    </span>
                                  </div>
                                </div>

                                {/* Toggle button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLocationSelection(item.id);
                                  }}
                                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all border ${isSelected ? "bg-brand border-brand text-white shadow-sm" : "bg-white border-brand/20 text-brand/30 hover:border-brand/50"}`}
                                  aria-label={
                                    isSelected
                                      ? "Verwijder uit selectie"
                                      : "Voeg toe aan selectie"
                                  }
                                >
                                  <Check size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Footer: selection summary */}
                        <div
                          className={`px-5 py-3 border-t border-brand/8 flex items-center gap-3 ${stats.selected > 0 ? "bg-brand/3" : "bg-white"}`}
                        >
                          <div className="flex-1">
                            <p className="text-xs font-extrabold text-ink">
                              {stats.selected}{" "}
                              {stats.selected === 1
                                ? "locatie wordt"
                                : "locaties worden"}{" "}
                              zichtbaar in de Selectie-tab
                            </p>
                            <p className="text-[11px] text-ink-soft mt-0.5">
                              {stats.restaurants} restaurants ·{" "}
                              {stats.experiences} activiteiten ·{" "}
                              {stats.services} diensten
                            </p>
                          </div>
                          {stats.selected > 0 && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand flex items-center justify-center text-white shadow-sm">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[28px] border border-dashed border-brand/20 bg-white/70 p-8 text-center">
                        <Map className="mx-auto h-8 w-8 text-brand/30 mb-3" />
                        <p className="text-sm text-ink-soft">
                          {placesUi.noPlacesFound}
                        </p>
                        <button
                          type="button"
                          onClick={() => searchNearby(true)}
                          disabled={
                            !isWizardAddressComplete(address) || nearbyLoading
                          }
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand/8 text-brand text-sm font-extrabold hover:bg-brand/15 transition-all disabled:opacity-60"
                        >
                          <Search size={14} />
                          {nearbyLoading
                            ? ui.addressSearching
                            : ui.nearbyRefresh}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Right column: detail panel ── */}
                  <div className="xl:sticky xl:top-8">
                    {activeLocation ? (
                      <div className="rounded-[28px] border border-brand/10 bg-white p-5 shadow-[0_20px_60px_rgba(15,53,60,0.08)] space-y-5">
                        {/* Location header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="h-14 w-14 rounded-2xl overflow-hidden bg-brand/5 border border-brand/8 flex-shrink-0">
                              <img
                                src={
                                  activeLocation.image_reference ||
                                  getLocationFallbackImage(activeLocation)
                                }
                                alt={activeLocation.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-base font-extrabold text-ink">
                                {activeLocation.name}
                              </p>
                              <p className="text-xs text-ink-soft mt-1 leading-5">
                                {activeLocation.recommended_for_guests_reason ||
                                  placesUi.fetchNotice}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              toggleLocationSelection(activeLocation.id)
                            }
                            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${activeLocation.selected === false ? "bg-brand/5 text-brand hover:bg-brand/10" : "bg-brand text-white"}`}
                          >
                            {activeLocation.selected === false
                              ? ui.include
                              : ui.selected}
                          </button>
                        </div>

                        {/* Description + AI */}
                        <Field label={ui.description}>
                          <textarea
                            rows={4}
                            className="input text-sm resize-none"
                            value={
                              activeLocation.descriptions[defaultLanguage] ??
                              activeLocation.descriptions.nl
                            }
                            onChange={(event) =>
                              updateLocation(activeLocation.id, {
                                descriptions: {
                                  ...activeLocation.descriptions,
                                  [defaultLanguage]: event.target.value,
                                },
                              })
                            }
                            placeholder={placesUi.fetchNotice}
                          />
                          <AiActionGroup
                            onImprove={() =>
                              runLocationAi(activeLocation.id, "improve")
                            }
                            onTranslate={() =>
                              runLocationAi(activeLocation.id, "translate")
                            }
                            improveLoading={
                              aiLoading ===
                              `location:${activeLocation.id}:improve`
                            }
                            translateLoading={
                              aiLoading ===
                              `location:${activeLocation.id}:translate`
                            }
                            improveLabel={ui.aiImprove}
                            translateLabel={ui.aiTranslate}
                          />
                          <TranslationPreview
                            translations={activeLocation.descriptions}
                            languages={languages}
                          />
                        </Field>
                        {/*
                                {photoSearchLoadingId === activeLocation.id ? 'Zoeken…' : 'Zoek foto’s'}
                      */}
                        {/* Category + distance */}
                        <div className="grid grid-cols-2 gap-3">
                          <Field label={ui.category}>
                            <select
                              className="input text-sm"
                              value={activeLocation.category}
                              onChange={(event) =>
                                updateLocation(activeLocation.id, {
                                  category: event.target
                                    .value as LocationCategory,
                                })
                              }
                            >
                              <option value="restaurant">
                                {formatLocationCategoryLabel(
                                  "restaurant",
                                  defaultLanguage,
                                )}
                              </option>
                              <option value="tourism">
                                {formatLocationCategoryLabel(
                                  "tourism",
                                  defaultLanguage,
                                )}
                              </option>
                              <option value="shops">
                                {formatLocationCategoryLabel(
                                  "shops",
                                  defaultLanguage,
                                )}
                              </option>
                            </select>
                          </Field>
                          <Field label={ui.distance}>
                            <div className="input text-sm min-h-[44px] flex items-center">
                              {formatDistanceKm(
                                activeLocation.distance_from_bnb,
                              )}
                            </div>
                          </Field>
                        </div>

                        {/* Address – editable */}
                        <Field label={placesUi.address}>
                          <input
                            className="input text-sm"
                            value={activeLocation.address || ""}
                            onChange={(e) =>
                              updateLocation(activeLocation.id, {
                                address: e.target.value,
                                google_maps_link: e.target.value.trim()
                                  ? `https://www.google.com/maps/search/${encodeURIComponent(e.target.value.trim())}`
                                  : undefined,
                              })
                            }
                            placeholder="Straat 1, Stad, Land"
                          />
                        </Field>

                        {/* Maps link – always show when address exists */}
                        {(activeLocation.google_maps_link || activeLocation.address) && (
                          <a
                            href={
                              activeLocation.google_maps_link ||
                              `https://www.google.com/maps/search/${encodeURIComponent(activeLocation.address || activeLocation.name)}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand/5 text-brand text-xs font-extrabold hover:bg-brand/10 transition-all"
                          >
                            <ExternalLink size={12} />
                            Bekijk op Google Maps
                          </a>
                        )}

                        {/* Hint about next step */}
                        <div className="rounded-[16px] border border-accent/15 bg-accent/5 px-4 py-3 space-y-2">
                          <div className="flex gap-2 items-center">
                            <ImageIcon className="h-4 w-4 text-accent flex-shrink-0" />
                            <p className="text-xs text-ink-soft">
                              In de volgende stap kies je per locatie de beste
                              foto&apos;s.
                            </p>
                          </div>
                          <div className="rounded-xl border border-brand/10 bg-white/80 px-3 py-2 text-xs text-brand">
                            Tip: gebruik Wi-Fi als voorbeeldvoorziening in je
                            tekst, bijvoorbeeld "Gratis wifi op 50 m van de
                            accommodatie".
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[28px] border border-dashed border-brand/20 bg-white/80 p-8 text-center text-sm text-ink-soft">
                        {placesUi.noPlacesFound}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
                  <LocationPhotoList
                    locations={selectedLocations}
                    photoResults={locationPhotoResults}
                    loading={locationPhotosLoading}
                    loadingProgress={locationPhotosProgress}
                    stage={photoStage}
                    onPhotoSelect={handleLocationPhotoSelect}
                    onSearchMore={handleSearchMorePhotos}
                    onRefresh={fetchLocationPhotos}
                  />
                  <BnbPhotoPanel
                    photos={photos}
                    onPhotosChange={(newPhotos) => setPhotos(newPhotos)}
                  />
                </div>
              )}

              {step === 8 && (
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-brand/10 bg-white p-4 space-y-4">
                    <div>
                      <div>
                        <p className="text-sm font-extrabold text-ink flex items-center gap-2">
                          <CalendarCheck size={16} className="text-brand" />
                          {wizardUi.bookingTitle}
                        </p>
                        <p className="text-sm text-ink-soft mt-2 leading-6">
                          {wizardUi.bookingIntro}
                        </p>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-4">
                      <MultilingualAiTextarea
                        label={wizardUi.bookingPromo}
                        value={booking.promoText}
                        placeholder="Boek direct via onze eigen link en ontvang meteen bevestiging."
                        translations={booking.promoTranslations}
                        languages={languages}
                        defaultLanguage={defaultLanguage}
                        onChange={(value) =>
                          setBooking((prev) => ({
                            ...prev,
                            promoText: value,
                            promoTranslations: {
                              ...prev.promoTranslations,
                              [defaultLanguage]: value,
                            },
                          }))
                        }
                        onImprove={() => runBookingAi("improve")}
                        onTranslate={() => runBookingAi("translate")}
                        improveLoading={aiLoading === "booking:improve"}
                        translateLoading={aiLoading === "booking:translate"}
                        improveLabel={ui.aiImprove}
                        translateLabel={ui.aiTranslate}
                      />

                      <div className="rounded-[24px] border border-brand/10 bg-bg p-4 space-y-4">
                        <Field label={wizardUi.bookingLink}>
                          <input
                            className="input text-sm"
                            value={booking.bookingUrl}
                            onChange={(e) =>
                              setBooking((prev) => ({
                                ...prev,
                                bookingUrl: e.target.value,
                              }))
                            }
                            placeholder="https://..."
                          />
                        </Field>

                        <div className="rounded-2xl border border-brand/10 bg-white p-4">
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand/60">
                            CTA
                          </p>
                          <p className="text-sm font-bold text-ink mt-2">
                            {wizardUi.bookingTitle}
                          </p>
                          <p className="text-sm text-ink-soft mt-2 leading-6">
                            De boekingstekst en knop worden samen bovenaan in de
                            uiteindelijke app getoond.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 9 && (
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-brand/10 bg-white p-4 space-y-4">
                    <div>
                      <div>
                        <p className="text-sm font-extrabold text-ink flex items-center gap-2">
                          <Phone size={16} className="text-brand" />
                          {wizardUi.contactTitle}
                        </p>
                        <p className="text-sm text-ink-soft mt-2 leading-6">
                          {wizardUi.contactIntro}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Field label={wizardUi.contactName}>
                        <input
                          className="input text-sm"
                          value={contact.name}
                          onChange={(e) =>
                            setContact((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder={`${name || "Mijn BnB"} host`}
                        />
                      </Field>
                      <Field label={wizardUi.contactAddress}>
                        <input
                          className="input text-sm"
                          value={contact.address}
                          onChange={(e) =>
                            setContact((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          placeholder={location || "Straat 1, Plaats"}
                        />
                      </Field>
                      <Field label={wizardUi.contactPhone}>
                        <div className="relative">
                          <Phone
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/45"
                          />
                          <input
                            className="input pl-10 text-sm"
                            value={contact.phone}
                            onChange={(e) =>
                              setContact((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="+31 6 12345678"
                          />
                        </div>
                      </Field>
                      <Field label={wizardUi.contactEmail}>
                        <div className="relative">
                          <Mail
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/45"
                          />
                          <input
                            className="input pl-10 text-sm"
                            value={contact.email}
                            onChange={(e) =>
                              setContact((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="host@voorbeeld.nl"
                          />
                        </div>
                      </Field>
                      <Field label={wizardUi.contactWhatsapp}>
                        <div className="relative">
                          <MessageCircle
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand/45"
                          />
                          <input
                            className="input pl-10 text-sm"
                            value={contact.whatsapp}
                            onChange={(e) =>
                              setContact((prev) => ({
                                ...prev,
                                whatsapp: e.target.value,
                              }))
                            }
                            placeholder="+31 6 12345678"
                          />
                        </div>
                      </Field>

                      <div className="md:col-span-2">
                        <MultilingualAiTextarea
                          label={wizardUi.contactNote}
                          value={contact.note}
                          placeholder="Stuur gerust een bericht als je hulp nodig hebt of vragen hebt over aankomst."
                          translations={contact.noteTranslations}
                          languages={languages}
                          defaultLanguage={defaultLanguage}
                          onChange={(value) =>
                            setContact((prev) => ({
                              ...prev,
                              note: value,
                              noteTranslations: {
                                ...prev.noteTranslations,
                                [defaultLanguage]: value,
                              },
                            }))
                          }
                          onImprove={() => runContactAi("improve")}
                          onTranslate={() => runContactAi("translate")}
                          improveLoading={aiLoading === "contact:improve"}
                          translateLoading={aiLoading === "contact:translate"}
                          improveLabel={ui.aiImprove}
                          translateLabel={ui.aiTranslate}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 10 && (
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-accent/20 bg-accent/5 p-4">
                    <p className="text-sm font-extrabold text-ink flex items-center gap-2">
                      <Sparkles size={16} className="text-accent" />
                      {wizardUi.settingsTitle}
                    </p>
                    <p className="text-sm text-ink-soft mt-2 leading-6">
                      {wizardUi.settingsIntro}
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4">
                    <ToggleCard
                      title={wizardUi.settingsButton}
                      enabled={appSettings.settingsEnabled}
                      onToggle={() =>
                        updateAppSettings({
                          settingsEnabled: !appSettings.settingsEnabled,
                        })
                      }
                    />
                    <ToggleCard
                      title={wizardUi.languageGate}
                      enabled={appSettings.languageGateEnabled}
                      onToggle={() =>
                        updateAppSettings({
                          languageGateEnabled: !appSettings.languageGateEnabled,
                        })
                      }
                    />
                    <ToggleCard
                      title={wizardUi.darkMode}
                      enabled={appSettings.defaultDarkMode}
                      onToggle={() =>
                        updateAppSettings({
                          defaultDarkMode: !appSettings.defaultDarkMode,
                        })
                      }
                    />
                    <ToggleCard
                      title={wizardUi.countdown}
                      enabled={appSettings.showCountdown}
                      onToggle={() =>
                        updateAppSettings({
                          showCountdown: !appSettings.showCountdown,
                        })
                      }
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Field label={wizardUi.textScale}>
                      <div className="rounded-2xl border border-brand/10 bg-white px-4 py-4">
                        <input
                          type="range"
                          min="0.9"
                          max="1.35"
                          step="0.05"
                          value={appSettings.defaultTextScale}
                          onChange={(e) =>
                            updateAppSettings({
                              defaultTextScale: Number(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <p className="text-sm font-bold text-ink mt-2">
                          {appSettings.defaultTextScale.toFixed(2)}x
                        </p>
                      </div>
                    </Field>
                    <Field label={wizardUi.arrivalDate}>
                      <input
                        type="date"
                        className="input text-sm"
                        value={appSettings.arrivalDate ?? ""}
                        onChange={(e) =>
                          updateAppSettings({ arrivalDate: e.target.value })
                        }
                      />
                    </Field>
                    <Field label={wizardUi.checkoutDate}>
                      <input
                        type="date"
                        className="input text-sm"
                        value={appSettings.checkoutDate ?? ""}
                        onChange={(e) =>
                          updateAppSettings({ checkoutDate: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                </div>
              )}

              {step === 11 && (
                <WizardStep12
                  name={name}
                  location={location}
                  category={category}
                  defaultLanguage={defaultLanguage}
                  languages={languages}
                  photos={photos}
                  stats={stats}
                  selectedLocations={selectedLocations}
                  wizardTheme={wizardTheme}
                  onUpdateTheme={setWizardTheme}
                  ui={ui}
                  wizardUi={wizardUi}
                />
              )}

              <div className="sticky bottom-3 z-20 mt-8 pt-4">
                <div className="flex items-center justify-between gap-3 rounded-[22px] border border-brand/10 bg-white/92 backdrop-blur px-4 py-3 shadow-[0_18px_40px_rgba(15,53,60,0.12)]">
                  <button
                    type="button"
                    onClick={() =>
                      setStep((prev) => Math.max(1, prev - 1) as WizardStep)
                    }
                    disabled={step === 1}
                    className="btn-secondary disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {ui.back}
                  </button>

                  {step < steps.length ? (
                    <button
                      type="button"
                      onClick={() =>
                        setStep(
                          (prev) =>
                            Math.min(steps.length, prev + 1) as WizardStep,
                        )
                      }
                      disabled={!canGoNext()}
                      className="btn-primary disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {ui.next}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateProject}
                      disabled={loading || !name.trim()}
                      className="btn-primary"
                    >
                      {loading
                        ? ui.creating
                        : editingProjectId
                          ? "Opslaan en terug naar editor"
                          : ui.finish}
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function AiActionButton({
  onClick,
  loading = false,
  label,
}: {
  onClick: () => void;
  loading?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 text-accent text-xs font-extrabold hover:bg-accent/15 transition-all"
    >
      <Wand2 size={14} />
      <Sparkles size={12} />
      {loading ? "AI bezig…" : label}
    </button>
  );
}

function AiActionGroup({
  onImprove,
  onTranslate,
  improveLoading = false,
  translateLoading = false,
  improveLabel,
  translateLabel,
}: {
  onImprove: () => void;
  onTranslate: () => void;
  improveLoading?: boolean;
  translateLoading?: boolean;
  improveLabel: string;
  translateLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <AiActionButton
        onClick={onImprove}
        loading={improveLoading}
        label={improveLabel}
      />
      <AiActionButton
        onClick={onTranslate}
        loading={translateLoading}
        label={translateLabel}
      />
    </div>
  );
}

function TranslationPreview({
  translations,
  languages,
}: {
  translations?: LocalizedTextMap;
  languages: Language[];
}) {
  if (!translations) return null;

  const available = languages.filter((lang) => translations[lang]?.trim());
  if (available.length === 0) return null;

  return (
    <div className="rounded-2xl border border-brand/10 bg-white/80 p-3 space-y-2">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand/60">
        Vertaalde varianten
      </p>
      <div className="grid gap-2">
        {available.map((lang) => (
          <div key={lang} className="rounded-xl bg-brand/5 px-3 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-brand/70">
              {lang.toUpperCase()}
            </p>
            <p className="text-xs text-ink-soft mt-1 leading-5">
              {translations[lang]}
            </p>
          </div>
        ))}
      </div>
      {available.length < languages.length && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          Vertalingen voor andere talen zijn nog niet bijgewerkt. Klik op{" "}
          <strong>AI vertalen</strong> om alle talen opnieuw te vullen.
        </p>
      )}
    </div>
  );
}

function MultilingualAiTextarea({
  label,
  value,
  placeholder,
  translations,
  languages,
  defaultLanguage,
  onChange,
  onImprove,
  onTranslate,
  improveLoading = false,
  translateLoading = false,
  improveLabel,
  translateLabel,
}: {
  label: string;
  value: string;
  placeholder: string;
  translations?: LocalizedTextMap;
  languages: Language[];
  defaultLanguage: Language;
  onChange: (value: string) => void;
  onImprove: () => void;
  onTranslate: () => void;
  improveLoading?: boolean;
  translateLoading?: boolean;
  improveLabel: string;
  translateLabel: string;
}) {
  return (
    <Field label={label}>
      <div className="rounded-[24px] border border-brand/10 bg-bg p-4 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <span
                key={lang}
                className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] ${
                  lang === defaultLanguage
                    ? "bg-brand text-white"
                    : "bg-white text-brand border border-brand/10"
                }`}
              >
                {lang}
              </span>
            ))}
          </div>

          <AiActionGroup
            onImprove={onImprove}
            onTranslate={onTranslate}
            improveLoading={improveLoading}
            translateLoading={translateLoading}
            improveLabel={improveLabel}
            translateLabel={translateLabel}
          />
        </div>

        <textarea
          rows={5}
          className="input text-sm resize-none min-h-[132px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />

        <div className="rounded-2xl border border-brand/10 bg-white p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand/60">
            {label}
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-soft whitespace-pre-line">
            {(translations?.[defaultLanguage] ?? value).trim() || placeholder}
          </p>
        </div>

        <TranslationPreview translations={translations} languages={languages} />
      </div>
    </Field>
  );
}

function MiniHint({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-brand/10 bg-white p-4">
      <p className="text-sm font-extrabold text-ink">{title}</p>
      <p className="text-sm text-ink-soft mt-2 leading-6">{text}</p>
    </div>
  );
}

// ─── Wizard Theme Presets ──────────────────────────────────────────────────────

const WIZARD_THEME_PRESETS: Array<{
  name: string;
  brand: string;
  accent: string;
  bg: string;
  bgSoft: string;
  ink: string;
  brandLight: string;
  radius: SiteTheme["radius"];
  font: SiteTheme["font"];
}> = [
  {
    name: "Zee",
    brand: "#145A63",
    brandLight: "#DFF0F3",
    accent: "#2CA87F",
    bg: "#F8FAF9",
    bgSoft: "#EEF6F8",
    ink: "#17313A",
    radius: "round",
    font: "outfit",
  },
  {
    name: "Olijf",
    brand: "#4A6741",
    brandLight: "#EDF3EC",
    accent: "#A67B5B",
    bg: "#F9FAF8",
    bgSoft: "#F0F4EF",
    ink: "#1E2820",
    radius: "soft",
    font: "outfit",
  },
  {
    name: "Terra",
    brand: "#9B4523",
    brandLight: "#F5EAE5",
    accent: "#D4875A",
    bg: "#FFFAF8",
    bgSoft: "#F7EDE7",
    ink: "#2E1A0E",
    radius: "soft",
    font: "playfair",
  },
  {
    name: "Marine",
    brand: "#1B3A5C",
    brandLight: "#E4EEF8",
    accent: "#4A90D9",
    bg: "#F8FAFC",
    bgSoft: "#EDF2F7",
    ink: "#1A2433",
    radius: "sharp",
    font: "inter",
  },
  {
    name: "Lavend.",
    brand: "#6B5B95",
    brandLight: "#F0EDF8",
    accent: "#B388FF",
    bg: "#FAFAF9",
    bgSoft: "#F2EEF8",
    ink: "#2D1B4E",
    radius: "round",
    font: "montserrat",
  },
  {
    name: "Koraal",
    brand: "#C75B7A",
    brandLight: "#FCEEF3",
    accent: "#F97316",
    bg: "#FFF9FA",
    bgSoft: "#FAEEF2",
    ink: "#2E0D18",
    radius: "round",
    font: "outfit",
  },
  {
    name: "Goud",
    brand: "#8B6914",
    brandLight: "#FDF6E3",
    accent: "#D4A017",
    bg: "#FFFEF9",
    bgSoft: "#FAF5E4",
    ink: "#2A1D05",
    radius: "soft",
    font: "playfair",
  },
  {
    name: "Antrac.",
    brand: "#2D3748",
    brandLight: "#EDF2F7",
    accent: "#68D391",
    bg: "#F7FAFC",
    bgSoft: "#E8EFF5",
    ink: "#1A202C",
    radius: "sharp",
    font: "inter",
  },
];

function WizardStep12({
  name,
  location,
  category,
  defaultLanguage,
  languages,
  photos,
  stats,
  selectedLocations,
  wizardTheme,
  onUpdateTheme,
  ui,
  wizardUi,
}: {
  name: string;
  location: string;
  category: WizardCategory;
  defaultLanguage: Language;
  languages: Language[];
  photos: WizardPhoto[];
  stats: { selectedFacilities: number };
  selectedLocations: WizardLocation[];
  wizardTheme: Partial<SiteTheme>;
  onUpdateTheme: (t: Partial<SiteTheme>) => void;
  ui: Record<string, unknown> & {
    appName: string;
    location: string;
    category: string;
    appLanguages: string;
    statsAmenities: string;
    statsSelected: string;
    statsRestaurants: string;
    statsActivities: string;
    autoAdded: string;
    autoItems: string[];
    finishHintTitle: string;
    finishHintText: string;
  };
  wizardUi: Record<string, unknown> & { photosTitle: string };
}) {
  // Effective preview theme = default + category-based + user override
  const [activeMiniPreviewTab, setActiveMiniPreviewTab] = useState<
    "welcome" | "house" | "photos" | "area" | "contact"
  >("welcome");

  const miniPreviewTabLabel: Record<
    "welcome" | "house" | "photos" | "area" | "contact",
    string
  > = {
    welcome: "Start",
    house: "Huis",
    photos: "Foto's",
    area: "Omgeving",
    contact: "Contact",
  };

  const CATEGORY_BRAND: Record<WizardCategory, string> = {
    bnb: "#145a63",
    vakantiehuis: "#2f6750",
    stadsgids: "#183f58",
    wellness: "#40676a",
    familie: "#28656c",
    natuur: "#305f50",
  };
  const CATEGORY_ACCENT: Record<WizardCategory, string> = {
    bnb: "#e67d4d",
    vakantiehuis: "#cf8654",
    stadsgids: "#d68f58",
    wellness: "#de8b73",
    familie: "#e58b55",
    natuur: "#cb8658",
  };
  const CATEGORY_BG: Record<WizardCategory, string> = {
    bnb: "#f8f4ec",
    vakantiehuis: "#f4f1e7",
    stadsgids: "#f5f0ea",
    wellness: "#f7f3ef",
    familie: "#f8f4ec",
    natuur: "#f3f1e7",
  };

  const effectiveBrand =
    wizardTheme.brand ?? CATEGORY_BRAND[category] ?? DEFAULT_THEME.brand;
  const effectiveAccent =
    wizardTheme.accent ?? CATEGORY_ACCENT[category] ?? DEFAULT_THEME.accent;
  const effectiveBg =
    wizardTheme.bg ?? CATEGORY_BG[category] ?? DEFAULT_THEME.bg;
  const effectiveInk = wizardTheme.ink ?? DEFAULT_THEME.ink;

  const activePreset = WIZARD_THEME_PRESETS.find(
    (p) =>
      p.brand.toLowerCase() === effectiveBrand.toLowerCase() &&
      p.accent.toLowerCase() === effectiveAccent.toLowerCase(),
  );

  const fontNames: Record<SiteTheme["font"], string> = {
    outfit: "Outfit",
    inter: "Inter",
    playfair: "Playfair",
    montserrat: "Montserrat",
    system: "Systeem",
  };
  const radiusNames: Record<SiteTheme["radius"], string> = {
    soft: "Zacht",
    round: "Rond",
    sharp: "Scherp",
  };

  return (
    <div className="space-y-6">
      {/* ── Thema kiezer ─────────────────────────────── */}
      <div className="rounded-[24px] border border-brand/10 bg-white p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-brand" />
          <h3 className="text-sm font-extrabold text-ink">
            Stijl & kleurthema
          </h3>
          {Object.keys(wizardTheme).length > 0 && (
            <button
              onClick={() => onUpdateTheme({})}
              className="ml-auto flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-brand transition-colors"
            >
              <RotateCcw size={10} /> Reset
            </button>
          )}
        </div>

        {/* Live mini phone preview */}
        <div className="flex gap-4 items-center">
          <div className="w-[140px] flex-shrink-0">
            <div
              className="rounded-[18px] overflow-hidden border-[3px] border-gray-800 shadow-xl"
              style={{ background: effectiveBg }}
            >
              {/* Topbar */}
              <div
                className="h-7 flex items-center justify-between px-2.5"
                style={{ background: effectiveBrand }}
              >
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                  <div className="w-10 h-1 rounded-full bg-white/35" />
                </div>
                <div
                  className="w-5 h-4 rounded-full"
                  style={{ background: effectiveAccent }}
                />
              </div>
              {/* Hero area */}
              <div
                className="h-14 relative flex items-end pb-1.5 px-2"
                style={{
                  background: `linear-gradient(160deg, ${effectiveBrand}cc, ${effectiveBrand}88)`,
                }}
              >
                <div className="space-y-0.5">
                  <div className="w-16 h-1.5 rounded-full bg-white/80" />
                  <div className="w-10 h-1 rounded-full bg-white/50" />
                </div>
              </div>
              {/* Content */}
              <div className="px-2 py-2 space-y-1.5">
                <div
                  className="rounded-lg p-1.5 space-y-1"
                  style={{ background: `${effectiveBrand}10` }}
                >
                  <div
                    className="w-16 h-1 rounded-full"
                    style={{ background: effectiveInk, opacity: 0.5 }}
                  />
                  <div
                    className="w-20 h-0.5 rounded-full"
                    style={{ background: effectiveInk, opacity: 0.3 }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div
                    className="rounded-lg h-5"
                    style={{ background: `${effectiveBrand}15` }}
                  />
                  <div
                    className="rounded-lg h-5"
                    style={{ background: `${effectiveAccent}20` }}
                  />
                </div>
              </div>
              {/* Tabbar */}
              <div className="px-2 py-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold text-ink-soft uppercase tracking-wider">
                    {miniPreviewTabLabel[activeMiniPreviewTab]}
                  </span>
                  <span className="text-[9px] font-extrabold text-ink-soft">
                    {activeMiniPreviewTab === 'photos'
                      ? `${photos.length} foto${photos.length === 1 ? '' : 's'}`
                      : activeMiniPreviewTab === 'area'
                      ? `${selectedLocations.length} plekken`
                      : activeMiniPreviewTab === 'contact'
                      ? location
                      : ''}
                  </span>
                </div>
                <div
                  className="rounded-lg p-1.5 space-y-1"
                  style={{ background: `${effectiveBrand}10` }}
                >
                  <div
                    className="w-16 h-1 rounded-full"
                    style={{ background: effectiveInk, opacity: 0.5 }}
                  />
                  <div
                    className="w-20 h-0.5 rounded-full"
                    style={{ background: effectiveInk, opacity: 0.3 }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div
                    className="rounded-lg h-5"
                    style={{ background: `${effectiveBrand}15` }}
                  />
                  <div
                    className="rounded-lg h-5"
                    style={{ background: `${effectiveAccent}20` }}
                  />
                </div>
              </div>
              {/* Tabbar */}
              <div
                className="h-11 border-t flex items-center justify-around px-1"
                style={{
                  borderColor: `${effectiveBrand}25`,
                  background: `${effectiveBg}f0`,
                }}
              >
                {(
                  ['welcome', 'house', 'photos', 'area', 'contact'] as const
                ).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveMiniPreviewTab(tab)}
                    className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[8px] font-extrabold transition-all ${
                      activeMiniPreviewTab === tab
                        ? 'text-brand'
                        : 'text-ink-soft hover:text-brand/70'
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded"
                      style={{
                        background:
                          activeMiniPreviewTab === tab
                            ? effectiveBrand
                            : `${effectiveInk}30`,
                      }}
                    />
                    <div
                      className="w-4 h-0.5 rounded-full"
                      style={{
                        background:
                          activeMiniPreviewTab === tab
                            ? effectiveBrand
                            : `${effectiveInk}25`,
                      }}
                    />
                    <span className="truncate">{miniPreviewTabLabel[tab]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                Actief thema
              </p>
              <p className="text-sm font-extrabold text-ink">
                {activePreset?.name ?? "Aangepast"}
              </p>
            </div>
            <div className="flex gap-1.5">
              {[effectiveBrand, effectiveAccent, effectiveBg, effectiveInk].map(
                (c) => (
                  <div
                    key={c}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ background: c }}
                    title={c}
                  />
                ),
              )}
            </div>
            <div className="text-[10px] text-ink-soft">
              <span className="font-bold">
                {fontNames[wizardTheme.font ?? "outfit"]}
              </span>
              {" · "}
              <span>{radiusNames[wizardTheme.radius ?? "round"]}</span>
            </div>
          </div>
        </div>

        {/* Preset raster */}
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">
            Kies een stijlpakket
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {WIZARD_THEME_PRESETS.map((preset) => {
              const isActive = activePreset?.name === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() =>
                    onUpdateTheme({
                      brand: preset.brand,
                      brandLight: preset.brandLight,
                      accent: preset.accent,
                      bg: preset.bg,
                      bgSoft: preset.bgSoft,
                      ink: preset.ink,
                      radius: preset.radius,
                      font: preset.font,
                    })
                  }
                  title={preset.name}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl border transition-all ${
                    isActive
                      ? "border-brand bg-brand/5 shadow-sm"
                      : "border-gray-100 bg-white hover:border-brand/20 hover:shadow-sm"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${preset.brand}, ${preset.accent})`,
                    }}
                  >
                    {isActive && <Check size={14} className="text-white" />}
                  </div>
                  <span
                    className={`text-[10px] font-bold leading-tight ${isActive ? "text-brand" : "text-ink-soft"}`}
                  >
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font + Radius controls */}
        <div className="grid sm:grid-cols-2 gap-4 pt-1 border-t border-gray-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Lettertype
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(
                ["outfit", "inter", "playfair", "montserrat", "system"] as const
              ).map((f) => (
                <button
                  key={f}
                  onClick={() => onUpdateTheme({ ...wizardTheme, font: f })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    (wizardTheme.font ?? "outfit") === f
                      ? "bg-brand text-white border-brand"
                      : "bg-white border-gray-200 text-ink-soft hover:border-brand/30"
                  }`}
                >
                  {fontNames[f]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Hoeken
            </p>
            <div className="flex gap-1.5">
              {(["sharp", "soft", "round"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => onUpdateTheme({ ...wizardTheme, radius: r })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    (wizardTheme.radius ?? "round") === r
                      ? "bg-brand text-white border-brand"
                      : "bg-white border-gray-200 text-ink-soft hover:border-brand/30"
                  }`}
                >
                  {radiusNames[r]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Samenvatting ───────────────────────────────── */}
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand/60 mb-3">
          Samenvatting
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <SummaryBox title={ui.appName} value={name} />
          <SummaryBox title={ui.location} value={location} />
          <SummaryBox
            title={ui.category}
            value={categoryCatalog[category][defaultLanguage].title}
          />
          <SummaryBox
            title={ui.appLanguages}
            value={languages.map((l) => l.toUpperCase()).join(", ")}
          />
          <SummaryBox
            title={ui.statsAmenities}
            value={String(stats.selectedFacilities)}
          />
          <SummaryBox
            title={ui.statsSelected}
            value={String(selectedLocations.length)}
          />
        </div>
        <div className="grid grid-cols-4 gap-3 mt-3">
          <SummaryBox
            title={wizardUi.photosTitle}
            value={String(photos.length)}
          />
          <SummaryBox
            title={ui.statsRestaurants}
            value={String(
              selectedLocations.filter((i) => i.category === "restaurant")
                .length,
            )}
          />
          <SummaryBox
            title={ui.statsActivities}
            value={String(
              selectedLocations.filter((i) => i.category === "tourism").length,
            )}
          />
          <SummaryBox
            title={ui.statsAmenities}
            value={String(
              selectedLocations.filter((i) => i.category === "shops").length,
            )}
          />
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-brand/10 bg-white px-4 py-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand/60">
        {label}
      </p>
      <p className="text-xl font-extrabold text-ink mt-1">{value}</p>
    </div>
  );
}

function SourceBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-brand/10 bg-white p-4">
      <p className="text-sm font-extrabold text-ink">{title}</p>
      <p className="text-sm text-ink-soft mt-2 leading-6">{text}</p>
    </div>
  );
}

function ToggleCard({
  title,
  enabled,
  onToggle,
}: {
  title: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-[22px] border px-4 py-4 text-left transition-all ${
        enabled
          ? "border-brand/20 bg-brand/5 shadow-sm"
          : "border-brand/10 bg-white hover:border-brand/20"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold text-ink">{title}</p>
        <span
          className={`inline-flex h-7 w-12 rounded-full p-1 transition-all ${enabled ? "bg-brand" : "bg-gray-200"}`}
        >
          <span
            className={`h-5 w-5 rounded-full bg-white transition-all ${enabled ? "translate-x-5" : "translate-x-0"}`}
          />
        </span>
      </div>
    </button>
  );
}

function SummaryBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-brand/10 bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand/60">
        {title}
      </p>
      <p className="text-sm font-bold text-ink mt-2">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand/70 block mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () =>
      reject(reader.error ?? new Error("Bestand kon niet worden gelezen."));
    reader.readAsDataURL(file);
  });
}

function formatSourceLabel(source: WizardSuggestion["source"]) {
  switch (source) {
    case "openstreetmap":
      return "OpenStreetMap";
    case "google-maps":
      return "Google Maps";
    case "tripadvisor":
      return "TripAdvisor";
    default:
      return "AI";
  }
}

function formatKindLabel(kind: WizardSuggestion["kind"], lang: Language) {
  const labels: Record<Language, Record<WizardSuggestion["kind"], string>> = {
    nl: {
      voorziening: "voorziening",
      restaurant: "restaurant",
      beleving: "activiteit",
      route: "route",
    },
    en: {
      voorziening: "service",
      restaurant: "restaurant",
      beleving: "activity",
      route: "route",
    },
    de: {
      voorziening: "service",
      restaurant: "restaurant",
      beleving: "aktivität",
      route: "route",
    },
    fr: {
      voorziening: "service",
      restaurant: "restaurant",
      beleving: "activité",
      route: "itinéraire",
    },
  };

  return labels[lang][kind];
}

function formatLocationCategoryLabel(
  category: LocationCategory,
  lang: Language,
) {
  const labels: Record<Language, Record<LocationCategory, string>> = {
    nl: { restaurant: "restaurant", tourism: "toerisme", shops: "winkels" },
    en: { restaurant: "restaurant", tourism: "tourism", shops: "shops" },
    de: { restaurant: "restaurant", tourism: "tourismus", shops: "läden" },
    fr: { restaurant: "restaurant", tourism: "tourisme", shops: "boutiques" },
  };

  return labels[lang][category];
}

function formatLocationFilterLabel(
  filter: LocationCategory | "all",
  lang: Language,
) {
  if (filter === "all") {
    return placeCopy[lang].filterAll;
  }

  if (filter === "restaurant") return placeCopy[lang].filterRestaurant;
  if (filter === "tourism") return placeCopy[lang].filterTourism;
  return placeCopy[lang].filterShops;
}

function formatDistanceKm(distance: number) {
  if (!Number.isFinite(distance)) return "—";
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

function getCategoryMarkerIcon(category: LocationCategory) {
  switch (category) {
    case "restaurant":
      return <UtensilsCrossed size={12} />;
    case "shops":
      return <ShoppingBag size={12} />;
    default:
      return <Landmark size={12} />;
  }
}

function getLocationFallbackImage(location: WizardLocation) {
  const seed = `${location.category}-${location.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  return `https://picsum.photos/seed/${seed}/900/650`;
}
