'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import Image from 'next/image'

import { DoodleCanvas } from '@/components/doodle/doodle-canvas'
import { DoodleEditor } from '@/components/doodle/doodle-editor'
import type { DoodleLayer } from '@/components/doodle/types'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'
import { compositePhotoWithLayers } from '@/lib/composite-doodle'
import { useRoomStore } from '@/stores/room-store'
import { useSessionStore } from '@/stores/session-store'
import { useWsStore } from '@/stores/ws-store'

export default function DoodlePage() {
  const router = useRouter()
  const { photos, replacePhoto, sessionId } = useSessionStore()
  const { roomId, sessionId: roomSessionId } = useRoomStore()
  const { ws, send } = useWsStore()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [photoLayers, setPhotoLayers] = useState<Record<number, readonly DoodleLayer[]>>({})
  const [isCompositing, setIsCompositing] = useState(false)

  // PC側からのdoodle_sync受信（共同編集）
  useEffect(() => {
    if (!ws) return

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: { event?: string; photoIndex?: number; layers?: string }
        }
        if (msg.type === 'shooting_sync' && msg.data.event === 'doodle_sync') {
          const idx = msg.data.photoIndex ?? 0
          if (msg.data.layers) {
            const parsed = JSON.parse(msg.data.layers) as DoodleLayer[]
            setPhotoLayers((prev) => ({ ...prev, [idx]: parsed }))
          }
        }
      } catch {
        // ignore
      }
    }

    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [ws])

  // レイヤー変更をPCに同期 + ローカルstate更新
  const handleLayersChange = useCallback(
    (layers: readonly DoodleLayer[]) => {
      if (editingIndex === null) return
      setPhotoLayers((prev) => ({ ...prev, [editingIndex]: layers }))
      if (roomId) {
        send('shooting_sync', {
          roomId,
          event: 'doodle_sync',
          photoIndex: editingIndex,
          layers: JSON.stringify(layers),
        })
      }
    },
    [editingIndex, roomId, send],
  )

  const handleSave = useCallback(
    (layers: readonly DoodleLayer[]) => {
      if (editingIndex === null) return
      setPhotoLayers((prev) => ({ ...prev, [editingIndex]: layers }))
      setEditingIndex(null)
    },
    [editingIndex],
  )

  const handleCancel = useCallback(() => {
    setEditingIndex(null)
  }, [])

  // 編集中の写真インデックスをPCに通知
  useEffect(() => {
    if (editingIndex === null || !roomId) return
    send('shooting_sync', {
      roomId,
      event: 'doodle_sync',
      photoIndex: editingIndex,
      layers: JSON.stringify(photoLayers[editingIndex] ?? []),
    })
  }, [editingIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDone = useCallback(async () => {
    setIsCompositing(true)
    try {
      const compositePromises = Object.entries(photoLayers).map(
        async ([indexStr, layers]) => {
          const index = parseInt(indexStr, 10)
          const photo = photos[index]
          if (!photo || layers.length === 0) return

          const composited = await compositePhotoWithLayers(photo, layers)
          replacePhoto(index, composited)
        },
      )

      await Promise.all(compositePromises)
    } catch {
      // compositing失敗時もそのまま進む
    }
    const resolvedSessionId = sessionId ?? roomSessionId
    router.push(`/processing/${resolvedSessionId ?? 'demo'}`)
  }, [photoLayers, photos, replacePhoto, router, sessionId, roomSessionId])

  if (photos.length === 0) {
    router.replace('/filter')
    return null
  }

  // 個別編集モード
  if (editingIndex !== null) {
    const photo = photos[editingIndex]
    if (!photo) return null

    return (
      <DoodleEditor
        photoSrc={photo}
        layers={photoLayers[editingIndex] ?? []}
        onLayersChange={handleLayersChange}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    )
  }

  // 写真選択モード
  return (
    <PageContainer className="flex flex-col gap-6">
      <header>
        <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">STEP 03</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">落書きしよう</h1>
        <p className="mt-0.5 text-xs text-ink-light">写真をタップして落書きできるよ</p>
      </header>

      <div className="grid grid-cols-2 gap-1.5">
        {photos.map((photo, index) => {
          const hasLayers = (photoLayers[index]?.length ?? 0) > 0
          return (
            <button
              key={index}
              type="button"
              onClick={() => setEditingIndex(index)}
              className="group relative aspect-[3/4] overflow-hidden border border-cream-dark"
            >
              {hasLayers ? (
                <DoodleCanvas photoSrc={photo} layers={photoLayers[index] ?? []} />
              ) : (
                <Image
                  src={photo}
                  alt={`${index + 1}枚目`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-ink/0 transition-all group-hover:bg-ink/20 group-active:bg-ink/20">
                <span className="bg-cream px-2 py-1 text-xs font-bold text-ink opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
                  落書きする
                </span>
              </div>
              <span className="absolute top-1 left-1 bg-ink/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                {index + 1}
              </span>
              {hasLayers && (
                <span className="absolute top-1 right-1 bg-pink px-1.5 py-0.5 text-[10px] font-bold text-white">
                  編集済
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={handleDone} disabled={isCompositing}>
          {isCompositing ? '処理中...' : 'OK! 印刷する'}
        </Button>
      </div>
    </PageContainer>
  )
}
