'use client'

import { useEffect } from 'react'

import { useRoomStore } from '@/stores/room-store'

export function CompleteScreen() {
  const { setPhase } = useRoomStore()

  // 5秒後に自動で待機モードに戻る
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('idle')
    }, 5000)

    return () => clearTimeout(timer)
  }, [setPhase])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">レシートを取ってね！</h2>
        <p className="mt-4 font-mono text-sm text-white/40">5秒後に待機画面に戻ります...</p>
      </div>
    </div>
  )
}
