'use client'

import { notFound } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { use, useEffect, useRef } from 'react'

import { PageContainer } from '@/components/ui/page-container'
import { isValidRoomId } from '@/lib/validation'
import { useRoomStore } from '@/stores/room-store'
import { useWsStore } from '@/stores/ws-store'

type Props = {
  readonly params: Promise<{ roomId: string }>
}

export default function RoomJoinPage({ params }: Props) {
  const { roomId } = use(params)
  if (!isValidRoomId(roomId)) notFound()
  const router = useRouter()
  const { joinRoom } = useRoomStore()
  const { connect, isConnected } = useWsStore()
  const initializedRef = useRef(false)

  // 接続開始（1回だけ）
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    joinRoom(roomId, 'phone')
    connect(roomId, 'phone')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 接続確立後にフィルター画面へ遷移
  useEffect(() => {
    if (isConnected) {
      router.replace('/filter')
    }
  }, [isConnected, router])

  return (
    <PageContainer className="flex flex-col items-center justify-center gap-4">
      <div className="receipt-text text-center">
        <p className="text-xs text-ink-light">ROOM: {roomId}</p>
        <p className="mt-2 text-sm">接続中...</p>
      </div>
    </PageContainer>
  )
}
