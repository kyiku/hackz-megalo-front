'use client'

import { useCallback, useEffect, useRef } from 'react'

type AudioContextRef = {
  readonly ctx: AudioContext
  readonly bgmGain: GainNode
  bgmOscillators: OscillatorNode[]
  bgmPlaying: boolean
}

function getAudioContext(ref: React.MutableRefObject<AudioContextRef | null>): AudioContextRef {
  if (ref.current) return ref.current

  const ctx = new AudioContext()
  const bgmGain = ctx.createGain()
  bgmGain.gain.value = 0.08
  bgmGain.connect(ctx.destination)

  const audioRef: AudioContextRef = {
    ctx,
    bgmGain,
    bgmOscillators: [],
    bgmPlaying: false,
  }
  ref.current = audioRef
  return audioRef
}

/** Beep tone helper */
function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume = 0.3,
  type: OscillatorType = 'sine',
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

/** Simple BGM: alternating chord tones in a loop */
function startBgm(audio: AudioContextRef): void {
  if (audio.bgmPlaying) return
  audio.bgmPlaying = true

  const { ctx, bgmGain } = audio
  const notes = [261.63, 329.63, 392.00, 329.63] // C4, E4, G4, E4
  const interval = 0.5

  const createLoop = () => {
    if (!audio.bgmPlaying) return

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      osc.connect(bgmGain)
      osc.start(ctx.currentTime + i * interval)
      osc.stop(ctx.currentTime + i * interval + interval * 0.8)
      audio.bgmOscillators.push(osc)

      if (i === notes.length - 1) {
        osc.onended = () => {
          audio.bgmOscillators = audio.bgmOscillators.filter((o) => o !== osc)
          createLoop()
        }
      }
    })
  }

  createLoop()
}

function stopBgm(audio: AudioContextRef): void {
  audio.bgmPlaying = false
  for (const osc of audio.bgmOscillators) {
    try { osc.stop() } catch { /* already stopped */ }
  }
  audio.bgmOscillators = []
}

export type PcAudioActions = {
  readonly playCountdown: (count: number) => void
  readonly playShutter: () => void
  readonly playFanfare: () => void
  readonly playComplete: () => void
  readonly startBgm: () => void
  readonly stopBgm: () => void
}

export function usePcAudio(): PcAudioActions {
  const audioRef = useRef<AudioContextRef | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        stopBgm(audioRef.current)
        audioRef.current.ctx.close().catch(() => undefined)
        audioRef.current = null
      }
    }
  }, [])

  const resumeContext = useCallback(() => {
    const audio = getAudioContext(audioRef)
    if (audio.ctx.state === 'suspended') {
      audio.ctx.resume().catch(() => undefined)
    }
    return audio
  }, [])

  const playCountdown = useCallback((count: number) => {
    const audio = resumeContext()
    // Higher pitch for count 1 (final)
    const freq = count === 1 ? 880 : 660
    playTone(audio.ctx, freq, 0.3, 0.4, 'sine')
  }, [resumeContext])

  const playShutter = useCallback(() => {
    const audio = resumeContext()
    // White noise burst for shutter
    const { ctx } = audio
    const bufferSize = ctx.sampleRate * 0.15
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = 0.3
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
  }, [resumeContext])

  const playFanfare = useCallback(() => {
    const audio = resumeContext()
    const { ctx } = audio
    // Ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      playTone(ctx, freq, 0.4, 0.3, 'square')
      setTimeout(() => playTone(ctx, freq, 0.4, 0.3, 'square'), i * 150)
    })
  }, [resumeContext])

  const playComplete = useCallback(() => {
    const audio = resumeContext()
    const { ctx } = audio
    // Descending soft chime
    const notes = [1046.50, 783.99, 659.25, 523.25]
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(ctx, freq, 0.6, 0.2, 'sine'), i * 200)
    })
  }, [resumeContext])

  const startBgmAction = useCallback(() => {
    const audio = resumeContext()
    startBgm(audio)
  }, [resumeContext])

  const stopBgmAction = useCallback(() => {
    if (audioRef.current) {
      stopBgm(audioRef.current)
    }
  }, [])

  return {
    playCountdown,
    playShutter,
    playFanfare,
    playComplete,
    startBgm: startBgmAction,
    stopBgm: stopBgmAction,
  }
}
