'use client'

import { Button } from '@/components/ui/button'
import { usePrinterStore } from '@/stores/printer-store'

import { QrDisplay } from './qr-display'
import { StatsDashboard } from './stats-dashboard'

type IdleScreenProps = {
  readonly roomId: string
}

export function IdleScreen({ roomId }: IdleScreenProps) {
  const { isConnected, connect } = usePrinterStore()

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

        {/* プリンター接続 */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <p className="receipt-text text-xs text-mint">プリンター接続済み</p>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => void connect()}>
              プリンター接続
            </Button>
          )}
        </div>

        <div className="receipt-texture border border-cream-dark p-6 shadow-sm">
          <QrDisplay roomId={roomId} />
        </div>

        <p className="receipt-text text-xs text-ink-light">スマホが接続されると撮影が始まります</p>

        {/* リアルタイム統計ダッシュボード */}
        <div className="receipt-texture w-full max-w-xs border border-cream-dark p-5 shadow-sm">
          <StatsDashboard />
        </div>
      </div>
    </div>
  )
}
