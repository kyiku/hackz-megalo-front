'use client'

import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'
import { ReceiptFrame } from '@/components/ui/receipt-frame'

type DownloadViewProps = {
  readonly sessionId: string
}

export function DownloadView({ sessionId }: DownloadViewProps) {
  // TODO: sessionId でバックエンドからカラー版高解像度URLを取得
  const downloadUrl: string | null = null

  return (
    <PageContainer className="flex flex-col items-center justify-center gap-6">
      <ReceiptFrame className="w-full p-5">
        <div className="receipt-text text-center">
          <p className="text-xs text-ink-light tracking-widest">━━━━━━━━━━━━━━━━━━</p>
          <p className="mt-2 text-lg font-bold">カラー版ダウンロード</p>
          <p className="text-xs text-ink-light">レシートのQRコードからアクセスしました</p>
          <p className="mt-2 text-xs text-ink-light tracking-widest">━━━━━━━━━━━━━━━━━━</p>
        </div>

        <div className="mt-4 border-t border-dashed border-cream-dark pt-4">
          <div className="relative mx-auto aspect-square max-w-xs rounded-lg border-2 border-dashed border-cream-dark bg-cream-dark/30">
            {downloadUrl ? (
              <Image
                src={downloadUrl}
                alt="カラー版コラージュ"
                fill
                className="rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-light">
                <div className="text-center">
                  <p className="text-4xl">🎨</p>
                  <p className="mt-2 text-xs">カラー版コラージュ</p>
                  <p className="text-[10px]">(バックエンド接続後に表示)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="font-mono text-[10px] text-ink-light">SESSION: {sessionId}</p>
        </div>
      </ReceiptFrame>

      <Button size="lg" className="w-full" disabled={!downloadUrl}>
        高解像度で保存する
      </Button>
    </PageContainer>
  )
}
