'use client'

import { ProcessingSteps } from '@/components/processing/processing-steps'
import { ReceiptFrame } from '@/components/ui/receipt-frame'
import { useSessionStore } from '@/stores/session-store'

export function ProcessingScreen() {
  const { processingStep } = useSessionStore()

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
          <ProcessingSteps currentStep={processingStep ?? 'uploading'} />
        </ReceiptFrame>
      </div>
    </div>
  )
}
