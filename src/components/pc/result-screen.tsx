'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

import { getSession } from '@/lib/api/sessions'
import { Button } from '@/components/ui/button'
import { ReceiptFrame } from '@/components/ui/receipt-frame'
import { usePrinterStore } from '@/stores/printer-store'
import { useRoomStore } from '@/stores/room-store'

export function ResultScreen() {
  const { sessionId, setPhase } = useRoomStore()
  const { isConnected: printerConnected, isPrinting, printImage, lastError } = usePrinterStore()
  const [collageUrl, setCollageUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!sessionId)
  const [printed, setPrinted] = useState(false)

  useEffect(() => {
    if (!sessionId) return

    let cancelled = false
    let retryCount = 0

    const fetchResult = async () => {
      try {
        const session = await getSession(sessionId)
        if (cancelled) return

        if (session.status === 'completed' && session.collageImageUrl) {
          setCollageUrl(session.collageImageUrl)
          if (session.caption) setCaption(session.caption)
          setLoading(false)
          return
        }

        if (retryCount < 10) {
          retryCount += 1
          setTimeout(() => { void fetchResult() }, 2000)
          return
        }

        setLoading(false)
      } catch {
        if (!cancelled && retryCount < 10) {
          retryCount += 1
          setTimeout(() => { void fetchResult() }, 2000)
        } else {
          setLoading(false)
        }
      }
    }

    void fetchResult()

    return () => { cancelled = true }
  }, [sessionId])

  // プリンター接続済み＋コラージュ取得完了で自動印刷
  useEffect(() => {
    if (!printerConnected || !collageUrl || printed || isPrinting) return

    const timer = setTimeout(() => {
      setPrinted(true)
      void printImage(collageUrl)
    }, 500)

    return () => clearTimeout(timer)
  }, [printerConnected, collageUrl, printed, isPrinting, printImage])

  const handlePrint = useCallback(() => {
    if (collageUrl) {
      if (printerConnected) {
        void printImage(collageUrl)
      } else {
        window.print()
      }
    }
  }, [collageUrl, printerConnected, printImage])

  const handleComplete = useCallback(() => {
    setPhase('complete')
  }, [setPhase])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="w-full max-w-lg">
        <header className="mb-6 text-center print:hidden">
          <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">
            *** RESULT ***
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">できた！</h2>
        </header>

        <ReceiptFrame className="px-5 py-5" showTornEdge={false}>
          <div className="relative aspect-square w-full border border-dashed border-ink-light/30 bg-cream-dark/20 print:border-none">
            {collageUrl ? (
              <Image src={collageUrl} alt="コラージュ" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="receipt-text text-center text-ink-light">
                  {loading ? (
                    <p className="animate-pulse text-xs">読み込み中...</p>
                  ) : (
                    <>
                      <p className="text-xs">[ コラージュ ]</p>
                      <p className="mt-1 text-[10px]">バックエンド接続後に表示</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {caption && (
            <div className="mt-4 border-t border-dashed border-ink-light/30 pt-3 print:border-none">
              <p className="receipt-text text-[10px] text-ink-light">CAPTION:</p>
              <p className="mt-1 text-center text-sm leading-relaxed">&quot;{caption}&quot;</p>
            </div>
          )}
        </ReceiptFrame>

        {lastError && (
          <p className="mt-2 text-center receipt-text text-xs text-red">
            印刷エラー: {lastError}
          </p>
        )}

        {isPrinting && (
          <p className="mt-4 text-center animate-pulse receipt-text text-sm text-ink-light">
            印刷中...
          </p>
        )}

        {collageUrl && !isPrinting && (
          <div className="mt-6 flex flex-col gap-3 print:hidden">
            <Button size="lg" className="w-full" onClick={handlePrint}>
              {printed ? 'もう一度印刷' : '印刷する'}
            </Button>

            <Button variant="secondary" size="md" className="w-full" onClick={handleComplete}>
              次のお客さんへ
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
