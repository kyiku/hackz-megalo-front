'use client'

import type { ReactNode } from 'react'

import { usePhoneSync } from '@/hooks/use-phone-sync'

export function PhoneSyncProvider({ children }: { readonly children: ReactNode }) {
  usePhoneSync()
  return <>{children}</>
}
