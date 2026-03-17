'use client'

import { notFound } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'
import { isValidRoomId } from '@/lib/validation'
import { useRoomStore } from '@/stores/room-store'

type Props = {
  readonly params: Promise<{ roomId: string }>
}

export default function RoomJoinPage({ params }: Props) {
  const { roomId } = use(params)
  if (!isValidRoomId(roomId)) notFound()
  const router = useRouter()
  const { joinRoom } = useRoomStore()
  // TODO: バックエンド接続後にエラー/満員状態を設定
  const [status] = useState<'connecting' | 'error' | 'full'>('connecting')

  useEffect(() => {
    // TODO: バックエンドに接続してルームの存在確認 + 空き確認
    // 現在はデモ用に即参加
    const timer = setTimeout(() => {
      joinRoom(roomId, 'phone')
      router.replace('/filter')
    }, 1000)

    return () => clearTimeout(timer)
  }, [roomId, joinRoom, router])

  if (status === 'full') {
    return (
      <PageContainer className="flex flex-col items-center justify-center gap-4">
        <p className="receipt-text text-sm font-bold text-red">このルームは満員です</p>
        <p className="text-xs text-ink-light">1つのルームにつきスマホ1台まで</p>
      </PageContainer>
    )
  }

  if (status === 'error') {
    return (
      <PageContainer className="flex flex-col items-center justify-center gap-4">
        <p className="receipt-text text-sm font-bold text-red">ルームが見つかりません</p>
        <Button variant="secondary" size="sm" onClick={() => router.replace('/')}>
          トップに戻る
        </Button>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="flex flex-col items-center justify-center gap-4">
      <div className="receipt-text text-center">
        <p className="text-xs text-ink-light">ROOM: {roomId}</p>
        <p className="mt-2 text-sm">接続中...</p>
      </div>
    </PageContainer>
  )
}
