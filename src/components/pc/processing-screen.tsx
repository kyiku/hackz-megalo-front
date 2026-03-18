'use client'

import { useEffect, useRef, useState } from 'react'

import { ProcessingSteps } from '@/components/processing/processing-steps'
import { ReceiptFrame } from '@/components/ui/receipt-frame'
import type { WsEvent } from '@/lib/api/types'
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
  const { sessionId, setPhase } = useRoomStore()
  const { ws } = useWsStore()
  const [currentStep, setCurrentStep] = useState('uploading')
  const [error, setError] = useState<string | null>(null)
  const subscribedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!ws || !sessionId) return

    if (subscribedRef.current !== sessionId) {
      ws.send(JSON.stringify({
        action: 'subscribe',
        data: { sessionId },
      }))
      subscribedRef.current = sessionId
    }

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as WsEvent

        // sessionId が一致するイベントのみ処理
        if ('data' in msg && 'sessionId' in msg.data && msg.data.sessionId !== sessionId) return

        if (msg.type === 'statusUpdate' && msg.data.step) {
          const mapped = STEP_MAP[msg.data.step] ?? msg.data.step
          setCurrentStep(mapped)
        }

        if (msg.type === 'completed') {
          setPhase('result')
        }

        if (msg.type === 'error') {
          setError(msg.data.message)
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
  }, [ws, sessionId, setPhase])

  useEffect(() => {
    if (!ws) {
      subscribedRef.current = null
    }
  }, [ws])

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm text-center">
          <p className="receipt-text text-sm font-bold text-red">{error}</p>
        </div>
      </div>
    )
  }

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
