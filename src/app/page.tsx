import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'

export default function Home() {
  return (
    <PageContainer className="flex flex-col items-center justify-center gap-0">
      {/* レシート風ヘッダー */}
      <div className="receipt-texture w-full max-w-xs border border-cream-dark px-5 pb-8 pt-6 shadow-sm">
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

          <table className="w-full text-left text-[10px]">
            <tbody>
              <tr>
                <td className="py-0.5 text-ink-light">フィルター</td>
                <td className="py-0.5 text-right">8種類</td>
              </tr>
              <tr>
                <td className="py-0.5 text-ink-light">撮影枚数</td>
                <td className="py-0.5 text-right">4枚</td>
              </tr>
              <tr>
                <td className="py-0.5 text-ink-light">処理時間</td>
                <td className="py-0.5 text-right">~30秒</td>
              </tr>
              <tr>
                <td className="py-0.5 text-ink-light">お値段</td>
                <td className="py-0.5 text-right font-bold">¥0</td>
              </tr>
            </tbody>
          </table>

          <div className="my-3 border-t border-dashed border-ink-light/30" />

          <p className="text-[10px] text-ink-light">毎度ありがとうございます</p>
        </div>

        {/* 千切れた端 */}
        <div className="receipt-torn-edge" />
      </div>

      <div className="mt-10 w-full max-w-xs">
        <Link href="/filter">
          <Button size="lg" className="w-full">
            撮影スタート
          </Button>
        </Link>
      </div>
    </PageContainer>
  )
}
