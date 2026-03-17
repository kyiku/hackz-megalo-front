import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'
import { ReceiptFrame } from '@/components/ui/receipt-frame'

export default function Home() {
  return (
    <PageContainer className="flex flex-col items-center justify-center gap-8">
      <h1 className="pukkuri-text font-display text-4xl text-pink">Receipt Purikura</h1>

      <ReceiptFrame className="w-full p-6">
        <div className="receipt-text text-center">
          <p className="text-ink-light text-xs tracking-widest">━━━━━━━━━━━━━━━━━━</p>
          <p className="mt-3 text-lg font-bold">レシートプリクラ</p>
          <p className="mt-1 text-sm text-ink-light">サーマルプリンターで印刷する</p>
          <p className="text-sm text-ink-light">レトロなプリクラ体験</p>
          <p className="mt-3 text-ink-light text-xs tracking-widest">━━━━━━━━━━━━━━━━━━</p>
        </div>
      </ReceiptFrame>

      <Link href="/filter">
        <Button size="lg">撮影スタート</Button>
      </Link>
    </PageContainer>
  )
}
