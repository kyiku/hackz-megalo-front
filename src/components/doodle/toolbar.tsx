'use client'

import type { PenColor, PenSize, StampId, Tool } from './types'
import { PEN_COLORS, PEN_SIZES, STAMPS } from './types'

type ToolbarProps = {
  readonly tool: Tool
  readonly penColor: PenColor
  readonly penSize: PenSize
  readonly selectedStamp: StampId
  readonly textColor: PenColor
  readonly onToolChange: (tool: Tool) => void
  readonly onPenColorChange: (color: PenColor) => void
  readonly onPenSizeChange: (size: PenSize) => void
  readonly onStampChange: (stamp: StampId) => void
  readonly onTextColorChange: (color: PenColor) => void
  readonly onUndo: () => void
}

const TOOL_LABELS: Record<Tool, string> = {
  pen: 'ペン',
  stamp: 'スタンプ',
  text: 'テキスト',
}

const TOOLS: readonly Tool[] = ['pen', 'stamp', 'text']

export function Toolbar({
  tool,
  penColor,
  penSize,
  selectedStamp,
  textColor,
  onToolChange,
  onPenColorChange,
  onPenSizeChange,
  onStampChange,
  onTextColorChange,
  onUndo,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* ツール切り替え */}
      <div className="flex items-center gap-1">
        {TOOLS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onToolChange(t)}
            className={[
              'flex-1 py-1.5 text-xs font-bold transition-all',
              tool === t
                ? 'bg-ink text-cream'
                : 'bg-cream-dark/50 text-ink-light hover:bg-cream-dark',
            ].join(' ')}
          >
            {TOOL_LABELS[t]}
          </button>
        ))}
        <button
          type="button"
          onClick={onUndo}
          className="bg-cream-dark/50 px-3 py-1.5 text-xs font-bold text-ink-light hover:bg-cream-dark"
        >
          戻す
        </button>
      </div>

      {/* ペン設定 */}
      {tool === 'pen' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            {PEN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`ペン色: ${c}`}
                onClick={() => onPenColorChange(c)}
                className={[
                  'h-7 w-7 rounded-full border transition-transform',
                  penColor === c ? 'scale-110 border-ink' : 'border-cream-dark',
                ].join(' ')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {PEN_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`ペンサイズ: ${s}px`}
                onClick={() => onPenSizeChange(s)}
                className={[
                  'flex h-7 w-7 items-center justify-center transition-all',
                  penSize === s ? 'bg-cream-dark' : '',
                ].join(' ')}
              >
                <div
                  className="rounded-full bg-ink"
                  style={{ width: s + 2, height: s + 2 }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* スタンプ選択 */}
      {tool === 'stamp' && (
        <div className="flex items-center gap-1.5">
          {STAMPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStampChange(s.id)}
              className={[
                'flex h-9 w-9 items-center justify-center transition-all',
                selectedStamp === s.id ? 'bg-cream-dark' : 'hover:bg-cream-dark/50',
              ].join(' ')}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path d={s.svg} fill="#1a1a1a" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* テキスト色 */}
      {tool === 'text' && (
        <div className="flex flex-col gap-2">
          <p className="receipt-text text-[10px] text-ink-light">タップした位置に文字を配置</p>
          <div className="flex items-center gap-1.5">
            {PEN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`テキスト色: ${c}`}
                onClick={() => onTextColorChange(c)}
                className={[
                  'h-7 w-7 rounded-full border transition-transform',
                  textColor === c ? 'scale-110 border-ink' : 'border-cream-dark',
                ].join(' ')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
