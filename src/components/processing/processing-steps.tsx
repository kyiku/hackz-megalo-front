'use client'

type Step = {
  readonly id: string
  readonly label: string
  readonly status: 'pending' | 'active' | 'done'
}

type ProcessingStepsProps = {
  readonly currentStep: string
}

const STEPS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'uploading', label: 'アップロード中' },
  { id: 'face-detection', label: '顔検出中' },
  { id: 'filter-apply', label: 'フィルター適用中' },
  { id: 'collage-generate', label: 'コラージュ生成中' },
  { id: 'print-prepare', label: '印刷準備中' },
]

function getStepStatus(stepIndex: number, currentIndex: number): Step['status'] {
  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return 'active'
  return 'pending'
}

export function ProcessingSteps({ currentStep }: ProcessingStepsProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <div className="receipt-text flex flex-col gap-0">
      {STEPS.map((step, i) => {
        const status = getStepStatus(i, currentIndex)
        return (
          <div key={step.id} className="flex items-center gap-3 py-1.5">
            <span className="w-4 text-center text-sm">
              {status === 'done' && '✓'}
              {status === 'active' && '▸'}
              {status === 'pending' && ' '}
            </span>
            <span
              className={[
                'text-sm',
                status === 'done' ? 'text-ink-light line-through' : '',
                status === 'active' ? 'font-bold text-pink' : '',
                status === 'pending' ? 'text-ink-light/50' : '',
              ].join(' ')}
            >
              {step.label}
            </span>
            {status === 'active' && (
              <span className="animate-pulse text-xs text-pink">...</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
