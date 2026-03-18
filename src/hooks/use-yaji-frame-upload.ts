'use client'

import { useCallback, useEffect, useRef } from 'react'

import { getYajiFrameUrl, uploadYajiFrame } from '@/lib/api/yaji'

const FRAME_INTERVAL_MS = 3000
const FRAME_QUALITY = 0.5

type UseYajiFrameUploadOptions = {
  readonly sessionId: string | null
  readonly videoRef: React.RefObject<HTMLVideoElement | null>
  readonly isActive: boolean
}

/** canvas.toBlob を Promise でラップ */
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

/** 撮影中に3秒おきにカメラフレームをS3にアップロードし、やじコメントを自動生成させる */
export function useYajiFrameUpload({
  sessionId,
  videoRef,
  isActive,
}: UseYajiFrameUploadOptions): void {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const uploadingRef = useRef(false)

  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return null

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const canvas = canvasRef.current
    canvas.width = 320
    canvas.height = Math.round(320 * (video.videoHeight / video.videoWidth))

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    return canvasToBlob(canvas, 'image/jpeg', FRAME_QUALITY)
  }, [videoRef])

  const uploadFrame = useCallback(async () => {
    if (!sessionId || uploadingRef.current) return
    uploadingRef.current = true

    try {
      const frame = await captureFrame()
      if (!frame) return

      const { uploadUrl } = await getYajiFrameUrl(sessionId)
      await uploadYajiFrame(uploadUrl, frame)
    } catch {
      // やじフレームのアップロード失敗は撮影に影響しないので無視
    } finally {
      uploadingRef.current = false
    }
  }, [sessionId, captureFrame])

  useEffect(() => {
    if (!isActive || !sessionId) return

    void uploadFrame()

    const interval = setInterval(() => {
      void uploadFrame()
    }, FRAME_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      // canvas メモリ解放
      if (canvasRef.current) {
        canvasRef.current.width = 0
        canvasRef.current.height = 0
        canvasRef.current = null
      }
    }
  }, [isActive, sessionId, uploadFrame])
}
