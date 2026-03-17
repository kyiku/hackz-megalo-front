'use client'

import type { ReactNode } from 'react'

type PageContainerProps = {
  readonly children: ReactNode
  readonly className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className={`mx-auto min-h-dvh w-full max-w-md px-4 py-6 ${className}`}>{children}</main>
  )
}
