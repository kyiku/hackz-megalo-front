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
      <ReceiptFrame className="w-full px-5 py-5">
        <div className="receipt-text text-center text-ink">
          <p className="text-[10px] tracking-[0.3em] text-ink-light">*** DOWNLOAD ***</p>
          <div className="my-2 border-t border-dashed border-ink-light/30" />
          <p className="text-xs font-bold">カラー版ダウンロード</p>
          <p className="font-mono text-[10px] text-ink-light">No. {sessionId}</p>
          <div className="my-2 border-t border-dashed border-ink-light/30" />
        </div>

        <div className="relative mx-auto aspect-square max-w-xs border border-dashed border-ink-light/30 bg-cream-dark/20">
          {downloadUrl ? (
            <Image
              src={downloadUrl}
              alt="カラー版コラージュ"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="receipt-text text-center text-ink-light">
                <p className="text-xs">[ カラー版コラージュ ]</p>
                <p className="mt-1 text-[10px]">バックエンド接続後に表示</p>
              </div>
            </div>
          )}
        </div>
      </ReceiptFrame>

      <Button size="lg" className="w-full" disabled={!downloadUrl}>
        高解像度で保存
      </Button>
    </PageContainer>
  )
}
