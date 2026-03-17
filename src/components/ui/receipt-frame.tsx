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
      className={`receipt-texture rounded-sm border border-cream-dark shadow-[2px_4px_12px_rgba(45,45,45,0.08)] ${showTornEdge ? 'receipt-torn-edge pb-6' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
