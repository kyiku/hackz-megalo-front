'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'
import { ReceiptFrame } from '@/components/ui/receipt-frame'
import { useSessionStore } from '@/stores/session-store'

import { PhotoGrid } from './photo-grid'

export function PreviewView() {
  const router = useRouter()
  const { photos, filter, clearPhotos } = useSessionStore()

  useEffect(() => {
    if (!filter || photos.length === 0) {
      router.replace('/filter')
    }
  }, [filter, photos, router])

  const handleRetake = useCallback(
    (index: number) => {
      void router.push(`/shoot?retake=${index}`)
    },
    [router],
  )

  const handleRetakeAll = useCallback(() => {
    clearPhotos()
    router.push('/shoot')
  }, [clearPhotos, router])

  const handleConfirm = useCallback(() => {
    router.push('/processing/demo')
  }, [router])

  if (photos.length === 0) return null

  return (
    <PageContainer className="flex flex-col gap-6">
      <header>
        <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">STEP 03</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">プレビュー</h1>
        <p className="mt-0.5 text-xs text-ink-light">タップで撮り直しできるよ</p>
      </header>

      <ReceiptFrame className="p-3">
        <PhotoGrid photos={photos} onRetake={handleRetake} />
      </ReceiptFrame>

      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={handleConfirm}>
          OK! 印刷する
        </Button>

        <Button variant="secondary" size="md" className="w-full" onClick={handleRetakeAll}>
          全部撮り直す
        </Button>
      </div>

      <p className="receipt-text text-center font-mono text-[10px] text-ink-light">
        FILTER: {filter?.value ?? 'none'}
      </p>
    </PageContainer>
  )
}
