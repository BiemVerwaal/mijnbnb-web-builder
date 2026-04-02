import Link from 'next/link'
import AppIcon from '@/components/ui/AppIcon'

export default function MadeByBiemSoft({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <Link
      href="https://biemsoft.nl"
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-2 rounded-full border border-brand/10 bg-white/85 text-brand shadow-[0_10px_24px_rgba(20,90,99,0.06)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-brand/20 hover:bg-white ${compact ? 'px-3 py-1.5 text-[11px] font-extrabold' : 'px-4 py-2 text-xs font-extrabold'} ${className}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/8 text-brand">
        <AppIcon name="building" className="h-3.5 w-3.5" />
      </span>
      <span>
        Gemaakt door
        {' '}
        <span className="text-ink">BiemSoft Ammerstol</span>
      </span>
    </Link>
  )
}
