'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { StepIndicator } from '@/components/ui/step-indicator'
import { useCamera } from '@/hooks/use-camera'
import { useCountdown } from '@/hooks/use-countdown'
import { useRoomStore } from '@/stores/room-store'
import { useSessionStore } from '@/stores/session-store'

import { CountdownOverlay } from './countdown-overlay'
import { FlashOverlay } from './flash-overlay'

const TOTAL_PHOTOS = 4
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? ''

export function ShootView() {
  const router = useRouter()
  const { videoRef, isReady, error, capture, stream } = useCamera()
  const { count, isRunning, start: startCountdown } = useCountdown()
  const { filter, addPhoto, photos } = useSessionStore()
  const { roomId } = useRoomStore()
  const [flashTrigger, setFlashTrigger] = useState(0)
  const isShootingRef = useRef(false)
  const wsRef = useRef<WebSocket | null>(null)

  const photoCount = photos.length

  // WebSocket接続 + WebRTC映像送信
  useEffect(() => {
    if (!WS_URL || !roomId) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { roomId, role: 'phone' },
      }))
    })

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [roomId])

  // WebRTCでカメラ映像をPCに送信
  useEffect(() => {
    if (!stream || !roomId || !wsRef.current) return

    const ws = wsRef.current
    if (ws.readyState !== WebSocket.OPEN) return

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    stream.getTracks().forEach((track) => pc.addTrack(track, stream))

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({
          action: 'webrtc_ice',
          data: { roomId, candidate: JSON.stringify(event.candidate) },
        }))
      }
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: { sdp?: string; candidate?: string }
        }
        if (msg.type === 'webrtc_answer' && msg.data.sdp) {
          void pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: msg.data.sdp }))
        }
        if (msg.type === 'webrtc_ice' && msg.data.candidate) {
          const candidate = JSON.parse(msg.data.candidate) as RTCIceCandidateInit
          void pc.addIceCandidate(new RTCIceCandidate(candidate))
        }
      } catch { /* ignore */ }
    }

    ws.addEventListener('message', handleMessage)

    const startOffer = async () => {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      ws.send(JSON.stringify({
        action: 'webrtc_offer',
        data: { roomId, sdp: offer.sdp },
      }))
    }

    void startOffer()

    return () => {
      ws.removeEventListener('message', handleMessage)
      pc.close()
    }
  }, [stream, roomId])

  const sendSync = useCallback(
    (event: string, extra?: Record<string, unknown>) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN || !roomId) return
      ws.send(JSON.stringify({
        action: 'shooting_sync',
        data: { roomId, event, ...extra },
      }))
    },
    [roomId],
  )

  const shootSequence = useCallback(async () => {
    if (isShootingRef.current) return
    isShootingRef.current = true

    sendSync('shooting_start', { totalPhotos: TOTAL_PHOTOS })

    for (let i = photoCount; i < TOTAL_PHOTOS; i++) {
      // カウントダウン送信
      for (let c = 3; c > 0; c--) {
        sendSync('countdown', { photoIndex: i, count: c })
      }

      await startCountdown(3)

      const dataUrl = capture()
      if (dataUrl) {
        addPhoto(dataUrl)
        setFlashTrigger((prev) => prev + 1)
        sendSync('shutter', { photoIndex: i })
      }

      if (i < TOTAL_PHOTOS - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    }

    sendSync('shooting_complete')
    isShootingRef.current = false
    router.push('/preview')
  }, [photoCount, startCountdown, capture, addPhoto, router, sendSync])

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
      </div>
    </div>
  )
}
