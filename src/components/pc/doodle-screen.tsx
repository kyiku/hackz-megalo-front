'use client'

import { useEffect, useState } from 'react'

import { DoodleCanvas } from '@/components/doodle/doodle-canvas'
import type { DoodleLayer } from '@/components/doodle/types'
import { ReceiptFrame } from '@/components/ui/receipt-frame'
import { useWsStore } from '@/stores/ws-store'

export function DoodleScreen() {
  const { ws } = useWsStore()
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [layers, setLayers] = useState<readonly DoodleLayer[]>([])

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
          <div className="aspect-[3/4] w-full bg-cream-dark/20">
            {layers.length > 0 ? (
              <DoodleCanvas
                photoSrc=""
                layers={layers}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="receipt-text text-xs text-ink-light">スマホでお絵描き中...</p>
              </div>
            )}
          </div>
        </ReceiptFrame>
      </div>
    </div>
  )
}
