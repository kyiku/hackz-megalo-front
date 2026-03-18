import { Dela_Gothic_One, Space_Mono } from 'next/font/google'

export const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const delaGothicOne = Dela_Gothic_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dela-gothic',
  display: 'swap',
})
