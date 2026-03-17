'use client'

import { notFound } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { use, useEffect, useRef, useState } from 'react'

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
  const [status, setStatus] = useState<'connecting' | 'joined' | 'error' | 'full'>('connecting')
  const statusRef = useRef(status)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    if (!WS_URL) {
      joinRoom(roomId, 'phone')
      router.replace('/filter')
      return
    }

    const ws = new WebSocket(WS_URL)

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { roomId, role: 'phone' },
      }))
    })

    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: { error?: string }
        }

        if (msg.type === 'room_full') {
          setStatus('full')
          ws.close()
          return
        }

        if (msg.type === 'room_not_found') {
          setStatus('error')
          ws.close()
          return
        }

        joinRoom(roomId, 'phone')
        setStatus('joined')
        ws.close()
        router.replace('/filter')
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to parse room join response:', err)
        }
      }
    })

    ws.addEventListener('error', () => {
      setStatus('error')
    })

    const timeout = setTimeout(() => {
      if (statusRef.current === 'connecting') {
        joinRoom(roomId, 'phone')
        ws.close()
        router.replace('/filter')
      }
    }, 5000)

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
