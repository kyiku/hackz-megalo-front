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

/** 撮影中に3秒おきにカメラフレームをS3にアップロードし、やじコメントを自動生成させる */
export function useYajiFrameUpload({
  sessionId,
  videoRef,
  isActive,
}: UseYajiFrameUploadOptions): void {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const captureFrame = useCallback((): Blob | null => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return null

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const canvas = canvasRef.current
    // やじ分析用なので低解像度で十分
    canvas.width = 320
    canvas.height = Math.round(320 * (video.videoHeight / video.videoWidth))

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    let blob: Blob | null = null
    canvas.toBlob(
      (b) => { blob = b },
      'image/jpeg',
      FRAME_QUALITY,
    )
    // toBlob is async on some browsers, use synchronous fallback
    if (!blob) {
      const dataUrl = canvas.toDataURL('image/jpeg', FRAME_QUALITY)
      const base64 = dataUrl.split(',')[1]
      if (!base64) return null
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      blob = new Blob([bytes], { type: 'image/jpeg' })
    }

    return blob
  }, [videoRef])

  const uploadFrame = useCallback(async () => {
    if (!sessionId) return

    try {
      const frame = captureFrame()
      if (!frame) return

      const { uploadUrl } = await getYajiFrameUrl(sessionId)
      await uploadYajiFrame(uploadUrl, frame)
    } catch {
      // やじフレームのアップロード失敗は撮影に影響しないので無視
    }
  }, [sessionId, captureFrame])

  useEffect(() => {
    if (!isActive || !sessionId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // 最初のフレームを即座にアップロード
    void uploadFrame()

    intervalRef.current = setInterval(() => {
      void uploadFrame()
    }, FRAME_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, sessionId, uploadFrame])
}
