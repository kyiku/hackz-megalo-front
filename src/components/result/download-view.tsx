'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { getSession } from '@/lib/api/sessions'

import { Button } from '../ui/button'
import { PageContainer } from '../ui/page-container'
import { ReceiptFrame } from '../ui/receipt-frame'

type DownloadViewProps = {
  readonly sessionId: string
}

export function DownloadView({ sessionId }: DownloadViewProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSession(sessionId)
        if (session.collageImageUrl) {
          setDownloadUrl(session.collageImageUrl)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch session for download:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    void fetchSession()
  }, [sessionId])

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
                {loading ? (
                  <p className="animate-pulse text-xs">読み込み中...</p>
                ) : (
                  <p className="text-xs">画像が見つかりませんでした</p>
                )}
              </div>
            </div>
          )}
        </div>
      </ReceiptFrame>

      {downloadUrl ? (
        <a href={downloadUrl} download rel="noopener" className="w-full">
          <Button size="lg" className="w-full">
            高解像度で保存
          </Button>
        </a>
      ) : (
        <Button size="lg" className="w-full" disabled>
          高解像度で保存
        </Button>
      )}
    </PageContainer>
  )
}
