'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { WsEvent } from '@/lib/api/types'

type UseWebSocketReturn = {
  readonly isConnected: boolean
  readonly subscribe: (sessionId: string) => void
  readonly sendMessage: (action: string, data: Record<string, unknown>) => void
}

type UseWebSocketOptions = {
  readonly url: string
  readonly onEvent: (event: WsEvent) => void
}

export function useWebSocket({ url, onEvent }: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!url) return

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.addEventListener('open', () => {
      setIsConnected(true)
    })

    ws.addEventListener('message', (event) => {
      try {
        const parsed = JSON.parse(event.data as string) as WsEvent
        onEventRef.current(parsed)
      } catch {
        // ignore non-JSON messages
      }
    })

    ws.addEventListener('close', () => {
      setIsConnected(false)
    })

    ws.addEventListener('error', () => {
      setIsConnected(false)
    })

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [url])

  const subscribe = useCallback((sessionId: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(JSON.stringify({
      action: 'subscribe',
      data: { sessionId },
    }))
  }, [])

  const sendMessage = useCallback((action: string, data: Record<string, unknown>) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(JSON.stringify({ action, data }))
  }, [])

  return { isConnected, subscribe, sendMessage }
}
