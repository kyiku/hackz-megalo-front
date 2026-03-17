'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { PageContainer } from '@/components/ui/page-container'
import { ReceiptFrame } from '@/components/ui/receipt-frame'
import { useSessionStore } from '@/stores/session-store'

import { ProcessingSteps } from './processing-steps'
import { ReceiptPrinterAnimation } from './receipt-printer-animation'

type ProcessingViewProps = {
  readonly sessionId: string
}

const STEP_ORDER = [
  'uploading',
  'face-detection',
  'filter-apply',
  'collage-generate',
  'print-prepare',
  'complete',
] as const

export function ProcessingView({ sessionId }: ProcessingViewProps) {
  const router = useRouter()
  const { processingStep, setProcessingStep } = useSessionStore()

  // TODO: WebSocket接続でバックエンドから進捗を受け取る
  // 現在はデモ用に自動進行
  useEffect(() => {
    let stepIndex = 0
    const interval = setInterval(() => {
      stepIndex += 1
      if (stepIndex >= STEP_ORDER.length) {
        clearInterval(interval)
        router.push(`/result/${sessionId}`)
        return
      }
      setProcessingStep(STEP_ORDER[stepIndex] ?? 'uploading')
    }, 2000)

    setProcessingStep('uploading')

    return () => clearInterval(interval)
  }, [sessionId, setProcessingStep, router])

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
          <p className="font-mono text-[10px] text-ink-light">No. {sessionId}</p>
        </div>
      </ReceiptFrame>
    </PageContainer>
  )
}
