import type { DoodleLayer, StampId } from '@/components/doodle/types'
import { STAMPS } from '@/components/doodle/types'

const STAMP_COLORS: Record<string, string> = {
  heart: '#e05280',
  star: '#d4a520',
  sparkle: '#d4a520',
  ribbon: '#e05280',
  flower: '#2aaa6a',
  music: '#1a1a1a',
}

function drawStampOnCanvas(
  ctx: CanvasRenderingContext2D,
  stampId: StampId,
  x: number,
  y: number,
  scale: number,
  rotation: number,
) {
  const stamp = STAMPS.find((s) => s.id === stampId)
  if (!stamp) return

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(scale, scale)
  ctx.translate(-12, -12)

  const path = new Path2D(stamp.svg)
  ctx.fillStyle = STAMP_COLORS[stampId] ?? '#1a1a1a'
  ctx.fill(path)
  ctx.restore()
}

function renderLayersOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layers: readonly DoodleLayer[],
) {
  for (const layer of layers) {
    if (layer.type === 'path' && layer.points.length > 1) {
      ctx.strokeStyle = layer.color
      ctx.lineWidth = layer.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const first = layer.points[0]
      if (first) {
        ctx.moveTo(first.x * width, first.y * height)
      }
      for (let i = 1; i < layer.points.length; i++) {
        const pt = layer.points[i]
        if (pt) {
          ctx.lineTo(pt.x * width, pt.y * height)
        }
      }
      ctx.stroke()
    }

    if (layer.type === 'stamp') {
      drawStampOnCanvas(
        ctx,
        layer.stampId,
        layer.x * width,
        layer.y * height,
        layer.scale,
        layer.rotation,
      )
    }

    if (layer.type === 'text') {
      ctx.save()
      ctx.translate(layer.x * width, layer.y * height)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.font = `bold ${layer.fontSize}px "Zen Maru Gothic", sans-serif`
      ctx.fillStyle = layer.color
      ctx.textAlign = 'center'
      ctx.fillText(layer.content, 0, 0)
      ctx.restore()
    }
  }
}

/** Composite doodle layers onto a photo, returning a new data URL */
export function compositePhotoWithLayers(
  photoDataUrl: string,
  layers: readonly DoodleLayer[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || 640
      canvas.height = img.naturalHeight || 480

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(photoDataUrl)
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      renderLayersOnCanvas(ctx, canvas.width, canvas.height, layers)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load photo for compositing'))
    img.src = photoDataUrl
  })
}
