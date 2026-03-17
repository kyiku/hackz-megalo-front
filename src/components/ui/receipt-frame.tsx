'use client'

import type { ReactNode } from 'react'

type ReceiptFrameProps = {
  readonly children: ReactNode
  readonly className?: string
  readonly showTornEdge?: boolean
}

export function ReceiptFrame({
  children,
  className = '',
  showTornEdge = true,
}: ReceiptFrameProps) {
  return (
    <div
      className={`receipt-texture border border-cream-dark shadow-sm ${showTornEdge ? 'receipt-torn-edge pb-6' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
