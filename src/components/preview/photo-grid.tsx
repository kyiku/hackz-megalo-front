'use client'

import Image from 'next/image'

type PhotoGridProps = {
  readonly photos: readonly string[]
  readonly onRetake: (index: number) => void
}

export function PhotoGrid({ photos, onRetake }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {photos.map((photo, index) => (
        <div key={index} className="group relative aspect-[3/4] overflow-hidden rounded-lg border-2 border-cream-dark">
          <Image
            src={photo}
            alt={`撮影${index + 1}枚目`}
            fill
            className="object-cover"
            unoptimized
          />

          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-ink/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
            <button
              type="button"
              onClick={() => onRetake(index)}
              className="mb-2 rounded-full bg-cream px-3 py-1.5 text-xs font-bold text-ink shadow-md"
            >
              撮り直す
            </button>
          </div>

          <span className="absolute top-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-pink text-xs font-bold text-white">
            {index + 1}
          </span>
        </div>
      ))}
    </div>
  )
}
