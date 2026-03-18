import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'

export default function Home() {
  return (
    <PageContainer className="flex flex-col items-center justify-center gap-0">
      <div className="receipt-card w-full max-w-sm">
        <div className="receipt-zigzag-top" />
        <div className="receipt-texture px-5 pb-6 pt-5">
          <div className="receipt-text text-center text-ink">
            <p className="text-[10px] tracking-[0.3em] text-ink-light">*** RECEIPT ***</p>
            <div className="my-3 border-t border-dashed border-ink-light/30" />

            <p className="text-base font-bold tracking-wide">レシートプリクラ</p>
            <p className="mt-0.5 text-[10px] text-ink-light">RECEIPT PURIKURA</p>

            <div className="my-3 border-t border-dashed border-ink-light/30" />

            <p className="text-left text-xs leading-relaxed">
              サーマルプリンターで印刷する
              <br />
              レトロなプリクラ体験
            </p>

            <div className="my-3 border-t border-dashed border-ink-light/30" />
            <p className="text-[10px] text-ink-light">どちらのモードで参加しますか？</p>
          </div>
        </div>
        <div className="receipt-zigzag-bottom" />
      </div>

      <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
        <Link href="/pc">
          <Button size="lg" className="w-full">
            PCモード（大画面表示）
          </Button>
        </Link>

        <p className="receipt-text text-center text-[10px] text-ink-light">or</p>

        <p className="text-center text-xs text-ink-light">
          スマホの方はPC画面のQRコードから参加してください
        </p>
      </div>
    </PageContainer>
  )
}
