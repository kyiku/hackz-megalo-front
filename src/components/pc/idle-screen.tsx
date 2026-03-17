'use client'

import { QrDisplay } from './qr-display'

type IdleScreenProps = {
  readonly roomId: string
}

export function IdleScreen({ roomId }: IdleScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="flex flex-col items-center gap-10">
        <header className="text-center">
          <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">
            *** RECEIPT PURIKURA ***
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink">レシートプリクラ</h1>
          <p className="mt-1 receipt-text text-sm text-ink-light">
            サーマルプリンターで印刷するレトロなプリクラ体験
          </p>
        </header>

        <div className="receipt-texture border border-cream-dark p-6 shadow-sm">
          <QrDisplay roomId={roomId} />
        </div>

        <p className="receipt-text text-xs text-ink-light">スマホが接続されると撮影が始まります</p>
      </div>
    </div>
  )
}
