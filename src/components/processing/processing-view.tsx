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

      <ReceiptFrame className="w-full p-5">
        <div className="receipt-text text-center">
          <p className="text-xs text-ink-light tracking-widest">━━━━━━━━━━━━━━━━━━</p>
          <p className="mt-2 text-sm font-bold">処理中...</p>
          <p className="mb-2 text-xs text-ink-light">レシートを準備しています</p>
          <p className="text-xs text-ink-light tracking-widest">━━━━━━━━━━━━━━━━━━</p>
        </div>

        <div className="mt-4 border-t border-dashed border-cream-dark pt-4">
          <ProcessingSteps currentStep={processingStep ?? 'uploading'} />
        </div>

        <div className="mt-4 border-t border-dashed border-cream-dark pt-3 text-center">
          <p className="font-mono text-[10px] text-ink-light">SESSION: {sessionId}</p>
        </div>
      </ReceiptFrame>

      <p className="animate-pulse text-sm text-ink-light">しばらくお待ちください...</p>
    </PageContainer>
  )
}
