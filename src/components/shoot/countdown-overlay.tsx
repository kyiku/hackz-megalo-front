'use client'

type CountdownOverlayProps = {
  readonly count: number | null
}

export function CountdownOverlay({ count }: CountdownOverlayProps) {
  if (count === null || count <= 0) return null

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <div className="pukkuri-text animate-bounce font-display text-[120px] text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
        {count}
      </div>
    </div>
  )
}
