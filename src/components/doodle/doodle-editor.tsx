'use client'

import { useCallback, useRef, useState } from 'react'

import { DoodleCanvas } from './doodle-canvas'
import { Toolbar } from './toolbar'
import type { DoodleLayer, PenColor, PenSize, StampId, Tool } from './types'

type DoodleEditorProps = {
  readonly photoSrc: string
  readonly onSave: (layers: readonly DoodleLayer[]) => void
  readonly onCancel: () => void
  readonly initialLayers?: readonly DoodleLayer[]
}

export function DoodleEditor({ photoSrc, onSave, onCancel, initialLayers = [] }: DoodleEditorProps) {
  const [layers, setLayers] = useState<readonly DoodleLayer[]>(initialLayers)
  const [tool, setTool] = useState<Tool>('pen')
  const [penColor, setPenColor] = useState<PenColor>('#e05280')
  const [penSize, setPenSize] = useState<PenSize>(4)
  const [selectedStamp, setSelectedStamp] = useState<StampId>('heart')
  const [textColor, setTextColor] = useState<PenColor>('#1a1a1a')
  const [isDrawing, setIsDrawing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentPathRef = useRef<{ x: number; y: number }[]>([])

  const getPosition = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const container = containerRef.current
      if (!container) return null

      const rect = container.getBoundingClientRect()
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
      const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY

      return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
      }
    },
    [],
  )

  const handlePointerDown = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const pos = getPosition(e)
      if (!pos) return

      if (tool === 'pen') {
        setIsDrawing(true)
        currentPathRef.current = [pos]
        setLayers((prev) => [
          ...prev,
          { type: 'path', points: [pos], color: penColor, size: penSize },
        ])
      }

      if (tool === 'stamp') {
        setLayers((prev) => [
          ...prev,
          { type: 'stamp', stampId: selectedStamp, x: pos.x, y: pos.y, scale: 2 },
        ])
      }

      if (tool === 'text') {
        const content = prompt('テキストを入力')
        if (content) {
          setLayers((prev) => [
            ...prev,
            { type: 'text', content, x: pos.x, y: pos.y, color: textColor, fontSize: 24 },
          ])
        }
      }
    },
    [tool, penColor, penSize, selectedStamp, textColor, getPosition],
  )

  const handlePointerMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDrawing || tool !== 'pen') return
      e.preventDefault()

      const pos = getPosition(e)
      if (!pos) return

      currentPathRef.current = [...currentPathRef.current, pos]

      setLayers((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last?.type === 'path') {
          updated[updated.length - 1] = {
            ...last,
            points: [...last.points, pos],
          }
        }
        return updated
      })
    },
    [isDrawing, tool, getPosition],
  )

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false)
    currentPathRef.current = []
  }, [])

  const handleUndo = useCallback(() => {
    setLayers((prev) => prev.slice(0, -1))
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-ink-light"
        >
          キャンセル
        </button>
        <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">DOODLE</p>
        <button
          type="button"
          onClick={() => onSave(layers)}
          className="text-sm font-bold text-ink"
        >
          完了
        </button>
      </div>

      {/* キャンバス */}
      <div
        ref={containerRef}
        className="relative mx-4 flex-1 touch-none border border-cream-dark"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        <DoodleCanvas photoSrc={photoSrc} layers={layers} />
      </div>

      {/* ツールバー */}
      <div className="px-4 py-3">
        <Toolbar
          tool={tool}
          penColor={penColor}
          penSize={penSize}
          selectedStamp={selectedStamp}
          textColor={textColor}
          onToolChange={setTool}
          onPenColorChange={setPenColor}
          onPenSizeChange={setPenSize}
          onStampChange={setSelectedStamp}
          onTextColorChange={setTextColor}
          onUndo={handleUndo}
        />
      </div>
    </div>
  )
}
