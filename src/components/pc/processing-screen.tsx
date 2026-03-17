'use client'

import { ProcessingSteps } from '@/components/processing/processing-steps'
import { useSessionStore } from '@/stores/session-store'

export function ProcessingScreen() {
  const { processingStep } = useSessionStore()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-8">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="font-mono text-xs tracking-[0.3em] text-white/40">*** PROCESSING ***</p>
          <h2 className="mt-2 text-2xl font-bold text-white">処理中</h2>
        </div>

        <div className="mt-8 border border-white/10 bg-white/5 px-6 py-5">
          <ProcessingSteps currentStep={processingStep ?? 'uploading'} />
        </div>
      </div>
    </div>
  )
}
