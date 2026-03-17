'use client'

import Image from 'next/image'

import { useSessionStore } from '@/stores/session-store'

export function ResultScreen() {
  const { collageUrl, caption } = useSessionStore()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-8">
      <div className="w-full max-w-lg">
        <div className="text-center">
          <p className="font-mono text-xs tracking-[0.3em] text-white/40">*** RESULT ***</p>
          <h2 className="mt-2 text-2xl font-bold text-white">できた！</h2>
        </div>

        {/* コラージュ */}
        <div className="relative mt-8 aspect-square w-full border border-white/10 bg-white/5">
          {collageUrl ? (
            <Image src={collageUrl} alt="コラージュ" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="font-mono text-sm text-white/30">[ コラージュ ]</p>
            </div>
          )}
        </div>

        {caption && (
          <div className="mt-4 border-t border-white/10 pt-4 text-center">
            <p className="font-mono text-xs text-white/40">CAPTION:</p>
            <p className="mt-1 text-lg text-white">&quot;{caption}&quot;</p>
          </div>
        )}
      </div>
    </div>
  )
}
