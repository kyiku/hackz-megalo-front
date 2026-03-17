'use client'

import { useEffect } from 'react'

import { useRoomStore } from '@/stores/room-store'

import { CompleteScreen } from './complete-screen'
import { FilterScreen } from './filter-screen'
import { IdleScreen } from './idle-screen'
import { ProcessingScreen } from './processing-screen'
import { ResultScreen } from './result-screen'
import { ShootingScreen } from './shooting-screen'

export function PcView() {
  const { roomId, phase, createRoom } = useRoomStore()

  useEffect(() => {
    if (!roomId) {
      createRoom()
    }
  }, [roomId, createRoom])

  if (!roomId) return null

  switch (phase) {
    case 'idle':
      return <IdleScreen roomId={roomId} />
    case 'filter-select':
      return <FilterScreen />
    case 'shooting':
    case 'preview':
      return <ShootingScreen />
    case 'processing':
      return <ProcessingScreen />
    case 'result':
      return <ResultScreen />
    case 'complete':
      return <CompleteScreen />
    default:
      return <IdleScreen roomId={roomId} />
  }
}
