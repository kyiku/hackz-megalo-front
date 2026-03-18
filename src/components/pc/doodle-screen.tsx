'use client'

import { useCallback, useEffect, useState } from 'react'

import { DoodleEditor } from '@/components/doodle/doodle-editor'
import type { DoodleLayer } from '@/components/doodle/types'
import { ReceiptFrame } from '@/components/ui/receipt-frame'
import { useRoomStore } from '@/stores/room-store'
import { useWsStore } from '@/stores/ws-store'

export function DoodleScreen() {
  const { ws, send } = useWsStore()
  const roomId = useRoomStore((s) => s.roomId)
  const previewPhotos = useRoomStore((s) => s.previewPhotos)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [photoLayers, setPhotoLayers] = useState<Record<number, readonly DoodleLayer[]>>({})

  // Phone側からのdoodle_sync受信
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
          setCurrentPhotoIndex(idx)
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

  // PC側の描画変更をPhone側に同期
  const handleLayerChange = useCallback(
    (layers: readonly DoodleLayer[]) => {
      if (!roomId) return
      send('shooting_sync', {
        roomId,
        event: 'doodle_sync',
        photoIndex: currentPhotoIndex,
        layers: JSON.stringify(layers),
      })
    },
    [roomId, currentPhotoIndex, send],
  )

  const handleSave = useCallback(
    (layers: readonly DoodleLayer[]) => {
      setPhotoLayers((prev) => ({ ...prev, [currentPhotoIndex]: layers }))
      handleLayerChange(layers)
    },
    [currentPhotoIndex, handleLayerChange],
  )

  const handleCancel = useCallback(() => {
    // PC側のキャンセルは何もしない（共同編集なので）
  }, [])

  const currentPhoto = previewPhotos[currentPhotoIndex] ?? ''

  // 写真がまだ届いていない場合
  if (previewPhotos.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-8">
        <div className="w-full max-w-lg">
          <header className="mb-6 text-center">
            <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">STEP 03</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">落書き中</h2>
          </header>
          <ReceiptFrame className="px-6 py-5" showTornEdge={false}>
            <div className="receipt-text text-center">
              <p className="text-sm">写真を読み込み中...</p>
            </div>
          </ReceiptFrame>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* 写真選択タブ */}
        {previewPhotos.length > 1 && (
          <div className="mb-3 flex justify-center gap-2">
            {previewPhotos.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentPhotoIndex(index)}
                className={`rounded px-3 py-1 text-xs ${
                  currentPhotoIndex === index
                    ? 'bg-ink text-white'
                    : 'border border-cream-dark text-ink-light'
                }`}
              >
                {index + 1}枚目
              </button>
            ))}
          </div>
        )}

        {/* スマホと同じDoodleEditorコンポーネント */}
        <DoodleEditor
          photoSrc={currentPhoto}
          onSave={handleSave}
          onCancel={handleCancel}
          onLayerChange={handleLayerChange}
          initialLayers={photoLayers[currentPhotoIndex] ?? []}
        />
      </div>
    </div>
  )
}
