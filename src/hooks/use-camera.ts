'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type UseCameraReturn = {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>
  readonly stream: MediaStream | null
  readonly isReady: boolean
  readonly error: string | null
  readonly capture: () => string | null
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        setStream(stream)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          if (!cancelled) {
            setIsReady(true)
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof DOMException && err.name === 'NotAllowedError'
              ? 'カメラの使用が許可されていません。設定から許可してください。'
              : 'カメラの起動に失敗しました。'
          setError(message)
        }
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setIsReady(false)
    }
  }, [])

  const capture = useCallback((): string | null => {
    const video = videoRef.current
    if (!video) return null

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    return canvas.toDataURL('image/jpeg', 0.85)
  }, [])

  return { videoRef, stream, isReady, error, capture }
}
