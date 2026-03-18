'use client'

import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useClaycodeScanner } from '@/lib/claycode/use-claycode-scanner'

export default function ScanPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [opencvLoaded, setOpencvLoaded] = useState(false)

  const { isReady, fps, result, isFiveDigitCode, resetResult, error } =
    useClaycodeScanner(videoRef, canvasRef)

  const handleNavigate = useCallback(() => {
    if (result && isFiveDigitCode) {
      router.push(`/download/${result.decodedText}`)
    }
  }, [result, isFiveDigitCode, router])

  useEffect(() => {
    if (result && isFiveDigitCode) {
      const timer = setTimeout(() => {
        handleNavigate()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [result, isFiveDigitCode, handleNavigate])

  return (
    <div className="fixed inset-0 bg-black">
      <Script
        src="https://docs.opencv.org/4.10.0/opencv.js"
        strategy="afterInteractive"
        onLoad={() => setOpencvLoaded(true)}
      />

      {/* Camera video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-4">
        <h1 className="text-center text-lg font-bold text-white">
          ClayCodeをスキャン
        </h1>
        {!opencvLoaded && (
          <p className="mt-1 text-center text-xs text-white/70">
            ライブラリ読み込み中...
          </p>
        )}
        {opencvLoaded && !isReady && !error && (
          <p className="mt-1 text-center text-xs text-white/70">
            カメラ準備中...
          </p>
        )}
        {error && (
          <p className="mt-1 text-center text-xs text-red-400">{error}</p>
        )}
      </div>

      {/* Scan target overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="relative aspect-square w-[70vmin]">
          {/* Corner brackets */}
          <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-white" />
          <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-white" />
          <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-white" />
          <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-white" />

          {/* Scanning animation line */}
          {isReady && !result && (
            <div className="absolute left-2 right-2 top-0 h-0.5 animate-bounce bg-green-400/80" />
          )}
        </div>
      </div>

      {/* FPS counter (debug) */}
      {isReady && (
        <div className="absolute bottom-4 left-4 z-10 rounded bg-black/50 px-2 py-1">
          <p className="font-mono text-[10px] text-white/60">
            {fps.toFixed(1)} FPS
          </p>
        </div>
      )}

      {/* Result modal */}
      {result && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
          <div className="mx-6 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="text-center">
              <p className="text-sm text-gray-500">ClayCode 検出</p>
              <p className="mt-2 break-all text-2xl font-bold text-gray-900">
                {result.decodedText}
              </p>

              {isFiveDigitCode ? (
                <div className="mt-4">
                  <p className="text-sm text-green-600">
                    ダウンロードページへ移動します...
                  </p>
                  <button
                    onClick={handleNavigate}
                    className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white active:bg-blue-700"
                    type="button"
                  >
                    今すぐ移動
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">テキストが検出されました</p>
                </div>
              )}

              <button
                onClick={resetResult}
                className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-100"
                type="button"
              >
                スキャンを続ける
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
