import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mijn-BnB Web Builder',
  description: 'Bouw je BnB gast-app direct in de browser',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}
