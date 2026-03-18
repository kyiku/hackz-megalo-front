'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

import { useRoomStore } from '@/stores/room-store'
import { useSessionStore } from '@/stores/session-store'
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

/** Resize a data URL image to a thumbnail for WebSocket transfer */
function resizeToThumbnail(dataUrl: string, maxWidth: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1)
      const width = Math.round(img.width * ratio)
      const height = Math.round(img.height * ratio)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export function usePhoneSync() {
  const pathname = usePathname()
  const { roomId, role } = useRoomStore()
  const { send, isConnected } = useWsStore()
  const photos = useSessionStore((s) => s.photos)

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

      // When entering preview or doodle, send photo thumbnails to PC
      if ((phase === 'preview' || phase === 'doodle') && photos.length > 0) {
        const sendPhotos = async () => {
          try {
            const thumbnails = await Promise.all(
              photos.map((photo) => resizeToThumbnail(photo, 200)),
            )
            send('shooting_sync', {
              roomId,
              event: 'photo_sync',
              photos: thumbnails,
            })
          } catch {
            // Silently fail if thumbnail generation fails
          }
        }
        void sendPhotos()
      }
    }
  }, [pathname, roomId, role, isConnected, send, photos])
}
