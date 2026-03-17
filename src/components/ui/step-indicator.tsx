'use client'

type StepIndicatorProps = {
  readonly current: number
  readonly total: number
  readonly className?: string
}

export function StepIndicator({ current, total, className = '' }: StepIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={[
            'h-3 w-3 rounded-full transition-all duration-200',
            i < current ? 'bg-pink scale-100' : 'bg-cream-dark scale-90',
            i === current - 1 ? 'ring-2 ring-pink-light ring-offset-2 ring-offset-cream' : '',
          ].join(' ')}
        />
      ))}
    </div>
  )
}
