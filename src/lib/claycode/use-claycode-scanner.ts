'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { BitTreeConverter } from './bit-tree-converter'
import { BitsValidator } from './bits-validator'
import { TextBitsConverter } from './text-bits-converter'
import { TopologyAnalyzer } from './topology-analyzer'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const cv: any

type ScanResult = {
  readonly decodedText: string
  readonly potentialCount: number
  readonly foundCount: number
}

type ScannerState = {
  readonly isReady: boolean
  readonly fps: number
  readonly result: ScanResult | null
  readonly error: string | null
}

const FIVE_DIGIT_PATTERN = /^\d{5}$/

function createFpsCounter(sampleSize: number) {
  const samples: number[] = []

  return {
    addSample(timestamp: number): number {
      samples.push(timestamp)
      if (samples.length > sampleSize) {
        samples.shift()
      }
      if (samples.length < 2) return 0
      const elapsed = samples[samples.length - 1] - samples[0]
      return elapsed > 0 ? ((samples.length - 1) * 1000) / elapsed : 0
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildParentsArray(hierarchy: any): number[] {
  if (hierarchy.cols === 0) return [0]

  const parents = [0]
  const numContours = hierarchy.cols

  for (let i = 0; i < numContours; i++) {
    const parentIdx = hierarchy.data32S[i * 4 + 3]
    parents.push(parentIdx === -1 ? 0 : parentIdx + 1)
  }

  return parents
}

function tryDecodeClaycodes(parentsArray: number[]): ScanResult | null {
  const tree = TopologyAnalyzer.buildTreeFromParentsArray(parentsArray, 0)
  const potentialRoots = TopologyAnalyzer.findPotentialClaycodeRoots(tree)

  let foundCount = 0
  let decodedText = ''

  for (const root of potentialRoots) {
    const bits = BitTreeConverter.treeToBits(root)
    const validatedBits = BitsValidator.getValidatedBitString(bits)

    if (validatedBits) {
      const text = TextBitsConverter.bitsToText(validatedBits)
      if (text && text.length > 0 && !text.startsWith('[Claycode]')) {
        foundCount++
        decodedText = text
        break
      }
    }
  }

  if (foundCount === 0) return null

  return {
    decodedText,
    potentialCount: potentialRoots.length,
    foundCount,
  }
}

function processFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): ScanResult | null {
  ctx.drawImage(video, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const src = cv.matFromImageData(imageData)

  const minDim = Math.min(src.cols, src.rows)
  const squareSize = Math.floor(minDim * 0.9)
  const left = Math.floor((src.cols - squareSize) / 2)
  const top = Math.floor((src.rows - squareSize) / 2)

  const cropRect = new cv.Rect(left, top, squareSize, squareSize)
  const cropped = src.roi(cropRect)

  const gray = new cv.Mat()
  cv.cvtColor(cropped, gray, cv.COLOR_RGBA2GRAY)

  const imgBil = new cv.Mat()
  cv.bilateralFilter(gray, imgBil, 3, 75, 75, cv.BORDER_DEFAULT)

  const width = imgBil.cols
  const height = imgBil.rows
  let kernelSize = Math.max(Math.floor((13 * width * height) / 1000000), 9)
  if (kernelSize % 2 === 0) {
    kernelSize += 1
  }

  const thresh = new cv.Mat()
  cv.adaptiveThreshold(
    imgBil,
    thresh,
    255,
    cv.ADAPTIVE_THRESH_MEAN_C,
    cv.THRESH_BINARY,
    kernelSize,
    4,
  )

  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  cv.findContours(
    thresh,
    contours,
    hierarchy,
    cv.RETR_TREE,
    cv.CHAIN_APPROX_SIMPLE,
  )

  const parentsArray = buildParentsArray(hierarchy)

  let result: ScanResult | null = null
  try {
    result = tryDecodeClaycodes(parentsArray)
  } catch {
    // decoding failed, continue scanning
  }

  src.delete()
  cropped.delete()
  gray.delete()
  imgBil.delete()
  thresh.delete()
  contours.delete()
  hierarchy.delete()

  return result
}

export function useClaycodeScanner(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const [state, setState] = useState<ScannerState>({
    isReady: false,
    fps: 0,
    result: null,
    error: null,
  })

  const scanningRef = useRef(true)
  const fpsCounterRef = useRef(createFpsCounter(50))
  const animationFrameRef = useRef<number>(0)

  const stopScanning = useCallback(() => {
    scanningRef.current = false
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const resetResult = useCallback(() => {
    setState((prev) => ({ ...prev, result: null }))
    scanningRef.current = true
  }, [])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    let cameraStream: MediaStream | null = null

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1920 },
          },
        })
        cameraStream = stream
        video.srcObject = stream
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          waitForOpenCV()
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error:
            err instanceof Error
              ? err.message
              : 'カメラへのアクセスが拒否されました',
        }))
      }
    }

    const waitForOpenCV = () => {
      if (typeof cv !== 'undefined' && cv.Mat) {
        setState((prev) => ({ ...prev, isReady: true }))
        startScanLoop()
      } else {
        setTimeout(waitForOpenCV, 100)
      }
    }

    const startScanLoop = () => {
      const scanFrame = () => {
        if (!scanningRef.current) {
          animationFrameRef.current = requestAnimationFrame(scanFrame)
          return
        }

        try {
          const result = processFrame(video, canvas, ctx)
          const fps = fpsCounterRef.current.addSample(Date.now())

          if (result) {
            scanningRef.current = false
            setState((prev) => ({ ...prev, fps, result }))
          } else {
            setState((prev) => ({ ...prev, fps }))
          }
        } catch {
          // processing error, continue scanning
        }

        animationFrameRef.current = requestAnimationFrame(scanFrame)
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame)
    }

    void initCamera()

    return () => {
      stopScanning()
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [videoRef, canvasRef, stopScanning])

  const isFiveDigitCode = state.result
    ? FIVE_DIGIT_PATTERN.test(state.result.decodedText)
    : false

  return {
    ...state,
    isFiveDigitCode,
    stopScanning,
    resetResult,
  }
}
