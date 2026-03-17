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
        'group flex items-center gap-3 rounded-sm border-l-4 px-3 py-2.5 text-left',
        'transition-all duration-100',
        isSelected
          ? 'border-l-ink bg-cream-dark/60'
          : 'border-l-transparent hover:border-l-cream-dark hover:bg-cream-dark/30',
      ].join(' ')}
      style={isSelected ? { borderLeftColor: filter.color } : undefined}
    >
      {/* カラースウォッチ */}
      <div
        className={[
          'h-8 w-8 shrink-0 rounded-full border',
          'transition-transform duration-100',
          isSelected ? 'scale-110 border-ink' : 'border-cream-dark group-hover:scale-105',
          filter.id === 'monochrome' ? 'border-ink-light' : '',
        ].join(' ')}
        style={{ backgroundColor: filter.color }}
      />

      <div className="min-w-0 flex-1">
        <span className={['text-sm', isSelected ? 'font-bold' : 'font-medium'].join(' ')}>
          {filter.name}
        </span>
        <span className="ml-2 text-xs text-ink-light">{filter.description}</span>
      </div>

      {filter.type === 'ai' && (
        <span className="font-mono text-[10px] text-ink-light">{filter.processingTime}</span>
      )}
    </button>
  )
}
