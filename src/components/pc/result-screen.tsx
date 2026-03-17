'use client'

import Image from 'next/image'

import { ReceiptFrame } from '@/components/ui/receipt-frame'
import { useSessionStore } from '@/stores/session-store'

export function ResultScreen() {
  const { collageUrl, caption } = useSessionStore()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="w-full max-w-lg">
        <header className="mb-6 text-center">
          <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">
            *** RESULT ***
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">できた！</h2>
        </header>

        <ReceiptFrame className="px-5 py-5" showTornEdge={false}>
          <div className="relative aspect-square w-full border border-dashed border-cream-dark bg-cream-dark/20">
            {collageUrl ? (
              <Image src={collageUrl} alt="コラージュ" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="receipt-text text-center text-ink-light">
                  <p className="text-xs">[ コラージュ ]</p>
                  <p className="mt-1 text-[10px]">バックエンド接続後に表示</p>
                </div>
              </div>
            )}
          </div>

          {caption && (
            <div className="mt-4 border-t border-dashed border-ink-light/30 pt-3">
              <p className="receipt-text text-[10px] text-ink-light">CAPTION:</p>
              <p className="mt-1 text-center text-sm leading-relaxed">&quot;{caption}&quot;</p>
            </div>
          )}
        </ReceiptFrame>
      </div>
    </div>
  )
}
