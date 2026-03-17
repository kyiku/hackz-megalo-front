'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { StepIndicator } from '@/components/ui/step-indicator'
import { useCamera } from '@/hooks/use-camera'
import { useCountdown } from '@/hooks/use-countdown'
import { useSessionStore } from '@/stores/session-store'

import { CountdownOverlay } from './countdown-overlay'
import { FlashOverlay } from './flash-overlay'

const TOTAL_PHOTOS = 4

export function ShootView() {
  const router = useRouter()
  const { videoRef, isReady, error, capture } = useCamera()
  const { count, isRunning, start: startCountdown } = useCountdown()
  const { filter, addPhoto, photos } = useSessionStore()
  const [flashTrigger, setFlashTrigger] = useState(0)
  const isShootingRef = useRef(false)

  const photoCount = photos.length

  const shootSequence = useCallback(async () => {
    if (isShootingRef.current) return
    isShootingRef.current = true

    for (let i = photoCount; i < TOTAL_PHOTOS; i++) {
      await startCountdown(3)

      const dataUrl = capture()
      if (dataUrl) {
        addPhoto(dataUrl)
        setFlashTrigger((prev) => prev + 1)
      }

      if (i < TOTAL_PHOTOS - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    }

    isShootingRef.current = false
    router.push('/preview')
  }, [photoCount, startCountdown, capture, addPhoto, router])

  useEffect(() => {
    if (!filter) {
      router.replace('/filter')
    }
  }, [filter, router])

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-4xl">📷</p>
        <p className="font-bold text-red">{error}</p>
        <button
          type="button"
          className="text-sm text-pink underline"
          onClick={() => router.replace('/filter')}
        >
          フィルター選択に戻る
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink">
      <div className="relative flex-1">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />
        <CountdownOverlay count={count} />
        <FlashOverlay trigger={flashTrigger} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 bg-ink/80 px-6 py-5 backdrop-blur-sm">
        <StepIndicator current={photoCount} total={TOTAL_PHOTOS} />

        <p className="font-mono text-sm text-white/80">
          {photoCount}/{TOTAL_PHOTOS} 枚撮影済み
        </p>

        {isReady && !isRunning && photoCount < TOTAL_PHOTOS && (
          <button
            type="button"
            onClick={shootSequence}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-pink shadow-[0_0_20px_rgba(255,107,157,0.5)] transition-transform active:scale-90"
          >
            <div className="h-12 w-12 rounded-full bg-white" />
          </button>
        )}

        {isRunning && (
          <p className="animate-pulse font-bold text-pink-light">撮影中...</p>
        )}
      </div>
    </div>
  )
}
