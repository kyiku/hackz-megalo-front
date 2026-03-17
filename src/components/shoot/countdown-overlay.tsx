'use client'

type CountdownOverlayProps = {
  readonly count: number | null
}

export function CountdownOverlay({ count }: CountdownOverlayProps) {
  if (count === null || count <= 0) return null

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <div className="font-mono text-[120px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        {count}
      </div>
    </div>
  )
}
