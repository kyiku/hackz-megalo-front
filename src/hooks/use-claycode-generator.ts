'use client'

import { useCallback, useRef } from 'react'

const GENERATION_TIMEOUT_MS = 15000

type GeneratorState = {
  iframe: HTMLIFrameElement | null
  ready: boolean
  readyPromise: Promise<void> | null
}

/**
 * ClayCode Image Generator hook.
 * Uses a hidden iframe running the ClayCode webapp to generate
 * hedgehog-shaped ClayCode images from 5-digit download codes.
 */
export function useClaycodeGenerator(): {
  readonly generate: (downloadCode: string) => Promise<string>
} {
  const stateRef = useRef<GeneratorState>({
    iframe: null,
    ready: false,
    readyPromise: null,
  })

  const ensureIframe = useCallback((): Promise<void> => {
    const state = stateRef.current
    if (state.ready) return Promise.resolve()
    if (state.readyPromise) return state.readyPromise

    state.readyPromise = new Promise<void>((resolve) => {
      const iframe = document.createElement('iframe')
      iframe.src = '/claycode/generate.html'
      iframe.style.cssText = 'position:fixed;width:1px;height:1px;top:-10px;left:-10px;opacity:0;pointer-events:none;'
      document.body.appendChild(iframe)
      state.iframe = iframe

      const handler = (event: MessageEvent) => {
        if (event.data?.type === 'ready') {
          window.removeEventListener('message', handler)
          state.ready = true
          resolve()
        }
      }
      window.addEventListener('message', handler)
    })

    return state.readyPromise
  }, [])

  const generate = useCallback(async (downloadCode: string): Promise<string> => {
    await ensureIframe()

    const state = stateRef.current
    const iframe = state.iframe
    if (!iframe?.contentWindow) {
      throw new Error('ClayCode iframe not available')
    }

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        window.removeEventListener('message', handler)
        reject(new Error('ClayCode generation timed out'))
      }, GENERATION_TIMEOUT_MS)

      const handler = (event: MessageEvent) => {
        if (event.data?.type === 'result') {
          clearTimeout(timer)
          window.removeEventListener('message', handler)
          resolve(event.data.dataUrl as string)
        }
        if (event.data?.type === 'error') {
          clearTimeout(timer)
          window.removeEventListener('message', handler)
          reject(new Error(event.data.error as string))
        }
      }

      window.addEventListener('message', handler)
      iframe.contentWindow?.postMessage({ type: 'generate', downloadCode }, '*')
    })
  }, [ensureIframe])

  return { generate }
}
