'use client'

import { useCallback, useEffect, useRef } from 'react'

const TRIGGER_WORDS = ['撮って', '撮影', 'チーズ', 'はい', 'とって', 'パシャ', 'カシャ']

type SpeechRecognitionEvent = Event & {
  readonly results: SpeechRecognitionResultList
  readonly resultIndex: number
}

type SpeechRecognitionInstance = EventTarget & {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

type UseVoiceCommandOptions = {
  readonly isActive: boolean
  readonly onTrigger: () => void
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const w = globalThis as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionConstructor | null
}

export function useVoiceCommand({ isActive, onTrigger }: UseVoiceCommandOptions): {
  readonly isSupported: boolean
} {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const onTriggerRef = useRef(onTrigger)
  const cooldownRef = useRef(false)

  useEffect(() => {
    onTriggerRef.current = onTrigger
  }, [onTrigger])

  const handleResult = useCallback((e: Event) => {
    const event = e as SpeechRecognitionEvent
    if (cooldownRef.current) return

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      if (!result) continue

      for (let j = 0; j < result.length; j++) {
        const transcript = result[j]?.transcript ?? ''
        const matched = TRIGGER_WORDS.some((word) => transcript.includes(word))
        if (matched) {
          cooldownRef.current = true
          onTriggerRef.current()
          // 3秒クールダウン（連続発火防止）
          setTimeout(() => { cooldownRef.current = false }, 3000)
          return
        }
      }
    }
  }, [])

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition || !isActive) {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'ja-JP'

    recognition.addEventListener('result', handleResult)

    // 認識が途切れたら自動再開
    recognition.addEventListener('end', () => {
      if (isActive && recognitionRef.current === recognition) {
        try { recognition.start() } catch { /* already started */ }
      }
    })

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      // マイクアクセス拒否等
    }

    return () => {
      recognitionRef.current = null
      recognition.abort()
    }
  }, [isActive, handleResult])

  return { isSupported: getSpeechRecognition() !== null }
}
