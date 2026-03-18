'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { DoodleCanvas } from '@/components/doodle/doodle-canvas'
import type { DoodleLayer, PenColor, PenSize } from '@/components/doodle/types'
import { PEN_COLORS, PEN_SIZES } from '@/components/doodle/types'
import { ReceiptFrame } from '@/components/ui/receipt-frame'
import { useRoomStore } from '@/stores/room-store'
import { useWsStore } from '@/stores/ws-store'

export function DoodleScreen() {
  const { ws, send } = useWsStore()
  const roomId = useRoomStore((s) => s.roomId)
  const previewPhotos = useRoomStore((s) => s.previewPhotos)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [layers, setLayers] = useState<readonly DoodleLayer[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [penColor, setPenColor] = useState<PenColor>('#e05280')
  const [penSize, setPenSize] = useState<PenSize>(4)
  const containerRef = useRef<HTMLDivElement>(null)

  // Receive doodle_sync from phone
  useEffect(() => {
    if (!ws) return

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: { event?: string; photoIndex?: number; layers?: string }
        }

        if (msg.type === 'shooting_sync' && msg.data.event === 'doodle_sync') {
          if (msg.data.photoIndex !== undefined) {
            setCurrentPhotoIndex(msg.data.photoIndex)
          }
          if (msg.data.layers) {
            const parsed = JSON.parse(msg.data.layers) as DoodleLayer[]
            setLayers(parsed)
          }
        }
      } catch {
        // ignore
      }
    }

    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [ws])

  const getPosition = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current
      if (!container) return null

      const rect = container.getBoundingClientRect()
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      }
    },
    [],
  )

  const sendDoodleSync = useCallback(
    (updatedLayers: readonly DoodleLayer[]) => {
      if (!roomId) return
      send('shooting_sync', {
        roomId,
        event: 'doodle_sync',
        photoIndex: currentPhotoIndex,
        layers: JSON.stringify(updatedLayers),
      })
    },
    [roomId, currentPhotoIndex, send],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pos = getPosition(e)
      if (!pos) return

      setIsDrawing(true)
      const newLayer: DoodleLayer = {
        type: 'path',
        points: [pos],
        color: penColor,
        size: penSize,
      }
      setLayers((prev) => [...prev, newLayer])
    },
    [getPosition, penColor, penSize],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDrawing) return
      const pos = getPosition(e)
      if (!pos) return

      setLayers((prev) =>
        prev.map((layer, i) =>
          i === prev.length - 1 && layer.type === 'path'
            ? { ...layer, points: [...layer.points, pos] }
            : layer,
        ),
      )
    },
    [isDrawing, getPosition],
  )

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    setLayers((prev) => {
      sendDoodleSync(prev)
      return prev
    })
  }, [isDrawing, sendDoodleSync])

  const handleUndo = useCallback(() => {
    setLayers((prev) => {
      const next = prev.slice(0, -1)
      sendDoodleSync(next)
      return next
    })
  }, [sendDoodleSync])

  const currentPhoto = previewPhotos[currentPhotoIndex] ?? ''

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="w-full max-w-lg">
        <header className="mb-6 text-center">
          <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">STEP 04</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">落書き中</h2>
          <p className="mt-1 receipt-text text-sm text-ink-light">
            {currentPhotoIndex + 1}枚目を編集中...
          </p>
        </header>

        <ReceiptFrame className="p-3" showTornEdge={false}>
          <div
            ref={containerRef}
            className="aspect-[3/4] w-full cursor-crosshair bg-cream-dark/20"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {(layers.length > 0 || currentPhoto) ? (
              <DoodleCanvas
                photoSrc={currentPhoto}
                layers={layers}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="receipt-text text-xs text-ink-light">スマホでお絵描き中...</p>
              </div>
            )}
          </div>
        </ReceiptFrame>

        {/* PC drawing toolbar */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="flex gap-1">
            {PEN_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setPenColor(color)}
                className={`h-6 w-6 rounded-full border-2 ${
                  penColor === color ? 'border-ink' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            {PEN_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPenSize(size)}
                className={`flex h-8 w-8 items-center justify-center rounded border ${
                  penSize === size ? 'border-ink bg-cream-dark/30' : 'border-cream-dark'
                }`}
              >
                <span
                  className="rounded-full bg-ink"
                  style={{ width: size * 2, height: size * 2 }}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="rounded border border-cream-dark px-3 py-1 text-xs text-ink-light hover:bg-cream-dark/20"
          >
            元に戻す
          </button>
        </div>

        {/* Photo selector */}
        {previewPhotos.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
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
      </div>
    </div>
  )
}
