'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import type { FaceLandmarker as FaceLandmarkerType } from '@mediapipe/tasks-vision'

import {
  AR_EFFECTS,
  EFFECT_RENDERERS,
  MEDIAPIPE_MODEL_URL,
  MEDIAPIPE_WASM_URL,
  type ArEffect,
} from '@/lib/ar-effects'

type PhoneArOverlayProps = {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>
  readonly isActive: boolean
}

export type PhoneArOverlayHandle = {
  readonly getCanvas: () => HTMLCanvasElement | null
}

export const PhoneArOverlay = forwardRef<PhoneArOverlayHandle, PhoneArOverlayProps>(
  function PhoneArOverlay({ videoRef, isActive }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [selectedEffect, setSelectedEffect] = useState<ArEffect | null>(null)
    const selectedEffectRef = useRef<ArEffect | null>(selectedEffect)
    const faceLandmarkerRef = useRef<FaceLandmarkerType | null>(null)
    const animFrameRef = useRef<number>(0)
    const readyRef = useRef(false)
    const lastTimestampRef = useRef(0)
    const canvasSizeRef = useRef({ w: 0, h: 0 })

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }))

    useEffect(() => {
      selectedEffectRef.current = selectedEffect
    }, [selectedEffect])

    // MediaPipe FaceLandmarker の初期化
    useEffect(() => {
      if (!isActive) return

      let cancelled = false

      const init = async () => {
        try {
          const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
          if (cancelled) return

          const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL)
          if (cancelled) return

          const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: MEDIAPIPE_MODEL_URL,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numFaces: 2,
          })

          if (cancelled) {
            landmarker.close()
            return
          }

          faceLandmarkerRef.current = landmarker
          readyRef.current = true
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('PhoneArOverlay: MediaPipe init failed:', err)
          }
        }
      }

      void init()

      return () => {
        cancelled = true
        readyRef.current = false
        if (faceLandmarkerRef.current) {
          faceLandmarkerRef.current.close()
          faceLandmarkerRef.current = null
        }
      }
    }, [isActive])

    // フレーム描画ループ
    useEffect(() => {
      if (!isActive) return

      const render = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        const faceLandmarker = faceLandmarkerRef.current
        const effect = selectedEffectRef.current

        if (video && canvas && readyRef.current && faceLandmarker && effect && video.readyState >= 2) {
          const vw = video.videoWidth || video.clientWidth
          const vh = video.videoHeight || video.clientHeight

          if (canvasSizeRef.current.w !== vw || canvasSizeRef.current.h !== vh) {
            canvas.width = vw
            canvas.height = vh
            canvasSizeRef.current = { w: vw, h: vh }
          }

          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            try {
              const now = performance.now()
              const timestamp = now > lastTimestampRef.current ? now : lastTimestampRef.current + 1
              lastTimestampRef.current = timestamp

              const result = faceLandmarker.detectForVideo(video, timestamp)

              for (const landmarks of result.faceLandmarks) {
                const renderer = EFFECT_RENDERERS[effect]
                renderer(ctx, landmarks, canvas.width, canvas.height)
              }
            } catch {
              // 検出エラーは無視
            }
          }
        } else if (canvas && !effect) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
          }
        }

        animFrameRef.current = requestAnimationFrame(render)
      }

      animFrameRef.current = requestAnimationFrame(render)

      return () => {
        cancelAnimationFrame(animFrameRef.current)
      }
    }, [isActive, videoRef])

    if (!isActive) return null

    return (
      <>
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ transform: 'scaleX(-1)' }}
        />

        <div className="absolute top-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedEffect(null)}
            className={[
              'rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors',
              selectedEffect === null
                ? 'bg-white text-ink'
                : 'bg-ink/40 text-white/70 active:bg-ink/60',
            ].join(' ')}
          >
            なし
          </button>
          {AR_EFFECTS.map((effect) => (
            <button
              key={effect.id}
              type="button"
              onClick={() => setSelectedEffect(effect.id)}
              className={[
                'rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors',
                selectedEffect === effect.id
                  ? 'bg-pink text-white'
                  : 'bg-ink/40 text-white/70 active:bg-ink/60',
              ].join(' ')}
            >
              {effect.label}
            </button>
          ))}
        </div>
      </>
    )
  },
)
