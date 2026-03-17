'use client'

import { useSessionStore } from '@/stores/session-store'

export function ShootingScreen() {
  const { photos } = useSessionStore()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-8">
      {/* TODO: WebRTC映像をここに表示 */}
      <div className="relative aspect-video w-full max-w-3xl border border-white/10 bg-ink-light/20">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="font-mono text-sm text-white/30">[ WebRTC映像エリア ]</p>
            <p className="mt-1 font-mono text-xs text-white/20">バックエンド接続後に表示</p>
          </div>
        </div>

        {/* 撮影枚数 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={[
                  'h-3 w-3 rounded-full transition-all',
                  i < photos.length ? 'bg-white' : 'bg-white/20',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="font-mono text-lg text-white">
          {photos.length}/4 <span className="text-sm text-white/50">枚撮影済み</span>
        </p>
      </div>
    </div>
  )
}
