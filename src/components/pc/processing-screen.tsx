'use client'

import { useEffect, useState } from 'react'

import { ProcessingSteps } from '@/components/processing/processing-steps'
import { ReceiptFrame } from '@/components/ui/receipt-frame'
import { useRoomStore } from '@/stores/room-store'
import { useWsStore } from '@/stores/ws-store'

const STEP_MAP: Record<string, string> = {
  'face-detection': 'face-detection',
  'filter': 'filter-apply',
  'collage': 'collage-generate',
  'caption': 'collage-generate',
  'dither': 'print-prepare',
}

export function ProcessingScreen() {
  const { sessionId } = useRoomStore()
  const { ws } = useWsStore()
  const [currentStep, setCurrentStep] = useState('uploading')

  // WebSocketでstatusUpdateを受信
  useEffect(() => {
    if (!ws || !sessionId) return

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'subscribe',
        data: { sessionId },
      }))
    }

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: { step?: string }
        }

        if (msg.type === 'statusUpdate' && msg.data.step) {
          const mapped = STEP_MAP[msg.data.step] ?? msg.data.step
          setCurrentStep(mapped)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to parse status update:', err)
        }
      }
    }

    ws.addEventListener('message', handler)
    return () => {
      ws.removeEventListener('message', handler)
    }
  }, [ws, sessionId])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm">
        <header className="mb-6 text-center">
          <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">
            *** PROCESSING ***
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">処理中</h2>
        </header>

        <ReceiptFrame className="px-6 py-5" showTornEdge={false}>
          <ProcessingSteps currentStep={currentStep} />
        </ReceiptFrame>
      </div>
    </div>
  )
}
