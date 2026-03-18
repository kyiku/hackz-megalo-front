'use client'

import { useEffect, useRef, useState } from 'react'

type ArFilterOverlayProps = {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>
  readonly isActive: boolean
}

type ArEffect = 'dog' | 'cat' | 'sparkle' | 'crown' | 'heart'

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

  // Left ear
  ctx.fillText('🐕', leftEye.x * w - earSize * 0.3, forehead.y * h - earSize * 0.3)
  // Right ear
  ctx.fillText('🐕', rightEye.x * w + earSize * 0.3, forehead.y * h - earSize * 0.3)
  // Nose
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

  // Cat ears using triangles
  const earY = forehead.y * h - earSize * 0.5
  ctx.fillText('😺', (leftEye.x + rightEye.x) / 2 * w, earY)
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

export function ArFilterOverlay({ videoRef, isActive }: ArFilterOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedEffect, setSelectedEffect] = useState<ArEffect>('sparkle')
  const faceLandmarkerRef = useRef<unknown>(null)
  const animFrameRef = useRef<number>(0)

  // MediaPipe FaceLandmarker の初期化
  useEffect(() => {
    if (!isActive) return

    let cancelled = false

    const init = async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')

        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        )

        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 2,
        })

        if (!cancelled) {
          faceLandmarkerRef.current = faceLandmarker
        }
      } catch {
        // MediaPipe初期化失敗は静かに無視（ARなしで動作）
      }
    }

    void init()

    return () => {
      cancelled = true
      if (faceLandmarkerRef.current) {
        (faceLandmarkerRef.current as { close(): void }).close()
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
      const faceLandmarker = faceLandmarkerRef.current as {
        detectForVideo(video: HTMLVideoElement, timestamp: number): {
          faceLandmarks: readonly (readonly FaceLandmark[])[]
        }
      } | null

      if (video && canvas && faceLandmarker && video.readyState >= 2) {
        canvas.width = video.videoWidth || video.clientWidth
        canvas.height = video.videoHeight || video.clientHeight

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          try {
            const result = faceLandmarker.detectForVideo(video, performance.now())

            for (const landmarks of result.faceLandmarks) {
              const renderer = EFFECT_RENDERERS[selectedEffect]
              renderer(ctx, landmarks, canvas.width, canvas.height)
            }
          } catch {
            // 検出エラーは無視
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [isActive, videoRef, selectedEffect])

  if (!isActive) return null

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      {/* ARエフェクト選択ボタン */}
      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
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
