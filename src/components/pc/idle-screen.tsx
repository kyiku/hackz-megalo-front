'use client'

import { QrDisplay } from './qr-display'

type IdleScreenProps = {
  readonly roomId: string
}

export function IdleScreen({ roomId }: IdleScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-8">
      <div className="flex flex-col items-center gap-8">
        <header className="text-center">
          <p className="font-mono text-xs tracking-[0.3em] text-white/40">*** RECEIPT PURIKURA ***</p>
          <h1 className="mt-3 font-display text-4xl tracking-wide text-white">レシートプリクラ</h1>
          <p className="mt-1 font-mono text-sm text-white/50">
            サーマルプリンターで印刷するレトロなプリクラ体験
          </p>
        </header>

        <QrDisplay roomId={roomId} />

        <div className="receipt-text text-center text-white/30">
          <p className="text-xs">スマホが接続されると撮影が始まります</p>
        </div>
      </div>
    </div>
  )
}
