'use client'

import { useCallback, useRef, useState } from 'react'

type TextInputModalProps = {
  readonly onSubmit: (text: string) => void
  readonly onCancel: () => void
}

export function TextInputModal({ onSubmit, onCancel }: TextInputModalProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (trimmed.length > 0 && trimmed.length <= 100) {
      onSubmit(trimmed)
    }
  }, [value, onSubmit])

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/30">
      <div className="w-full border-t border-cream-dark bg-cream px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            maxLength={100}
            placeholder="テキストを入力"
            className="flex-1 border border-cream-dark bg-white px-3 py-2 text-sm text-ink outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={value.trim().length === 0}
            className="bg-ink px-3 py-2 text-sm font-bold text-cream disabled:opacity-40"
          >
            配置
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-2 py-2 text-sm text-ink-light"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
