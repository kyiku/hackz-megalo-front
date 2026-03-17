import { Dela_Gothic_One, IBM_Plex_Mono, Zen_Maru_Gothic } from 'next/font/google'

export const zenMaruGothic = Zen_Maru_Gothic({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-zen-maru',
  display: 'swap',
})

export const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-mono',
  display: 'swap',
})

export const delaGothicOne = Dela_Gothic_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dela-gothic',
  display: 'swap',
})
