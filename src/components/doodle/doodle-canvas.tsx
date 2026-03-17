'use client'

import { useCallback, useEffect, useRef } from 'react'

import type { DoodleLayer, StampId } from './types'
import { STAMPS } from './types'

type DoodleCanvasProps = {
  readonly photoSrc: string
  readonly layers: readonly DoodleLayer[]
  readonly className?: string
}

function drawStamp(ctx: CanvasRenderingContext2D, stampId: StampId, x: number, y: number, scale: number) {
  const stamp = STAMPS.find((s) => s.id === stampId)
  if (!stamp) return

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.translate(-12, -12)

  const path = new Path2D(stamp.svg)
  ctx.fillStyle = stampId === 'heart' ? '#e05280' : stampId === 'star' ? '#d4a520' : '#1a1a1a'
  ctx.fill(path)
  ctx.restore()
}

export function DoodleCanvas({ photoSrc, layers, className = '' }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    for (const layer of layers) {
      if (layer.type === 'path' && layer.points.length > 1) {
        ctx.strokeStyle = layer.color
        ctx.lineWidth = layer.size
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        const first = layer.points[0]
        if (first) {
          ctx.moveTo(first.x * canvas.width, first.y * canvas.height)
        }
        for (let i = 1; i < layer.points.length; i++) {
          const pt = layer.points[i]
          if (pt) {
            ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height)
          }
        }
        ctx.stroke()
      }

      if (layer.type === 'stamp') {
        drawStamp(ctx, layer.stampId, layer.x * canvas.width, layer.y * canvas.height, layer.scale)
      }

      if (layer.type === 'text') {
        ctx.font = `bold ${layer.fontSize}px "Zen Maru Gothic", sans-serif`
        ctx.fillStyle = layer.color
        ctx.textAlign = 'center'
        ctx.fillText(layer.content, layer.x * canvas.width, layer.y * canvas.height)
      }
    }
  }, [layers])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = img.naturalWidth || 640
        canvas.height = img.naturalHeight || 480
      }
      render()
    }
    img.src = photoSrc
  }, [photoSrc, render])

  useEffect(() => {
    render()
  }, [render])

  return (
    <canvas
      ref={canvasRef}
      className={`h-full w-full object-contain ${className}`}
    />
  )
}
