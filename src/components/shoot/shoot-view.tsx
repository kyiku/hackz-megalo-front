'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'

import { StepIndicator } from '@/components/ui/step-indicator'
import { useCamera } from '@/hooks/use-camera'
import { useCountdown } from '@/hooks/use-countdown'
import { useVoiceCommand } from '@/hooks/use-voice-command'
import { useWebRtc } from '@/hooks/use-webrtc'
import { useRoomStore } from '@/stores/room-store'
import { useSessionStore } from '@/stores/session-store'
import { useWsStore } from '@/stores/ws-store'

import { CountdownOverlay } from './countdown-overlay'
import { FlashOverlay } from './flash-overlay'

const TOTAL_PHOTOS = 4

export function ShootView() {
  const router = useRouter()
  const { videoRef, isReady, error, capture, stream } = useCamera()
  const { count, isRunning, start: startCountdown } = useCountdown()
  const { filter, addPhoto, photos } = useSessionStore()
  const { roomId } = useRoomStore()
  const { ws, send } = useWsStore()
  const [flashTrigger, setFlashTrigger] = useState(0)
  const isShootingRef = useRef(false)

  const photoCount = photos.length

  // WebRTCでカメラ映像をPCに送信
  useWebRtc({
    ws,
    roomId,
    role: 'phone',
    localStream: stream,
  })

  const sendSync = useCallback(
    (event: string, extra?: Record<string, unknown>) => {
      if (!roomId) return
      send('shooting_sync', { roomId, event, ...extra })
    },
    [roomId, send],
  )

  const shootSequence = useCallback(async () => {
    if (isShootingRef.current) return
    isShootingRef.current = true

    sendSync('shooting_start', { totalPhotos: TOTAL_PHOTOS })

    for (let i = photoCount; i < TOTAL_PHOTOS; i++) {
      sendSync('countdown', { photoIndex: i, count: 3 })

      await startCountdown(3)

      const dataUrl = capture()
      if (dataUrl) {
        addPhoto(dataUrl)
        setFlashTrigger((prev) => prev + 1)
        sendSync('shutter', { photoIndex: i, photoCount: i + 1 })
      }

      if (i < TOTAL_PHOTOS - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    }

    sendSync('shooting_complete')
    isShootingRef.current = false
    router.push('/preview')
  }, [photoCount, startCountdown, capture, addPhoto, router, sendSync])

  // 音声コマンドで撮影開始（「撮って」「チーズ」等）
  const { isSupported: voiceSupported } = useVoiceCommand({
    isActive: isReady && !isRunning && photoCount < TOTAL_PHOTOS,
    onTrigger: shootSequence,
  })

  if (!filter) {
    router.replace('/filter')
    return null
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
        <p className="receipt-text text-sm font-bold text-red">{error}</p>
        <button
          type="button"
          className="text-sm text-ink-light underline"
          onClick={() => router.replace('/filter')}
        >
          戻る
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
            aria-label="撮影開始"
            onClick={shootSequence}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/90 bg-white/20 transition-transform active:scale-90"
          >
            <div className="h-12 w-12 rounded-full bg-white" />
          </button>
        )}

        {isRunning && (
          <p className="animate-pulse font-mono text-sm text-white/60">撮影中...</p>
        )}

        {voiceSupported && !isRunning && photoCount < TOTAL_PHOTOS && (
          <p className="font-mono text-[10px] text-white/40">
            「撮って」「チーズ」で撮影開始
          </p>
        )}
      </div>
    </div>
  )
}
