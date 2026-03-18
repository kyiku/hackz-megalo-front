'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { createSession, startProcessing, uploadPhoto } from '@/lib/api/sessions'
import type { WsEvent } from '@/lib/api/types'
import { toApiFilterName } from '@/lib/filters'
import { dataUrlToBlob } from '@/lib/utils'
import { useSessionStore } from '@/stores/session-store'

import { PageContainer } from '../ui/page-container'
import { ReceiptFrame } from '../ui/receipt-frame'
import { ProcessingSteps } from './processing-steps'
import { ReceiptPrinterAnimation } from './receipt-printer-animation'

type ProcessingViewProps = {
  readonly sessionId: string
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? ''

const STEP_MAP: Record<string, string> = {
  'face-detection': 'face-detection',
  'filter': 'filter-apply',
  'collage': 'collage-generate',
  'caption': 'collage-generate',
  'dither': 'print-prepare',
}

export function ProcessingView({ sessionId: routeSessionId }: ProcessingViewProps) {
  const router = useRouter()
  const { photos, filter, processingStep, setProcessingStep, setResult, sessionId: existingSessionId, uploadUrls: existingUploadUrls } = useSessionStore()
  const [error, setError] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const startedRef = useRef(false)

  const handleWsEvent = useCallback(
    (event: WsEvent) => {
      if (event.type === 'statusUpdate') {
        const mapped = STEP_MAP[event.data.step] ?? event.data.step
        setProcessingStep(mapped as Parameters<typeof setProcessingStep>[0])
      }

      if (event.type === 'completed') {
        setResult(event.data.collageImageUrl, null)
        router.push(`/result/${event.data.sessionId}`)
      }

      if (event.type === 'error') {
        setError(event.data.message)
      }
    },
    [setProcessingStep, setResult, router],
  )

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const abortController = new AbortController()

    const run = async () => {
      try {
        if (!filter || photos.length === 0) {
          setProcessingStep('uploading')
          const steps = ['uploading', 'face-detection', 'filter-apply', 'collage-generate', 'print-prepare', 'complete'] as const
          for (let i = 0; i < steps.length; i++) {
            if (abortController.signal.aborted) return
            await new Promise((r) => setTimeout(r, 1500))
            setProcessingStep(steps[i] ?? 'uploading')
          }
          if (!abortController.signal.aborted) {
            router.push(`/result/${routeSessionId}`)
          }
          return
        }

        setProcessingStep('uploading')

        // 撮影中にセッションが先行作成済みならそれを再利用
        const session = existingSessionId && existingUploadUrls.length > 0
          ? { sessionId: existingSessionId, uploadUrls: existingUploadUrls, websocketUrl: '' }
          : await createSession({
              filterType: filter.type,
              filter: toApiFilterName(filter.value),
              photoCount: photos.length,
            })

        if (abortController.signal.aborted) return
        setCurrentSessionId(session.sessionId)

        if (WS_URL) {
          const ws = new WebSocket(WS_URL)
          wsRef.current = ws

          ws.addEventListener('open', () => {
            ws.send(JSON.stringify({
              action: 'subscribe',
              data: { sessionId: session.sessionId },
            }))
          })

          ws.addEventListener('message', (e) => {
            try {
              const parsed = JSON.parse(e.data as string) as WsEvent
              handleWsEvent(parsed)
            } catch (err) {
              if (process.env.NODE_ENV === 'development') {
                console.error('Failed to parse processing WS message:', err)
              }
            }
          })
        }

        await Promise.all(
          session.uploadUrls.map((upload, i) => {
            const photo = photos[i]
            if (!photo) return Promise.resolve()
            const blob = dataUrlToBlob(photo)
            return uploadPhoto(upload.url, blob, abortController.signal)
          }),
        )

        if (abortController.signal.aborted) return

        setProcessingStep('face-detection')
        await startProcessing(session.sessionId)
      } catch (err) {
        if (abortController.signal.aborted) return
        const message = err instanceof Error ? err.message : '処理中にエラーが発生しました'
        setError(message)
      }
    }

    void run()

    return () => {
      abortController.abort()
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [routeSessionId, photos, filter, setProcessingStep, setResult, router, handleWsEvent, existingSessionId, existingUploadUrls])

  if (error) {
    return (
      <PageContainer className="flex flex-col items-center justify-center gap-4">
        <p className="receipt-text text-sm font-bold text-red">{error}</p>
        <button
          type="button"
          onClick={() => router.replace('/filter')}
          className="text-sm text-ink-light underline"
        >
          最初からやり直す
        </button>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="flex flex-col items-center justify-center gap-8">
      <ReceiptPrinterAnimation />

      <ReceiptFrame className="w-full px-5 py-5">
        <div className="receipt-text text-center text-ink">
          <p className="text-[10px] tracking-[0.3em] text-ink-light">*** PROCESSING ***</p>
          <div className="my-2 border-t border-dashed border-ink-light/30" />
          <p className="text-xs font-bold">処理中</p>
          <p className="text-[10px] text-ink-light">レシートを準備しています</p>
          <div className="my-2 border-t border-dashed border-ink-light/30" />
        </div>

        <ProcessingSteps currentStep={processingStep ?? 'uploading'} />

        <div className="mt-3 border-t border-dashed border-ink-light/30 pt-2 text-center">
          <p className="font-mono text-[10px] text-ink-light">
            No. {currentSessionId ?? routeSessionId}
          </p>
        </div>
      </ReceiptFrame>
    </PageContainer>
  )
}
