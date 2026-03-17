'use client'

import { useEffect, useRef } from 'react'

import { useSessionStore } from '@/stores/session-store'

import { YajiComment } from './yaji-comment'

type ShootingScreenProps = {
  readonly remoteStream: MediaStream | null
  readonly wsRef: React.RefObject<WebSocket | null>
  readonly countdownValue: number | null
  readonly lastShutterIndex: number | null
  readonly iceState: string | null
}

export function ShootingScreen({
  remoteStream,
  wsRef,
  countdownValue,
  lastShutterIndex,
  iceState,
}: ShootingScreenProps) {
  const { photos } = useSessionStore()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !remoteStream) return
    video.srcObject = remoteStream
    video.play().catch((err) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to play remote video:', err)
      }
    })
  }, [remoteStream])

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-8">
      <header className="mb-4 text-center">
        <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">STEP 02</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">撮影中</h2>
      </header>

      <div className="relative aspect-video w-full max-w-3xl border border-cream-dark overflow-hidden">
        {remoteStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-cream-dark/20">
            <div className="receipt-text text-center text-ink-light">
              <p className="text-sm">カメラ映像を待機中...</p>
              {iceState && (
                <p className="mt-1 font-mono text-[10px]">ICE: {iceState}</p>
              )}
            </div>
          </div>
        )}

        {/* ICE接続状態（デバッグ用） */}
        {iceState && iceState !== 'connected' && iceState !== 'completed' && (
          <div className="absolute bottom-1 left-1 font-mono text-[10px] text-ink-light/50">
            ICE: {iceState}
          </div>
        )}

        {/* カウントダウン */}
        {countdownValue !== null && countdownValue > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[120px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              {countdownValue}
            </span>
          </div>
        )}

        {/* シャッターフラッシュ */}
        {lastShutterIndex !== null && (
          <div key={lastShutterIndex} className="absolute inset-0 animate-[flash_200ms_ease-out_forwards] bg-white" />
        )}

        {/* やじコメント */}
        <YajiComment wsRef={wsRef} />
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
  )
}
