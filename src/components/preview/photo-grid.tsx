'use client'

import Image from 'next/image'

type PhotoGridProps = {
  readonly photos: readonly string[]
  readonly onRetake: (index: number) => void
}

export function PhotoGrid({ photos, onRetake }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {photos.map((photo, index) => (
        <div key={index} className="group relative aspect-[3/4] overflow-hidden border border-cream-dark">
          <Image
            src={photo}
            alt={`撮影${index + 1}枚目`}
            fill
            className="object-cover"
            unoptimized
          />

          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-ink/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
            <button
              type="button"
              onClick={() => onRetake(index)}
              className="mb-2 bg-cream px-3 py-1 text-xs font-bold text-ink"
            >
              撮り直す
            </button>
          </div>

          <span className="absolute top-1 left-1 bg-ink/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
            {index + 1}
          </span>
        </div>
      ))}
    </div>
  )
}
