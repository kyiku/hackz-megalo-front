'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useShootingSync } from '@/hooks/use-shooting-sync'
import { useWebRtc } from '@/hooks/use-webrtc'
import { useRoomStore } from '@/stores/room-store'

import { CompleteScreen } from './complete-screen'
import { FilterScreen } from './filter-screen'
import { IdleScreen } from './idle-screen'
import { ProcessingScreen } from './processing-screen'
import { ResultScreen } from './result-screen'
import { ShootingScreen } from './shooting-screen'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? ''

export function PcView() {
  const { roomId, phase, createRoom, setPhase, setPhoneConnected } = useRoomStore()
  const wsRef = useRef<WebSocket | null>(null)
  const [countdownValue, setCountdownValue] = useState<number | null>(null)
  const [lastShutterIndex, setLastShutterIndex] = useState<number | null>(null)

  // ルーム作成
  useEffect(() => {
    if (!roomId) {
      createRoom()
    }
  }, [roomId, createRoom])

  // WebSocket接続
  useEffect(() => {
    if (!roomId || !WS_URL) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.addEventListener('open', () => {
      // ルーム参加
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { roomId, role: 'pc' },
      }))
    })

    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: Record<string, unknown>
        }

        // スマホが参加したらフェーズ遷移
        if (msg.type === 'shooting_sync') {
          const syncEvent = msg.data.event as string
          if (syncEvent === 'shooting_start') {
            setPhase('shooting')
            setPhoneConnected(true)
          }
          if (syncEvent === 'shooting_complete') {
            setPhase('preview')
          }
        }
      } catch {
        // ignore
      }
    })

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [roomId, setPhase, setPhoneConnected])

  // WebRTC（PC側：受信のみ）
  const { remoteStream } = useWebRtc({
    wsRef,
    roomId,
    role: 'pc',
  })

  // WebRTC接続確立でフェーズ遷移
  useEffect(() => {
    if (remoteStream && phase === 'idle') {
      setPhase('filter-select')
      setPhoneConnected(true)
    }
  }, [remoteStream, phase, setPhase, setPhoneConnected])

  // 撮影イベント受信
  const handleShootingEvent = useCallback(
    (data: { event: string; count?: number; photoIndex?: number }) => {
      if (data.event === 'countdown' && data.count !== undefined) {
        setCountdownValue(data.count)
      }
      if (data.event === 'shutter') {
        setCountdownValue(null)
        setLastShutterIndex(data.photoIndex ?? null)
      }
      if (data.event === 'shooting_start') {
        setPhase('shooting')
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
    case 'preview':
      return (
        <ShootingScreen
          remoteStream={remoteStream}
          wsRef={wsRef}
          countdownValue={countdownValue}
          lastShutterIndex={lastShutterIndex}
        />
      )
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
