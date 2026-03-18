'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useShootingSync } from '@/hooks/use-shooting-sync'
import { useWebRtc } from '@/hooks/use-webrtc'
import { useRoomStore } from '@/stores/room-store'
import { useWsStore } from '@/stores/ws-store'

import { CompleteScreen } from './complete-screen'
import { FilterScreen } from './filter-screen'
import { IdleScreen } from './idle-screen'
import { PreviewScreen } from './preview-screen'
import { ProcessingScreen } from './processing-screen'
import { ResultScreen } from './result-screen'
import { ShootingScreen } from './shooting-screen'

export function PcView() {
  const { roomId, phase, createRoom, setPhase, setPhoneConnected, setSelectedFilter, setSessionId } = useRoomStore()
  const { ws, connect } = useWsStore()
  const wsRef = useRef<WebSocket | null>(null)
  const [countdownValue, setCountdownValue] = useState<number | null>(null)
  const [lastShutterIndex, setLastShutterIndex] = useState<number | null>(null)
  const [pcPhotoCount, setPcPhotoCount] = useState(0)
  const initializedRef = useRef(false)

  // ルーム作成 + WebSocket接続（1回だけ実行）
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const id = roomId ?? createRoom()
    connect(id, 'pc')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // wsRef を ws に同期（useShootingSync互換のため残す）
  useEffect(() => {
    wsRef.current = ws
  }, [ws])

  // WebRTC（PC側：受信のみ）
  const { remoteStream, iceState } = useWebRtc({
    ws,
    roomId,
    role: 'pc',
  })

  // WebSocketメッセージリスナー
  useEffect(() => {
    if (!ws) return

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: Record<string, unknown>
        }

        if (msg.type === 'shooting_sync') {
          const syncEvent = msg.data.event as string

          if (syncEvent === 'phase_change') {
            const newPhase = msg.data.phase as string
            if (['filter-select', 'shooting', 'preview', 'processing', 'result'].includes(newPhase)) {
              setPhase(newPhase as Parameters<typeof setPhase>[0])
              setPhoneConnected(true)
            }
            const sid = msg.data.sessionId as string | undefined
            if (sid) {
              setSessionId(sid)
            }
          }

          if (syncEvent === 'filter_select') {
            const filterId = msg.data.filterId as string
            if (filterId) {
              setSelectedFilter(filterId)
            }
          }

          // shooting_start/shooting_complete は useShootingSync 経由の
          // handleShootingEvent で処理（重複防止）
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to parse WebSocket message:', err)
        }
      }
    }

    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [ws, setPhase, setPhoneConnected, setSelectedFilter, setSessionId])

  // 撮影イベント受信
  const handleShootingEvent = useCallback(
    (data: { event: string; count?: number; photoIndex?: number; photoCount?: number }) => {
      if (data.event === 'countdown' && data.count !== undefined) {
        setCountdownValue(data.count)
      }
      if (data.event === 'shutter') {
        setCountdownValue(null)
        setLastShutterIndex(data.photoIndex ?? null)
        if (data.photoCount !== undefined) {
          setPcPhotoCount(data.photoCount)
        }
      }
      if (data.event === 'shooting_start') {
        setPhase('shooting')
        setPcPhotoCount(0)
      }
      if (data.event === 'shooting_complete') {
        setCountdownValue(null)
        setPhase('preview')
      }
    },
    [setPhase],
  )

  useShootingSync({
    wsRef,
    roomId,
    onEvent: handleShootingEvent,
  })

  if (!roomId) return null

  switch (phase) {
    case 'idle':
      return <IdleScreen roomId={roomId} />
    case 'filter-select':
      return <FilterScreen />
    case 'shooting':
      return (
        <ShootingScreen
          remoteStream={remoteStream}
          wsRef={wsRef}
          countdownValue={countdownValue}
          lastShutterIndex={lastShutterIndex}
          iceState={iceState}
          photoCount={pcPhotoCount}
        />
      )
    case 'preview':
      return <PreviewScreen />
    case 'processing':
      return <ProcessingScreen />
    case 'result':
      return <ResultScreen />
    case 'complete':
      return <CompleteScreen />
    default:
      return <IdleScreen roomId={roomId} />
  }
}
