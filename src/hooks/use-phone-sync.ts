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

      // doodleフェーズに入ったら写真サムネイルをPCに送信
      if (phase === 'doodle') {
        const sendPhotos = async () => {
          // photosが空の場合は最大3回リトライ
          for (let attempt = 0; attempt < 3; attempt++) {
            const currentPhotos = useSessionStore.getState().photos
            if (currentPhotos.length > 0) {
              try {
                const thumbnails = await Promise.all(
                  currentPhotos.map((photo) => resizeToThumbnail(photo, 200)),
                )
                send('shooting_sync', {
                  roomId,
                  event: 'photo_sync',
                  photos: thumbnails,
                })
              } catch {
                // サムネイル生成失敗は無視
              }
              return
            }
            await new Promise((r) => setTimeout(r, 500))
          }
        }
        void sendPhotos()
      }
    }
  }, [pathname, roomId, role, isConnected, send, photos])
}
