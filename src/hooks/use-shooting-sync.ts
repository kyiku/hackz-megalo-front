'use client'

import { useCallback, useEffect, useRef } from 'react'

type ShootingEvent = 'shooting_start' | 'countdown' | 'shutter' | 'shooting_complete'

type ShootingSyncData = {
  readonly event: ShootingEvent
  readonly sessionId?: string
  readonly totalPhotos?: number
  readonly photoIndex?: number
  readonly count?: number
}

type UseShootingSyncOptions = {
  readonly wsRef: React.RefObject<WebSocket | null>
  readonly roomId: string | null
  readonly onEvent?: (data: ShootingSyncData) => void
}

type UseShootingSyncReturn = {
  readonly sendEvent: (data: ShootingSyncData) => void
}

export function useShootingSync({
  wsRef,
  roomId,
  onEvent,
}: UseShootingSyncOptions): UseShootingSyncReturn {
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const sendEvent = useCallback(
    (data: ShootingSyncData) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN || !roomId) return

      ws.send(JSON.stringify({
        action: 'shooting_sync',
        data: { ...data, roomId },
      }))
    },
    [wsRef, roomId],
  )

  useEffect(() => {
    const ws = wsRef.current
    if (!ws || !roomId) return

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: ShootingSyncData
        }

        if (msg.type === 'shooting_sync') {
          onEventRef.current?.(msg.data)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to parse shooting sync:', err)
        }
      }
    }

    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [wsRef, roomId])

  return { sendEvent }
}
