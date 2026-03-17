'use client'

type FlashOverlayProps = {
  readonly trigger: number
}

function FlashElement() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-20 animate-[flash_200ms_ease-out_forwards] bg-white" />
      <style jsx>{`
        @keyframes flash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  )
}

export function FlashOverlay({ trigger }: FlashOverlayProps) {
  if (trigger === 0) return null
  return <FlashElement key={trigger} />
}
