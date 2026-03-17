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

  // WebSocket接続（再接続ロジック付き）
  useEffect(() => {
    if (!roomId || !WS_URL) return

    let reconnectAttempts = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const connect = () => {
      if (cancelled) return

      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.addEventListener('open', () => {
        reconnectAttempts = 0
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

          if (msg.type === 'shooting_sync') {
            const syncEvent = msg.data.event as string

            // スマホからのフェーズ通知
            if (syncEvent === 'phase_change') {
              const newPhase = msg.data.phase as string
              if (['filter-select', 'shooting', 'preview', 'processing', 'result'].includes(newPhase)) {
                setPhase(newPhase as Parameters<typeof setPhase>[0])
                setPhoneConnected(true)
              }
            }

            if (syncEvent === 'shooting_start') {
              setPhase('shooting')
              setPhoneConnected(true)
            }
            if (syncEvent === 'shooting_complete') {
              setPhase('preview')
            }
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to parse WebSocket message:', err)
          }
        }
      })

      ws.addEventListener('close', () => {
        if (cancelled) return
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
        reconnectAttempts += 1
        reconnectTimer = setTimeout(connect, delay)
      })

      ws.addEventListener('error', () => {
        ws.close()
      })
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [roomId, setPhase, setPhoneConnected])

  // WebRTC（PC側：受信のみ）
  const { remoteStream } = useWebRtc({
    wsRef,
    roomId,
    role: 'pc',
  })

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
