'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type UseCountdownOptions = {
  readonly onTick?: (value: number) => void
}

type UseCountdownReturn = {
  readonly count: number | null
  readonly isRunning: boolean
  readonly start: (from?: number) => Promise<void>
}

export function useCountdown(options?: UseCountdownOptions): UseCountdownReturn {
  const [count, setCount] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const resolveRef = useRef<(() => void) | null>(null)
  const onTickRef = useRef(options?.onTick)

  useEffect(() => {
    onTickRef.current = options?.onTick
  }, [options?.onTick])

  useEffect(() => {
    if (!isRunning || count === null || count <= 0) return

    const timer = setTimeout(() => {
      const next = count - 1
      if (next <= 0) {
        setCount(null)
        setIsRunning(false)
        resolveRef.current?.()
        resolveRef.current = null
      } else {
        setCount(next)
        onTickRef.current?.(next)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [count, isRunning])

  const start = useCallback(
    (from = 3): Promise<void> =>
      new Promise<void>((resolve) => {
        resolveRef.current = resolve
        setCount(from)
        setIsRunning(true)
      }),
    [],
  )

  return { count, isRunning, start }
}
