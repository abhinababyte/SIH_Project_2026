import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display, Source_Sans_3, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  display: 'swap',
})
export const metadata: Metadata = {
  title: 'HillShield - Flash Flood Early Warning System',
  description:
    'Live hillside flash flood risk levels, hazard map, active alerts, evacuation routes, and community incident reporting.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  icons: {
    icon: '/HillShield.png',
    apple: '/HillShield.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef4fb' },
    { media: '(prefers-color-scheme: dark)', color: '#141c2b' },
  ],
}

import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { SimulationProvider } from "@/components/simulation-provider"
import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${playfair.variable} ${sourceSans.variable} ${ibmPlexMono.variable} antialiased overflow-x-hidden bg-[#070b14]`}>
        <SimulationProvider>
          {children}
        </SimulationProvider>
        <ServiceWorkerRegister />
        <Toaster theme="dark" position="top-center" richColors closeButton offset="80px" expand={true} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
