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

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ?? '').trim()

export default function RoomJoinPage({ params }: Props) {
  const { roomId } = use(params)
  if (!isValidRoomId(roomId)) notFound()
  const router = useRouter()
  const { joinRoom } = useRoomStore()
  const [status, setStatus] = useState<'connecting' | 'error' | 'full'>('connecting')

  useEffect(() => {
    // WS_URL未設定時は即参加
    if (!WS_URL) {
      joinRoom(roomId, 'phone')
      router.replace('/filter')
      return
    }

    const ws = new WebSocket(WS_URL)

    ws.addEventListener('open', () => {
      // join_roomを送信して即参加・遷移
      // バックエンドのws-join-roomはconnectionsテーブルに記録するだけで
      // 明示的なレスポンスは返さないため、送信完了を以て参加とする
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { roomId, role: 'phone' },
      }))

      joinRoom(roomId, 'phone')
      ws.close()
      router.replace('/filter')
    })

    ws.addEventListener('error', () => {
      setStatus('error')
    })

    // タイムアウト: 3秒以内にWebSocket接続できなければエラー
    const timeout = setTimeout(() => {
      setStatus('error')
      ws.close()
    }, 3000)

    return () => {
      clearTimeout(timeout)
      ws.close()
    }
  }, [roomId, joinRoom, router])

  if (status === 'full') {
    return (
      <PageContainer className="flex flex-col items-center justify-center gap-4">
        <p className="receipt-text text-sm font-bold text-red">このルームは満員です</p>
        <p className="text-xs text-ink-light">1つのルームにつきスマホ1台まで</p>
        <Button variant="secondary" size="sm" onClick={() => router.replace('/')}>
          トップに戻る
        </Button>
      </PageContainer>
    )
  }

  if (status === 'error') {
    return (
      <PageContainer className="flex flex-col items-center justify-center gap-4">
        <p className="receipt-text text-sm font-bold text-red">接続に失敗しました</p>
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
