'use client'

import { ALL_FILTERS } from '@/lib/filters'
import { useRoomStore } from '@/stores/room-store'

export function FilterScreen() {
  const { selectedFilter } = useRoomStore()

  const current = ALL_FILTERS.find((f) => f.id === selectedFilter)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-8">
      <div className="text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-white/40">STEP 01</p>
        <h2 className="mt-2 text-2xl font-bold text-white">フィルター選択中</h2>
        <p className="mt-1 font-mono text-sm text-white/50">
          スマホでフィルターを選んでいます...
        </p>

        {current && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <div
              className="h-20 w-20 rounded-full border-2 border-white/20"
              style={{ backgroundColor: current.color }}
            />
            <p className="text-lg font-bold text-white">{current.name}</p>
            <p className="text-sm text-white/50">{current.description}</p>
          </div>
        )}

        {!current && (
          <div className="mt-8">
            <div className="mx-auto h-20 w-20 animate-pulse rounded-full border-2 border-dashed border-white/20" />
            <p className="mt-3 text-sm text-white/30">未選択</p>
          </div>
        )}
      </div>
    </div>
  )
}
