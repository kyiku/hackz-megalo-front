'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { AI_FILTERS, type FilterId, type FilterInfo, SIMPLE_FILTERS } from '@/lib/filters'
import { useRoomStore } from '@/stores/room-store'
import { useSessionStore } from '@/stores/session-store'
import { useWsStore } from '@/stores/ws-store'

import { FilterCard } from './filter-card'

export function FilterList() {
  const router = useRouter()
  const { filter, setFilter } = useSessionStore()
  const { roomId } = useRoomStore()
  const { send } = useWsStore()

  const handleSelect = useCallback(
    (filterInfo: FilterInfo) => {
      setFilter({ type: filterInfo.type, value: filterInfo.id })

      if (roomId) {
        send('shooting_sync', {
          roomId,
          event: 'filter_select',
          filterId: filterInfo.id,
        })
      }
    },
    [setFilter, roomId, send],
  )

  const handleStart = useCallback(() => {
    if (!filter) return
    router.push('/shoot')
  }, [filter, router])

  const selectedId: FilterId | null = filter?.value ?? null

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="receipt-text mb-1 text-[10px] tracking-[0.3em] text-ink-light">SIMPLE</p>
        <h2 className="mb-3 text-sm font-bold">簡易フィルター</h2>
        <div className="flex flex-col">
          {SIMPLE_FILTERS.map((f) => (
            <FilterCard
              key={f.id}
              filter={f}
              isSelected={selectedId === f.id}
              onSelect={() => handleSelect(f)}
            />
          ))}
        </div>
      </section>

      <section>
        <p className="receipt-text mb-1 text-[10px] tracking-[0.3em] text-ink-light">AI STYLE</p>
        <h2 className="mb-2 text-sm font-bold">AIスタイル変換</h2>
        <p className="mb-3 font-mono text-[10px] text-ink-light">
          * 処理に15秒ほどかかります
        </p>
        <div className="flex flex-col">
          {AI_FILTERS.map((f) => (
            <FilterCard
              key={f.id}
              filter={f}
              isSelected={selectedId === f.id}
              onSelect={() => handleSelect(f)}
            />
          ))}
        </div>
      </section>

      <div className="sticky bottom-4">
        <Button size="lg" className="w-full" disabled={!filter} onClick={handleStart}>
          {filter ? '撮影スタート' : 'フィルターを選んでね'}
        </Button>
      </div>
    </div>
  )
}
