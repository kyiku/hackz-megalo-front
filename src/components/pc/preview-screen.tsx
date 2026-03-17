'use client'

import { ReceiptFrame } from '@/components/ui/receipt-frame'

export function PreviewScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="w-full max-w-md">
        <header className="mb-6 text-center">
          <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">STEP 03</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">プレビュー中</h2>
        </header>

        <ReceiptFrame className="px-6 py-5" showTornEdge={false}>
          <div className="receipt-text text-center">
            <p className="text-sm">スマホでプレビュー中...</p>
            <p className="mt-2 text-xs text-ink-light">撮り直しや落書きをしています</p>
          </div>
        </ReceiptFrame>
      </div>
    </div>
  )
}
