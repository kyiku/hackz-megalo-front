'use client'

import { useSessionStore } from '@/stores/session-store'

export function ShootingScreen() {
  const { photos } = useSessionStore()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="w-full max-w-3xl">
        <header className="mb-6 text-center">
          <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">STEP 02</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">撮影中</h2>
        </header>

        {/* TODO: WebRTC映像をここに表示 */}
        <div className="aspect-video w-full border border-cream-dark bg-cream-dark/20">
          <div className="flex h-full items-center justify-center">
            <div className="receipt-text text-center text-ink-light">
              <p className="text-sm">[ WebRTC映像エリア ]</p>
              <p className="mt-1 text-[10px]">バックエンド接続後に表示</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={[
                'h-3 w-3 rounded-full transition-all',
                i < photos.length ? 'bg-ink' : 'bg-cream-dark',
              ].join(' ')}
            />
          ))}
          <p className="receipt-text ml-2 text-sm text-ink-light">
            {photos.length}/4 枚撮影済み
          </p>
        </div>
      </div>
    </div>
  )
}
