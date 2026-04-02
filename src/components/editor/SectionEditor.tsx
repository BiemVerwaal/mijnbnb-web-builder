'use client'

import type { Section, SiteData, HeroData, QuickLinksData, HouseInfoData, PhotosData, AreaData, RestaurantsData, BookingData, ContactData } from '@/types'
import { X, Plus, Trash2 } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import AppIcon from '@/components/ui/AppIcon'

interface SectionEditorProps {
  section: Section
  siteData: SiteData
  onUpdate: (data: Section['data']) => void
  onClose: () => void
}

export default function SectionEditor({ section, siteData, onUpdate, onClose }: SectionEditorProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <h3 className="font-extrabold text-sm text-ink">{sectionLabel(section.type)}</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all">
          <X size={15} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {section.type === 'hero' && (
          <HeroEditor data={section.data as HeroData} onUpdate={onUpdate} />
        )}
        {section.type === 'quick-links' && (
          <QuickLinksEditor data={section.data as QuickLinksData} onUpdate={onUpdate} />
        )}
        {section.type === 'house-info' && (
          <HouseInfoEditor data={section.data as HouseInfoData} onUpdate={onUpdate} />
        )}
        {section.type === 'photos' && (
          <PhotosEditor data={section.data as PhotosData} onUpdate={onUpdate} />
        )}
        {section.type === 'area' && (
          <AreaEditor data={section.data as AreaData} onUpdate={onUpdate} />
        )}
        {section.type === 'restaurants' && (
          <RestaurantsEditor data={section.data as RestaurantsData} onUpdate={onUpdate} />
        )}
        {section.type === 'booking' && (
          <BookingEditor data={section.data as BookingData} onUpdate={onUpdate} />
        )}
        {section.type === 'contact' && (
          <ContactEditor data={section.data as ContactData} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  )
}

// ─── Hero Editor ───────────────────────────────────────────────────────────────

function HeroEditor({ data, onUpdate }: { data: HeroData; onUpdate: (d: Section['data']) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Afbeeldings-URL (hero)">
        <input
          className="input text-xs"
          placeholder="https://..."
          value={data.images[0] ?? ''}
          onChange={e => onUpdate({ ...data, images: e.target.value ? [e.target.value] : [] })}
        />
      </Field>
      <Field label="Aankomstdatum tonen">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.showCountdown}
            onChange={e => onUpdate({ ...data, showCountdown: e.target.checked })}
            className="w-4 h-4 accent-brand"
          />
          <span className="text-xs text-ink-soft">Countdown tonen</span>
        </label>
      </Field>
      {data.showCountdown && (
        <>
          <Field label="Aankomstdatum">
            <input type="date" className="input text-xs" value={data.arrivalDate ?? ''} onChange={e => onUpdate({ ...data, arrivalDate: e.target.value })} />
          </Field>
          <Field label="Vertrekdatum">
            <input type="date" className="input text-xs" value={data.checkoutDate ?? ''} onChange={e => onUpdate({ ...data, checkoutDate: e.target.value })} />
          </Field>
        </>
      )}
    </div>
  )
}

// ─── Quick Links Editor ───────────────────────────────────────────────────────

function QuickLinksEditor({ data, onUpdate }: { data: QuickLinksData; onUpdate: (d: Section['data']) => void }) {
  function updateLink(id: string, key: string, value: string) {
    onUpdate({ ...data, links: data.links.map(l => l.id === id ? { ...l, [key]: value } : l) })
  }
  function removeLink(id: string) {
    onUpdate({ ...data, links: data.links.filter(l => l.id !== id) })
  }
  function addLink() {
    onUpdate({ ...data, links: [...data.links, { id: uuid(), icon: 'fa-star', label: 'Link', url: '' }] })
  }

  return (
    <div className="space-y-3">
      {data.links.map(link => (
        <div key={link.id} className="p-3 rounded-xl border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft">{link.label || 'Link'}</span>
            <button onClick={() => removeLink(link.id)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
          <input className="input text-xs" placeholder="Label" value={link.label} onChange={e => updateLink(link.id, 'label', e.target.value)} />
          <input className="input text-xs" placeholder="fa-icon-name (bijv. fa-wifi)" value={link.icon} onChange={e => updateLink(link.id, 'icon', e.target.value)} />
          <select className="input text-xs" value={link.action ?? ''} onChange={e => updateLink(link.id, 'action', e.target.value)}>
            <option value="">Geen interne actie</option>
            <option value="house">Ga naar Huisinfo</option>
            <option value="photos">Ga naar Foto&apos;s</option>
            <option value="area">Ga naar Omgeving</option>
            <option value="info">Ga naar Info</option>
            <option value="settings">Open instellingen</option>
            <option value="language">Open taalkeuze</option>
          </select>
          <input className="input text-xs" placeholder="URL (optioneel)" value={link.url ?? ''} onChange={e => updateLink(link.id, 'url', e.target.value)} />
        </div>
      ))}
      <button onClick={addLink} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-brand/20 text-brand text-xs font-bold hover:border-brand/40 hover:bg-brand/3 transition-all">
        <Plus size={13} /> Link toevoegen
      </button>
    </div>
  )
}

// ─── House Info Editor ────────────────────────────────────────────────────────

function HouseInfoEditor({ data, onUpdate }: { data: HouseInfoData; onUpdate: (d: Section['data']) => void }) {
  function updateSection(id: string, key: string, value: string) {
    onUpdate({ ...data, sections: data.sections.map(s => s.id === id ? { ...s, [key]: value } : s) })
  }
  function removeSection(id: string) {
    onUpdate({ ...data, sections: data.sections.filter(s => s.id !== id) })
  }
  function addSection() {
    onUpdate({ ...data, sections: [...data.sections, { id: uuid(), icon: 'info', title: 'Nieuw item', body: '' }] })
  }

  return (
    <div className="space-y-3">
      <Field label="Omslagfoto URL">
        <input className="input text-xs" placeholder="https://..." value={data.coverImage ?? ''} onChange={e => onUpdate({ ...data, coverImage: e.target.value })} />
      </Field>

      <p className="text-xs font-bold text-ink-soft">Secties</p>
      {data.sections.map(sec => (
        <div key={sec.id} className="p-3 rounded-xl border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/8 text-brand">
                <AppIcon name={sec.icon || 'house'} className="h-3.5 w-3.5" />
              </span>
              {sec.title}
            </span>
            <button onClick={() => removeSection(sec.id)} className="p-1 text-red-400 hover:text-red-600">
              <Trash2 size={12} />
            </button>
          </div>
          <div className="flex gap-2">
            <input className="input text-xs w-24" placeholder="house" value={sec.icon} onChange={e => updateSection(sec.id, 'icon', e.target.value)} />
            <input className="input text-xs flex-1" placeholder="Titel" value={sec.title} onChange={e => updateSection(sec.id, 'title', e.target.value)} />
          </div>
          <textarea className="input text-xs resize-none" rows={3} placeholder="Tekst..." value={sec.body} onChange={e => updateSection(sec.id, 'body', e.target.value)} />
        </div>
      ))}
      <button onClick={addSection} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-brand/20 text-brand text-xs font-bold hover:border-brand/40 hover:bg-brand/3 transition-all">
        <Plus size={13} /> Sectie toevoegen
      </button>
    </div>
  )
}

// ─── Photos Editor ────────────────────────────────────────────────────────────

function PhotosEditor({ data, onUpdate }: { data: PhotosData; onUpdate: (d: Section['data']) => void }) {
  function updatePhoto(id: string, key: string, value: string) {
    onUpdate({ ...data, images: data.images.map(img => img.id === id ? { ...img, [key]: value } : img) })
  }
  function removePhoto(id: string) {
    onUpdate({ ...data, images: data.images.filter(img => img.id !== id) })
  }
  function addPhoto() {
    onUpdate({ ...data, images: [...data.images, { id: uuid(), url: '', caption: '' }] })
  }

  return (
    <div className="space-y-3">
      {data.images.map(img => (
        <div key={img.id} className="p-3 rounded-xl border border-gray-200 space-y-2">
          {img.url && <img src={img.url} alt={img.caption ?? ''} className="w-full h-24 object-cover rounded-lg" />}
          <div className="flex gap-2 items-center">
            <input className="input text-xs flex-1" placeholder="Afbeeldings-URL" value={img.url} onChange={e => updatePhoto(img.id, 'url', e.target.value)} />
            <button onClick={() => removePhoto(img.id)} className="p-1.5 text-red-400 hover:text-red-600 flex-shrink-0">
              <Trash2 size={12} />
            </button>
          </div>
          <input className="input text-xs" placeholder="Bijschrift (optioneel)" value={img.caption ?? ''} onChange={e => updatePhoto(img.id, 'caption', e.target.value)} />
        </div>
      ))}
      <button onClick={addPhoto} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-brand/20 text-brand text-xs font-bold hover:border-brand/40 hover:bg-brand/3 transition-all">
        <Plus size={13} /> Foto toevoegen
      </button>
    </div>
  )
}

// ─── Area Editor ──────────────────────────────────────────────────────────────

function AreaEditor({ data, onUpdate }: { data: AreaData; onUpdate: (d: Section['data']) => void }) {
  function addTip() {
    onUpdate({ ...data, tips: [...data.tips, { id: uuid(), emoji: 'map', category: '', title: 'Nieuw tip', description: '', distance: '', openingHours: '', contact: '', url: '', counter: 0, photo: '' }] })
  }
  function updateTip(id: string, key: string, value: string | number) {
    onUpdate({ ...data, tips: data.tips.map(t => t.id === id ? { ...t, [key]: value } : t) })
  }
  function removeTip(id: string) {
    onUpdate({ ...data, tips: data.tips.filter(t => t.id !== id) })
  }

  return (
    <div className="space-y-3">
      <Field label="Google Maps embed URL">
        <input className="input text-xs" placeholder="https://maps.google.com/..." value={data.mapUrl ?? ''} onChange={e => onUpdate({ ...data, mapUrl: e.target.value })} />
      </Field>
      <p className="text-xs font-bold text-ink-soft">Tips</p>
      {data.tips.map(tip => (
        <div key={tip.id} className="p-3 rounded-xl border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/8 text-brand">
                <AppIcon name={tip.emoji || 'map'} className="h-3.5 w-3.5" />
              </span>
              {tip.title}
            </span>
            <button onClick={() => removeTip(tip.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
          </div>
          <div className="flex gap-2">
            <input className="input text-xs w-24" placeholder="map" value={tip.emoji} onChange={e => updateTip(tip.id, 'emoji', e.target.value)} />
            <input className="input text-xs flex-1" placeholder="Naam" value={tip.title} onChange={e => updateTip(tip.id, 'title', e.target.value)} />
          </div>
          <textarea className="input text-xs resize-none" rows={2} placeholder="Beschrijving" value={tip.description} onChange={e => updateTip(tip.id, 'description', e.target.value)} />
          <input className="input text-xs" placeholder="Foto-URL" value={tip.photo ?? ''} onChange={e => updateTip(tip.id, 'photo', e.target.value)} />
          <input className="input text-xs" placeholder="Openingstijden" value={tip.openingHours ?? ''} onChange={e => updateTip(tip.id, 'openingHours', e.target.value)} />
          <input className="input text-xs" placeholder="Contactinformatie" value={tip.contact ?? ''} onChange={e => updateTip(tip.id, 'contact', e.target.value)} />
          <input className="input text-xs" placeholder="Afstand (bijv. 5 min lopen)" value={tip.distance ?? ''} onChange={e => updateTip(tip.id, 'distance', e.target.value)} />
          <input className="input text-xs" placeholder="Google Maps-link of URL" value={tip.url ?? ''} onChange={e => updateTip(tip.id, 'url', e.target.value)} />
          <input className="input text-xs" type="number" min={0} placeholder="Teller" value={tip.counter ?? 0} onChange={e => updateTip(tip.id, 'counter', Number(e.target.value) || 0)} />
        </div>
      ))}
      <button onClick={addTip} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-brand/20 text-brand text-xs font-bold hover:border-brand/40 transition-all">
        <Plus size={13} /> Tip toevoegen
      </button>
    </div>
  )
}

// ─── Restaurants Editor ───────────────────────────────────────────────────────

function RestaurantsEditor({ data, onUpdate }: { data: RestaurantsData; onUpdate: (d: Section['data']) => void }) {
  function addItem() {
    onUpdate({ ...data, items: [...data.items, { id: uuid(), name: 'Restaurant', description: '', emoji: 'utensils', tags: [], openingHours: '', contact: '', url: '', counter: 0, photo: '' }] })
  }
  function updateItem(id: string, key: string, value: string | number | string[]) {
    onUpdate({ ...data, items: data.items.map(item => item.id === id ? { ...item, [key]: value } : item) })
  }
  function removeItem(id: string) {
    onUpdate({ ...data, items: data.items.filter(item => item.id !== id) })
  }

  return (
    <div className="space-y-3">
      {data.items.map(item => (
        <div key={item.id} className="p-3 rounded-xl border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/8 text-brand">
                <AppIcon name={item.emoji || 'utensils'} className="h-3.5 w-3.5" />
              </span>
              {item.name}
            </span>
            <button onClick={() => removeItem(item.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
          </div>
          <div className="flex gap-2">
            <input className="input text-xs w-24" placeholder="utensils" value={item.emoji} onChange={e => updateItem(item.id, 'emoji', e.target.value)} />
            <input className="input text-xs flex-1" placeholder="Naam" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} />
          </div>
          <textarea className="input text-xs resize-none" rows={2} placeholder="Beschrijving" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
          <input className="input text-xs" placeholder="Foto-URL" value={item.photo ?? ''} onChange={e => updateItem(item.id, 'photo', e.target.value)} />
          <input className="input text-xs" placeholder="Openingstijden" value={item.openingHours ?? ''} onChange={e => updateItem(item.id, 'openingHours', e.target.value)} />
          <input className="input text-xs" placeholder="Contactinformatie" value={item.contact ?? ''} onChange={e => updateItem(item.id, 'contact', e.target.value)} />
          <input className="input text-xs" placeholder="Google Maps-link of URL" value={item.url ?? ''} onChange={e => updateItem(item.id, 'url', e.target.value)} />
          <input className="input text-xs" type="number" min={0} placeholder="Teller" value={item.counter ?? 0} onChange={e => updateItem(item.id, 'counter', Number(e.target.value) || 0)} />
          <input className="input text-xs" placeholder="Tags (kommagescheiden)" value={item.tags.join(', ')} onChange={e => updateItem(item.id, 'tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} />
        </div>
      ))}
      <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-brand/20 text-brand text-xs font-bold hover:border-brand/40 transition-all">
        <Plus size={13} /> Restaurant toevoegen
      </button>
    </div>
  )
}

// ─── Booking Editor ───────────────────────────────────────────────────────────

function BookingEditor({ data, onUpdate }: { data: BookingData; onUpdate: (d: Section['data']) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Promotie tonen">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.showPromo} onChange={e => onUpdate({ ...data, showPromo: e.target.checked })} className="w-4 h-4 accent-brand" />
          <span className="text-xs text-ink-soft">Promotie tonen</span>
        </label>
      </Field>
      {data.showPromo && (
        <>
          <Field label="Promotietekst">
            <textarea className="input text-xs resize-none" rows={2} value={data.promoText ?? ''} onChange={e => onUpdate({ ...data, promoText: e.target.value })} />
          </Field>
          <Field label="Boek-URL">
            <input className="input text-xs" placeholder="https://..." value={data.bookingUrl ?? ''} onChange={e => onUpdate({ ...data, bookingUrl: e.target.value })} />
          </Field>
        </>
      )}
    </div>
  )
}

// ─── Contact Editor ───────────────────────────────────────────────────────────

function ContactEditor({ data, onUpdate }: { data: ContactData; onUpdate: (d: Section['data']) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Naam"><input className="input text-xs" value={data.name ?? ''} onChange={e => onUpdate({ ...data, name: e.target.value })} /></Field>
      <Field label="Telefoon"><input className="input text-xs" type="tel" value={data.phone ?? ''} onChange={e => onUpdate({ ...data, phone: e.target.value })} /></Field>
      <Field label="E-mail"><input className="input text-xs" type="email" value={data.email ?? ''} onChange={e => onUpdate({ ...data, email: e.target.value })} /></Field>
      <Field label="WhatsApp nummer"><input className="input text-xs" value={data.whatsapp ?? ''} onChange={e => onUpdate({ ...data, whatsapp: e.target.value })} /></Field>
      <Field label="Adres"><textarea className="input text-xs resize-none" rows={2} value={data.address ?? ''} onChange={e => onUpdate({ ...data, address: e.target.value })} /></Field>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  )
}

function sectionLabel(type: Section['type']): string {
  const l: Record<string, string> = {
    hero: 'Hero banner', 'quick-links': 'Snelle links', 'house-info': 'Huisinfo',
    photos: "Foto's", area: 'Omgeving', restaurants: 'Restaurants',
    booking: 'Boeken', contact: 'Contact', 'custom-text': 'Eigen tekst', spacer: 'Ruimte',
  }
  return l[type] ?? type
}
