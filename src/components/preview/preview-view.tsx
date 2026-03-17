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
      <ReceiptFrame className="px-4 py-3" showTornEdge={false}>
        <div className="receipt-text text-center">
          <p className="text-xs text-ink-light tracking-widest">━━━━━━━━━━━━━━━━━━</p>
          <p className="mt-1 text-lg font-bold">プレビュー</p>
          <p className="text-xs text-ink-light">タップで撮り直しできるよ</p>
          <p className="mt-1 text-xs text-ink-light tracking-widest">━━━━━━━━━━━━━━━━━━</p>
        </div>
      </ReceiptFrame>

      <ReceiptFrame className="p-3">
        <PhotoGrid photos={photos} onRetake={handleRetake} />
      </ReceiptFrame>

      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={handleConfirm}>
          OK! 印刷する 🖨️
        </Button>

        <Button variant="secondary" size="md" className="w-full" onClick={handleRetakeAll}>
          全部撮り直す
        </Button>
      </div>

      <p className="receipt-text text-center text-xs text-ink-light">
        フィルター: {filter?.value ?? '未選択'}
      </p>
    </PageContainer>
  )
}
