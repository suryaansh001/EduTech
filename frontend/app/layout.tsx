import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EdTech',
  description: 'EdTech with Sury',
  generator: 'tech.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
