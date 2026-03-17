'use client'

import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'
import { ReceiptFrame } from '@/components/ui/receipt-frame'

type ResultViewProps = {
  readonly sessionId: string
}

export function ResultView({ sessionId }: ResultViewProps) {
  // TODO: sessionId でバックエンドから結果を取得
  // 現在はデモ用プレースホルダー
  const collageUrl: string | null = null
  const caption = 'みんなの笑顔が最高にキュートだね！'

  return (
    <PageContainer className="flex flex-col items-center gap-6">
      <h1 className="pukkuri-text font-display text-2xl text-pink">できた！</h1>

      <ReceiptFrame className="w-full overflow-hidden">
        <div className="receipt-text px-4 pt-3 text-center">
          <p className="text-xs text-ink-light tracking-widest">━━━━━━━━━━━━━━━━━━</p>
          <p className="mt-1 text-sm font-bold">RECEIPT PURIKURA</p>
          <p className="text-[10px] text-ink-light">SESSION: {sessionId}</p>
          <p className="mt-1 text-xs text-ink-light tracking-widest">━━━━━━━━━━━━━━━━━━</p>
        </div>

        {/* コラージュ画像 */}
        <div className="relative mx-4 mt-3 aspect-square rounded-lg border-2 border-dashed border-cream-dark bg-cream-dark/30">
          {collageUrl ? (
            <Image
              src={collageUrl}
              alt="コラージュ"
              fill
              className="rounded-lg object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-light">
              <div className="text-center">
                <p className="text-4xl">🖼️</p>
                <p className="mt-2 text-xs">コラージュ画像</p>
                <p className="text-[10px]">(バックエンド接続後に表示)</p>
              </div>
            </div>
          )}
        </div>

        {/* AIキャプション */}
        <div className="mx-4 mt-3 rounded-xl bg-pink/5 p-3">
          <p className="text-center text-sm font-bold text-ink">
            <span className="text-pink">AI</span> &quot;{caption}&quot;
          </p>
        </div>

        <div className="px-4 pb-3 pt-3 text-center">
          <p className="receipt-text text-xs text-ink-light tracking-widest">━━━━━━━━━━━━━━━━━━</p>
          <p className="mt-1 font-mono text-[10px] text-ink-light">
            レシートのQRコードから
          </p>
          <p className="font-mono text-[10px] text-ink-light">
            カラー版をダウンロードできます
          </p>
        </div>
      </ReceiptFrame>

      <div className="flex w-full flex-col gap-3">
        <Button size="lg" className="w-full" disabled={!collageUrl}>
          画像を保存する
        </Button>

        <Link href="/filter" className="w-full">
          <Button variant="secondary" size="md" className="w-full">
            もう一回撮る
          </Button>
        </Link>
      </div>
    </PageContainer>
  )
}
