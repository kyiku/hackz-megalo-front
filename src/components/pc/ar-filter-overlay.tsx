'use client'

import { useEffect, useRef, useState } from 'react'

import type { FaceLandmarker as FaceLandmarkerType } from '@mediapipe/tasks-vision'

type ArEffect = 'dog' | 'cat' | 'sparkle' | 'crown' | 'heart'

type ArFilterOverlayProps = {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>
  readonly isActive: boolean
  readonly onEffectChange?: (effect: ArEffect | null) => void
  readonly externalEffect?: ArEffect | null
}

type FaceLandmark = {
  readonly x: number
  readonly y: number
  readonly z: number
}

const AR_EFFECTS: readonly { readonly id: ArEffect; readonly label: string }[] = [
  { id: 'dog', label: '犬' },
  { id: 'cat', label: '猫' },
  { id: 'sparkle', label: 'キラキラ' },
  { id: 'crown', label: '王冠' },
  { id: 'heart', label: 'ハート' },
]

// CDN version pinned to installed package version
const MEDIAPIPE_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'

// MediaPipe Face Mesh key landmark indices
const NOSE_TIP = 1
const LEFT_EYE = 159
const RIGHT_EYE = 386
const FOREHEAD = 10
const LEFT_CHEEK = 234
const RIGHT_CHEEK = 454

function drawDogEars(
  ctx: CanvasRenderingContext2D,
  landmarks: readonly FaceLandmark[],
  w: number,
  h: number,
): void {
  const forehead = landmarks[FOREHEAD]
  const leftEye = landmarks[LEFT_EYE]
  const rightEye = landmarks[RIGHT_EYE]
  const nose = landmarks[NOSE_TIP]
  if (!forehead || !leftEye || !rightEye || !nose) return

  const eyeDistance = Math.abs(rightEye.x - leftEye.x) * w
  const earSize = eyeDistance * 0.6

  ctx.font = `${earSize}px serif`
  ctx.textAlign = 'center'
  ctx.fillText('🐕', leftEye.x * w - earSize * 0.3, forehead.y * h - earSize * 0.3)
  ctx.fillText('🐕', rightEye.x * w + earSize * 0.3, forehead.y * h - earSize * 0.3)
  ctx.font = `${earSize * 0.5}px serif`
  ctx.fillText('🐽', nose.x * w, nose.y * h + earSize * 0.1)
}

function drawCatEars(
  ctx: CanvasRenderingContext2D,
  landmarks: readonly FaceLandmark[],
  w: number,
  h: number,
): void {
  const forehead = landmarks[FOREHEAD]
  const leftEye = landmarks[LEFT_EYE]
  const rightEye = landmarks[RIGHT_EYE]
  if (!forehead || !leftEye || !rightEye) return

  const eyeDistance = Math.abs(rightEye.x - leftEye.x) * w
  const earSize = eyeDistance * 0.7

  ctx.font = `${earSize}px serif`
  ctx.textAlign = 'center'
  ctx.fillText('😺', (leftEye.x + rightEye.x) / 2 * w, forehead.y * h - earSize * 0.5)
}

function drawSparkles(
  ctx: CanvasRenderingContext2D,
  landmarks: readonly FaceLandmark[],
  w: number,
  h: number,
): void {
  const leftEye = landmarks[LEFT_EYE]
  const rightEye = landmarks[RIGHT_EYE]
  if (!leftEye || !rightEye) return

  const eyeDistance = Math.abs(rightEye.x - leftEye.x) * w
  const size = eyeDistance * 0.3

  ctx.font = `${size}px serif`
  ctx.textAlign = 'center'

  const time = Date.now() / 500
  const offsets = [
    { dx: -0.3, dy: -0.2 },
    { dx: 0.3, dy: -0.1 },
    { dx: -0.4, dy: 0.1 },
    { dx: 0.4, dy: 0 },
  ]

  for (const { dx, dy } of offsets) {
    const wobble = Math.sin(time + dx * 10) * size * 0.1
    ctx.fillText('✨', leftEye.x * w + dx * eyeDistance + wobble, leftEye.y * h + dy * eyeDistance)
    ctx.fillText('✨', rightEye.x * w + dx * eyeDistance + wobble, rightEye.y * h + dy * eyeDistance)
  }
}

function drawCrown(
  ctx: CanvasRenderingContext2D,
  landmarks: readonly FaceLandmark[],
  w: number,
  h: number,
): void {
  const forehead = landmarks[FOREHEAD]
  const leftEye = landmarks[LEFT_EYE]
  const rightEye = landmarks[RIGHT_EYE]
  if (!forehead || !leftEye || !rightEye) return

  const eyeDistance = Math.abs(rightEye.x - leftEye.x) * w
  const size = eyeDistance * 0.8

  ctx.font = `${size}px serif`
  ctx.textAlign = 'center'
  ctx.fillText('👑', (leftEye.x + rightEye.x) / 2 * w, forehead.y * h - size * 0.3)
}

function drawHearts(
  ctx: CanvasRenderingContext2D,
  landmarks: readonly FaceLandmark[],
  w: number,
  h: number,
): void {
  const leftCheek = landmarks[LEFT_CHEEK]
  const rightCheek = landmarks[RIGHT_CHEEK]
  if (!leftCheek || !rightCheek) return

  const cheekDistance = Math.abs(rightCheek.x - leftCheek.x) * w
  const size = cheekDistance * 0.15

  ctx.font = `${size}px serif`
  ctx.textAlign = 'center'
  ctx.fillText('💕', leftCheek.x * w, leftCheek.y * h)
  ctx.fillText('💕', rightCheek.x * w, rightCheek.y * h)
}

const EFFECT_RENDERERS: Record<
  ArEffect,
  (ctx: CanvasRenderingContext2D, landmarks: readonly FaceLandmark[], w: number, h: number) => void
> = {
  dog: drawDogEars,
  cat: drawCatEars,
  sparkle: drawSparkles,
  crown: drawCrown,
  heart: drawHearts,
}

export function ArFilterOverlay({ videoRef, isActive, onEffectChange, externalEffect }: ArFilterOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedEffect, setSelectedEffect] = useState<ArEffect | null>(null)
  const selectedEffectRef = useRef<ArEffect | null>(selectedEffect)
  const faceLandmarkerRef = useRef<FaceLandmarkerType | null>(null)
  const animFrameRef = useRef<number>(0)
  const readyRef = useRef(false)
  const lastTimestampRef = useRef(0)
  const canvasSizeRef = useRef({ w: 0, h: 0 })

  // selectedEffect を ref に同期（描画ループの依存を排除）+ 親に通知
  useEffect(() => {
    selectedEffectRef.current = selectedEffect
    onEffectChange?.(selectedEffect)
  }, [selectedEffect, onEffectChange])

  // Phone側から同期されたエフェクトでローカルを上書き
  useEffect(() => {
    if (externalEffect !== undefined) {
      setSelectedEffect(externalEffect)
    }
  }, [externalEffect])

  // MediaPipe FaceLandmarker の初期化
  useEffect(() => {
    if (!isActive) return

    let cancelled = false
    let landmarker: FaceLandmarkerType | null = null

    const init = async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')

        if (cancelled) return

        const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL)

        if (cancelled) return

        landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
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
          console.warn('MediaPipe FaceLandmarker init failed:', err)
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

  // フレーム描画ループ（selectedEffect を依存から除外）
  useEffect(() => {
    if (!isActive) return

    const render = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      const faceLandmarker = faceLandmarkerRef.current

      if (video && canvas && readyRef.current && faceLandmarker && video.readyState >= 2) {
        const vw = video.videoWidth || video.clientWidth
        const vh = video.videoHeight || video.clientHeight

        // canvas サイズ変更はサイズが変わった時のみ
        if (canvasSizeRef.current.w !== vw || canvasSizeRef.current.h !== vh) {
          canvas.width = vw
          canvas.height = vh
          canvasSizeRef.current = { w: vw, h: vh }
        }

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          const currentEffect = selectedEffectRef.current
          if (currentEffect) {
            try {
              // タイムスタンプが単調増加であることを保証
              const now = performance.now()
              const timestamp = now > lastTimestampRef.current ? now : lastTimestampRef.current + 1
              lastTimestampRef.current = timestamp

              const result = faceLandmarker.detectForVideo(video, timestamp)

              for (const landmarks of result.faceLandmarks) {
                const renderer = EFFECT_RENDERERS[currentEffect]
                renderer(ctx, landmarks, canvas.width, canvas.height)
              }
            } catch {
              // 検出エラーは無視
            }
          }
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
      />

      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
        <button
          type="button"
          onClick={() => setSelectedEffect(null)}
          className={[
            'rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors',
            selectedEffect === null
              ? 'bg-white text-ink'
              : 'bg-ink/40 text-white/70 hover:bg-ink/60',
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
              'rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors',
              selectedEffect === effect.id
                ? 'bg-pink text-white'
                : 'bg-ink/40 text-white/70 hover:bg-ink/60',
            ].join(' ')}
          >
            {effect.label}
          </button>
        ))}
      </div>
    </>
  )
}
