'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { getSession } from '@/lib/api/sessions'
import { useSessionStore } from '@/stores/session-store'

import { Button } from '../ui/button'
import { PageContainer } from '../ui/page-container'
import { ReceiptFrame } from '../ui/receipt-frame'

type ResultViewProps = {
  readonly sessionId: string
}

export function ResultView({ sessionId }: ResultViewProps) {
  const { collageUrl: storeCollageUrl, caption: storeCaption } = useSessionStore()
  const [collageUrl, setCollageUrl] = useState<string | null>(storeCollageUrl)
  const [caption, setCaption] = useState<string | null>(storeCaption)
  const [loading, setLoading] = useState(!storeCollageUrl)

  useEffect(() => {
    if (storeCollageUrl) return

    let cancelled = false

    const fetchSession = async () => {
      try {
        const session = await getSession(sessionId)
        if (cancelled) return
        if (session.collageImageUrl) {
          setCollageUrl(session.collageImageUrl)
        }
        if (session.caption) {
          setCaption(session.caption)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch session result:', err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchSession()

    return () => {
      cancelled = true
    }
  }, [sessionId, storeCollageUrl])

  return (
    <PageContainer className="flex flex-col items-center gap-6">
      <header>
        <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">COMPLETE</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">できた！</h1>
      </header>

      <ReceiptFrame className="w-full overflow-hidden px-5 py-5">
        <div className="receipt-text text-center text-ink">
          <p className="text-[10px] tracking-[0.3em] text-ink-light">*** RESULT ***</p>
          <div className="my-2 border-t border-dashed border-ink-light/30" />
          <p className="text-xs font-bold">RECEIPT PURIKURA</p>
          <p className="font-mono text-[10px] text-ink-light">No. {sessionId}</p>
          <div className="my-2 border-t border-dashed border-ink-light/30" />
        </div>

        <div className="relative aspect-square border border-dashed border-ink-light/30 bg-cream-dark/20">
          {collageUrl ? (
            <Image
              src={collageUrl}
              alt="コラージュ"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="receipt-text text-center text-ink-light">
                {loading ? (
                  <p className="animate-pulse text-xs">読み込み中...</p>
                ) : (
                  <>
                    <p className="text-xs">[ コラージュ画像 ]</p>
                    <p className="mt-1 text-[10px]">バックエンド接続後に表示</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {caption && (
          <div className="mt-3 border-t border-dashed border-ink-light/30 pt-3">
            <p className="receipt-text text-xs text-ink-light">CAPTION:</p>
            <p className="mt-1 text-sm leading-relaxed">&quot;{caption}&quot;</p>
          </div>
        )}

        <div className="mt-3 border-t border-dashed border-ink-light/30 pt-2 text-center">
          <p className="font-mono text-[10px] text-ink-light">
            レシートのQRからカラー版DL可
          </p>
        </div>
      </ReceiptFrame>

      <div className="flex w-full flex-col gap-3">
        {collageUrl && (
          <a href={collageUrl} download rel="noopener" className="w-full">
            <Button size="lg" className="w-full">
              画像を保存
            </Button>
          </a>
        )}

        <Link href="/filter" className="w-full">
          <Button variant="secondary" size="md" className="w-full">
            もう一回撮る
          </Button>
        </Link>
      </div>
    </PageContainer>
  )
}
