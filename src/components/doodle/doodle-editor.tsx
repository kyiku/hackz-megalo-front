'use client'

import { useCallback, useRef, useState } from 'react'

import { DoodleCanvas } from './doodle-canvas'
import { TextInputModal } from './text-input-modal'
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
  const [stampScale, setStampScale] = useState(2)
  const [textColor, setTextColor] = useState<PenColor>('#1a1a1a')
  const [isDrawing, setIsDrawing] = useState(false)
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null)
  const [movingIndex, setMovingIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchCountRef = useRef(0)

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

  const findLayerAt = useCallback(
    (x: number, y: number): number | null => {
      // 後ろから（上のレイヤーから）探す
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i]
        if (!layer) continue

        if (layer.type === 'stamp') {
          const dist = Math.sqrt((layer.x - x) ** 2 + (layer.y - y) ** 2)
          if (dist < 0.05 * layer.scale) return i
        }
        if (layer.type === 'text') {
          const dist = Math.sqrt((layer.x - x) ** 2 + (layer.y - y) ** 2)
          if (dist < 0.08) return i
        }
      }
      return null
    },
    [layers],
  )

  const handlePointerDown = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      // 2本指はスクロール用（ペンモード時）
      if ('touches' in e) {
        touchCountRef.current = e.touches.length
        if (e.touches.length >= 2) return
      }

      const pos = getPosition(e)
      if (!pos) return

      if (tool === 'move') {
        const idx = findLayerAt(pos.x, pos.y)
        if (idx !== null) {
          setMovingIndex(idx)
        }
        return
      }

      if (tool === 'pen') {
        setIsDrawing(true)
        setLayers((prev) => [
          ...prev,
          { type: 'path', points: [pos], color: penColor, size: penSize },
        ])
      }

      if (tool === 'stamp') {
        setLayers((prev) => [
          ...prev,
          { type: 'stamp', stampId: selectedStamp, x: pos.x, y: pos.y, scale: stampScale, rotation: 0 },
        ])
      }

      if (tool === 'text') {
        setTextInput(pos)
      }
    },
    [tool, penColor, penSize, selectedStamp, stampScale, getPosition, findLayerAt],
  )

  const handlePointerMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      // 2本指はスクロール
      if ('touches' in e && (e.touches.length >= 2 || touchCountRef.current >= 2)) return

      const pos = getPosition(e)
      if (!pos) return

      // 移動モード
      if (tool === 'move' && movingIndex !== null) {
        e.preventDefault()
        setLayers((prev) =>
          prev.map((layer, i) => {
            if (i !== movingIndex) return layer
            if (layer.type === 'stamp') return { ...layer, x: pos.x, y: pos.y }
            if (layer.type === 'text') return { ...layer, x: pos.x, y: pos.y }
            return layer
          }),
        )
        return
      }

      // ペン描画
      if (!isDrawing || tool !== 'pen') return
      e.preventDefault()

      setLayers((prev) =>
        prev.map((layer, i) =>
          i === prev.length - 1 && layer.type === 'path'
            ? { ...layer, points: [...layer.points, pos] }
            : layer,
        ),
      )
    },
    [isDrawing, tool, movingIndex, getPosition],
  )

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false)
    setMovingIndex(null)
    touchCountRef.current = 0
  }, [])

  const handleTextSubmit = useCallback(
    (content: string) => {
      if (!textInput) return
      setLayers((prev) => [
        ...prev,
        { type: 'text', content, x: textInput.x, y: textInput.y, color: textColor, fontSize: 24, rotation: 0 },
      ])
      setTextInput(null)
    },
    [textInput, textColor],
  )

  const handleUndo = useCallback(() => {
    setLayers((prev) => prev.slice(0, -1))
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={onCancel} className="text-sm text-ink-light">
          キャンセル
        </button>
        <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">DOODLE</p>
        <button type="button" onClick={() => onSave(layers)} className="text-sm font-bold text-ink">
          完了
        </button>
      </div>

      {/* キャンバス */}
      <div
        ref={containerRef}
        className="relative mx-4 flex-1 border border-cream-dark"
        style={{ touchAction: tool === 'pen' ? 'none' : 'pan-y' }}
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

      {/* テキスト入力モーダル */}
      {textInput && (
        <TextInputModal
          onSubmit={handleTextSubmit}
          onCancel={() => setTextInput(null)}
        />
      )}

      {/* ツールバー */}
      <div className="px-4 py-3">
        <Toolbar
          tool={tool}
          penColor={penColor}
          penSize={penSize}
          selectedStamp={selectedStamp}
          stampScale={stampScale}
          textColor={textColor}
          onToolChange={setTool}
          onPenColorChange={setPenColor}
          onPenSizeChange={setPenSize}
          onStampChange={setSelectedStamp}
          onStampScaleChange={setStampScale}
          onTextColorChange={setTextColor}
          onUndo={handleUndo}
        />
      </div>
    </div>
  )
}
