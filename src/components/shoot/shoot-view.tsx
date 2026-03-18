'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { ArEffect } from '@/lib/ar-effects'

import type { PhoneArOverlayHandle } from './phone-ar-overlay'

import { StepIndicator } from '@/components/ui/step-indicator'
import { useCamera } from '@/hooks/use-camera'
import { useCountdown } from '@/hooks/use-countdown'
import { useVoiceCommand } from '@/hooks/use-voice-command'
import { useWebRtc } from '@/hooks/use-webrtc'
import { useYajiFrameUpload } from '@/hooks/use-yaji-frame-upload'
import { createSession } from '@/lib/api/sessions'
import { toApiFilterName } from '@/lib/filters'
import { useRoomStore } from '@/stores/room-store'
import { useSessionStore } from '@/stores/session-store'
import { useWsStore } from '@/stores/ws-store'

import { CountdownOverlay } from './countdown-overlay'
import { FlashOverlay } from './flash-overlay'
import { PhoneArOverlay } from './phone-ar-overlay'

const TOTAL_PHOTOS = 4

export function ShootView() {
  const router = useRouter()
  const { videoRef, isReady, error, capture, captureWithOverlay, stream } = useCamera()
  const arOverlayRef = useRef<PhoneArOverlayHandle>(null)
  const { filter, addPhoto, photos, startSession } = useSessionStore()
  const { roomId, setSessionId } = useRoomStore()
  const { ws, send } = useWsStore()
  const [flashTrigger, setFlashTrigger] = useState(0)
  const [isShooting, setIsShooting] = useState(false)
  const [yajiSessionId, setYajiSessionId] = useState<string | null>(null)
  const [externalEffect, setExternalEffect] = useState<ArEffect | null>(null)
  const isShootingRef = useRef(false)

  const photoCount = photos.length

  // WebRTCでカメラ映像をPCに送信
  useWebRtc({
    ws,
    roomId,
    role: 'phone',
    localStream: stream,
  })

  // PCからのARエフェクト同期を受信
  useEffect(() => {
    if (!ws) return

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: Record<string, unknown>
        }
        if (msg.type === 'shooting_sync' && msg.data.event === 'ar_sync') {
          const effect = msg.data.effect as ArEffect | null
          setExternalEffect(effect ?? null)
        }
      } catch {
        // パースエラーは無視
      }
    }

    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [ws])

  // やじフレーム自動アップロード（撮影中のみ）
  useYajiFrameUpload({
    sessionId: yajiSessionId,
    videoRef,
    isActive: isShooting,
  })

  const sendSync = useCallback(
    (event: string, extra?: Record<string, unknown>) => {
      if (!roomId) return
      send('shooting_sync', { roomId, event, ...extra })
    },
    [roomId, send],
  )

  // Phone側のARエフェクト変更をPC側に送信
  const onPhoneEffectChange = useCallback(
    (effect: ArEffect | null) => {
      sendSync('ar_sync', { effect })
    },
    [sendSync],
  )

  const onCountdownTick = useCallback(
    (value: number) => sendSync('countdown', { count: value }),
    [sendSync],
  )

  const { count, isRunning, start: startCountdown } = useCountdown({ onTick: onCountdownTick })

  const shootSequence = useCallback(async () => {
    if (isShootingRef.current || !filter) return
    isShootingRef.current = true
    setIsShooting(true)

    // セッションを先行作成（やじコメント用 + 後で処理に再利用）
    try {
      const session = await createSession({
        filterType: filter.type,
        filter: toApiFilterName(filter.value),
        photoCount: TOTAL_PHOTOS,
      })
      setYajiSessionId(session.sessionId)
      setSessionId(session.sessionId)
      const sessionAny = session as Record<string, unknown>
      startSession(
        session.sessionId,
        session.uploadUrls,
        sessionAny.downloadCode as string | undefined,
        sessionAny.claycodeUploadUrl as string | undefined,
      )
      sendSync('shooting_start', {
        totalPhotos: TOTAL_PHOTOS,
        sessionId: session.sessionId,
      })
    } catch {
      // セッション作成失敗時もやじなしで撮影は継続
      sendSync('shooting_start', { totalPhotos: TOTAL_PHOTOS })
    }

    for (let i = photoCount; i < TOTAL_PHOTOS; i++) {
      // カウントダウン開始をPC側に同期
      sendSync('countdown', { photoIndex: i, count: 3 })

      await startCountdown(3)

      const overlayCanvas = arOverlayRef.current?.getCanvas() ?? null
      const dataUrl = captureWithOverlay(overlayCanvas) ?? capture()
      if (dataUrl) {
        addPhoto(dataUrl)
        setFlashTrigger((prev) => prev + 1)
        sendSync('shutter', { photoIndex: i, photoCount: i + 1 })
      }

      if (i < TOTAL_PHOTOS - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    }

    setIsShooting(false)
    sendSync('shooting_complete')
    isShootingRef.current = false
    router.push('/doodle')
  }, [photoCount, startCountdown, capture, captureWithOverlay, addPhoto, router, sendSync, filter, setSessionId, startSession])

  // 音声コマンドで撮影開始（「撮って」「チーズ」等）
  useVoiceCommand({
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
        <PhoneArOverlay ref={arOverlayRef} videoRef={videoRef} isActive={isReady} externalEffect={externalEffect} onEffectChange={onPhoneEffectChange} />
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

      </div>
    </div>
  )
}
