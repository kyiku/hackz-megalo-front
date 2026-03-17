'use client'

import { ALL_FILTERS } from '@/lib/filters'
import { useRoomStore } from '@/stores/room-store'

export function FilterScreen() {
  const { selectedFilter } = useRoomStore()
  const current = ALL_FILTERS.find((f) => f.id === selectedFilter)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="w-full max-w-md">
        <header className="text-center">
          <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">STEP 01</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">フィルター選択中</h2>
          <p className="mt-1 receipt-text text-sm text-ink-light">
            スマホでフィルターを選んでいます...
          </p>
        </header>

        <div className="receipt-texture mx-auto mt-8 max-w-xs border border-cream-dark p-6 shadow-sm">
          {current ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-16 w-16 rounded-full border border-cream-dark"
                style={{ backgroundColor: current.color }}
              />
              <p className="text-lg font-bold">{current.name}</p>
              <p className="receipt-text text-xs text-ink-light">{current.description}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 animate-pulse rounded-full border border-dashed border-cream-dark" />
              <p className="receipt-text text-sm text-ink-light">未選択</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
