'use client'

import { useEffect, useState } from 'react'

type FlashOverlayProps = {
  readonly trigger: number
}

export function FlashOverlay({ trigger }: FlashOverlayProps) {
  const [isFlashing, setIsFlashing] = useState(false)

  useEffect(() => {
    if (trigger === 0) return

    setIsFlashing(true)
    const timer = setTimeout(() => setIsFlashing(false), 150)
    return () => clearTimeout(timer)
  }, [trigger])

  if (!isFlashing) return null

  return <div className="absolute inset-0 z-20 bg-white opacity-80" />
}
