'use client'

import type { FilterInfo } from '@/lib/filters'

type FilterCardProps = {
  readonly filter: FilterInfo
  readonly isSelected: boolean
  readonly onSelect: () => void
}

export function FilterCard({ filter, isSelected, onSelect }: FilterCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left',
        'transition-all duration-150',
        isSelected
          ? 'border-pink bg-pink/5 shadow-[0_2px_8px_rgba(255,107,157,0.2)]'
          : 'border-cream-dark bg-cream hover:border-pink-light',
      ].join(' ')}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cream-dark text-2xl">
        {filter.emoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink">{filter.name}</span>
          {filter.type === 'ai' && (
            <span className="rounded-full bg-yellow/20 px-2 py-0.5 text-[10px] font-bold text-ink">
              AI
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-ink-light">{filter.description}</p>
      </div>

      {filter.type === 'ai' && (
        <span className="shrink-0 font-mono text-[10px] text-ink-light">{filter.processingTime}</span>
      )}
    </button>
  )
}
