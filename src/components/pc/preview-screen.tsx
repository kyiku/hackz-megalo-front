'use client'

import Image from 'next/image'

import { ReceiptFrame } from '@/components/ui/receipt-frame'
import { useRoomStore } from '@/stores/room-store'

export function PreviewScreen() {
  const previewPhotos = useRoomStore((s) => s.previewPhotos)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="w-full max-w-md">
        <header className="mb-6 text-center">
          <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">STEP 03</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">プレビュー中</h2>
        </header>

        <ReceiptFrame className="px-6 py-5" showTornEdge={false}>
          {previewPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {previewPhotos.map((photo, index) => (
                <div key={index} className="relative aspect-[3/4] overflow-hidden border border-cream-dark">
                  <Image
                    src={photo}
                    alt={`${index + 1}枚目`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <span className="absolute top-1 left-1 bg-ink/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="receipt-text text-center">
              <p className="text-sm">スマホでプレビュー中...</p>
              <p className="mt-2 text-xs text-ink-light">撮り直しや落書きをしています</p>
            </div>
          )}
        </ReceiptFrame>
      </div>
    </div>
  )
}
