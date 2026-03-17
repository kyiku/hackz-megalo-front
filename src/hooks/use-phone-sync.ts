'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

import { useRoomStore } from '@/stores/room-store'

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ?? '').trim()

const PATH_TO_PHASE: Record<string, string> = {
  '/filter': 'filter-select',
  '/shoot': 'shooting',
  '/preview': 'preview',
  '/doodle': 'preview',
  '/processing': 'processing',
  '/result': 'result',
}

function getPhaseFromPath(pathname: string): string | null {
  for (const [path, phase] of Object.entries(PATH_TO_PHASE)) {
    if (pathname.startsWith(path)) return phase
  }
  return null
}

export function usePhoneSync() {
  const pathname = usePathname()
  const { roomId, role } = useRoomStore()
  const wsRef = useRef<WebSocket | null>(null)

  // スマホ側のみ: WebSocket接続してフェーズ通知を送る
  useEffect(() => {
    if (role !== 'phone' || !roomId || !WS_URL) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { roomId, role: 'phone' },
      }))

      // 現在のフェーズを即送信
      const phase = getPhaseFromPath(pathname)
      if (phase) {
        ws.send(JSON.stringify({
          action: 'shooting_sync',
          data: { roomId, event: 'phase_change', phase },
        }))
      }
    })

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [roomId, role, pathname])

  // パス変更時にフェーズ通知
  useEffect(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !roomId || role !== 'phone') return

    const phase = getPhaseFromPath(pathname)
    if (phase) {
      ws.send(JSON.stringify({
        action: 'shooting_sync',
        data: { roomId, event: 'phase_change', phase },
      }))
    }
  }, [pathname, roomId, role])
}
