'use client'

import { useEffect } from 'react'

import { useRoomStore } from '@/stores/room-store'

export function CompleteScreen() {
  const { setPhase } = useRoomStore()

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('idle')
    }, 5000)

    return () => clearTimeout(timer)
  }, [setPhase])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="receipt-texture max-w-sm border border-cream-dark px-8 py-10 text-center shadow-sm">
        <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">*** COMPLETE ***</p>
        <div className="my-3 border-t border-dashed border-ink-light/30" />
        <h2 className="text-2xl font-bold tracking-tight">レシートを取ってね！</h2>
        <div className="my-3 border-t border-dashed border-ink-light/30" />
        <p className="receipt-text text-[10px] text-ink-light">5秒後に待機画面に戻ります</p>
      </div>
    </div>
  )
}
