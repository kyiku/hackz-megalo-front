'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { useRoomStore } from '@/stores/room-store'
import { useWsStore } from '@/stores/ws-store'

const PATH_TO_PHASE: Record<string, string> = {
  '/filter': 'filter-select',
  '/shoot': 'shooting',
  '/preview': 'preview',
  '/doodle': 'doodle',
  '/processing': 'processing',
  '/result': 'result',
}

function getPhaseFromPath(pathname: string): string | null {
  for (const [path, phase] of Object.entries(PATH_TO_PHASE)) {
    if (pathname.startsWith(path)) return phase
  }
  return null
}

function getSessionIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/(processing|result|download)\/(.+)/)
  return match?.[2] ?? null
}

export function usePhoneSync() {
  const pathname = usePathname()
  const { roomId, role } = useRoomStore()
  const { send, isConnected } = useWsStore()

  useEffect(() => {
    if (role !== 'phone' || !roomId || !isConnected) return

    const phase = getPhaseFromPath(pathname)
    if (phase) {
      const sessionId = getSessionIdFromPath(pathname)
      send('shooting_sync', {
        roomId,
        event: 'phase_change',
        phase,
        ...(sessionId ? { sessionId } : {}),
      })
    }
  }, [pathname, roomId, role, isConnected, send])
}
