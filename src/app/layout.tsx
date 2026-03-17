import type { Metadata, Viewport } from 'next'

import { PhoneSyncProvider } from '@/components/phone-sync-provider'
import { delaGothicOne, ibmPlexMono, zenMaruGothic } from '@/lib/fonts'

import './globals.css'

export const metadata: Metadata = {
  title: 'Receipt Purikura | レシートプリクラ',
  description: 'サーマルレシートプリンターで白黒レトロ写真を印刷するプリクラ体験',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body
        className={`${zenMaruGothic.variable} ${ibmPlexMono.variable} ${delaGothicOne.variable} antialiased`}
      >
        <PhoneSyncProvider>{children}</PhoneSyncProvider>
      </body>
    </html>
  )
}
