/**
 * Shared AR effect drawing functions used by both PC and phone overlays.
 */

export type ArEffect = 'dog' | 'cat' | 'sparkle' | 'crown' | 'heart'

export type FaceLandmark = {
  readonly x: number
  readonly y: number
  readonly z: number
}

export const AR_EFFECTS: readonly { readonly id: ArEffect; readonly label: string }[] = [
  { id: 'dog', label: '犬' },
  { id: 'cat', label: '猫' },
  { id: 'sparkle', label: 'キラキラ' },
  { id: 'crown', label: '王冠' },
  { id: 'heart', label: 'ハート' },
]

// CDN version pinned to installed package version
export const MEDIAPIPE_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'

export const MEDIAPIPE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

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
  ctx.fillText('😺', ((leftEye.x + rightEye.x) / 2) * w, forehead.y * h - earSize * 0.5)
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
  ctx.fillText('👑', ((leftEye.x + rightEye.x) / 2) * w, forehead.y * h - size * 0.3)
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

export const EFFECT_RENDERERS: Record<
  ArEffect,
  (ctx: CanvasRenderingContext2D, landmarks: readonly FaceLandmark[], w: number, h: number) => void
> = {
  dog: drawDogEars,
  cat: drawCatEars,
  sparkle: drawSparkles,
  crown: drawCrown,
  heart: drawHearts,
}
