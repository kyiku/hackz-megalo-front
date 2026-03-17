'use client'

type FlashOverlayProps = {
  readonly trigger: number
}

function FlashElement() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 animate-[flash_200ms_ease-out_forwards] bg-white" />
  )
}

export function FlashOverlay({ trigger }: FlashOverlayProps) {
  if (trigger === 0) return null
  return <FlashElement key={trigger} />
}
