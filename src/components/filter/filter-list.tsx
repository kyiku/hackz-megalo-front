'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { AI_FILTERS, type FilterId, type FilterInfo, SIMPLE_FILTERS } from '@/lib/filters'
import { useSessionStore } from '@/stores/session-store'

import { FilterCard } from './filter-card'

export function FilterList() {
  const router = useRouter()
  const { filter, setFilter } = useSessionStore()

  const handleSelect = useCallback(
    (filterInfo: FilterInfo) => {
      setFilter({ type: filterInfo.type, value: filterInfo.id })
    },
    [setFilter],
  )

  const handleStart = useCallback(() => {
    if (!filter) return
    router.push('/shoot')
  }, [filter, router])

  const selectedId: FilterId | null = filter?.value ?? null

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-3 font-bold text-ink">
          <span className="receipt-text text-xs text-ink-light">━━</span> 簡易フィルター
        </h2>
        <div className="flex flex-col gap-2">
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
        <h2 className="mb-3 font-bold text-ink">
          <span className="receipt-text text-xs text-ink-light">━━</span> AIスタイル変換
        </h2>
        <p className="mb-3 rounded-xl bg-yellow/10 p-2 text-xs text-ink-light">
          AIが画風を変換するため、処理に15秒ほどかかります
        </p>
        <div className="flex flex-col gap-2">
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

      <div className="sticky bottom-4 pt-2">
        <Button size="lg" className="w-full" disabled={!filter} onClick={handleStart}>
          {filter ? '撮影スタート →' : 'フィルターを選んでね'}
        </Button>
      </div>
    </div>
  )
}
