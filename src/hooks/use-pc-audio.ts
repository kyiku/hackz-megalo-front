'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'

type AudioContextRef = {
  readonly ctx: AudioContext
  readonly bgmGain: GainNode
  bgmGeneration: number
  bgmOscillators: OscillatorNode[]
  bgmPlaying: boolean
  shutterBuffer: AudioBuffer | null
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
    bgmGeneration: 0,
    bgmOscillators: [],
    bgmPlaying: false,
    shutterBuffer: null,
  }
  ref.current = audioRef
  return audioRef
}

/** Play a tone using Web Audio API scheduling (no setTimeout). */
function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume = 0.3,
  type: OscillatorType = 'sine',
  startDelay = 0,
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency

  const startTime = ctx.currentTime + startDelay
  gain.gain.setValueAtTime(volume, startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)

  // Auto-disconnect after playback to free resources
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
}

/** Create or return cached white noise buffer for shutter sound. */
function getShutterBuffer(audio: AudioContextRef): AudioBuffer {
  if (audio.shutterBuffer) return audio.shutterBuffer

  const { ctx } = audio
  const bufferSize = Math.round(ctx.sampleRate * 0.15)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  audio.shutterBuffer = buffer
  return buffer
}

/** Simple BGM: alternating chord tones in a loop */
function startBgm(audio: AudioContextRef): void {
  if (audio.bgmPlaying) return
  audio.bgmPlaying = true
  audio.bgmGeneration += 1
  const generation = audio.bgmGeneration

  const { ctx, bgmGain } = audio
  const notes = [261.63, 329.63, 392.00, 329.63] // C4, E4, G4, E4
  const interval = 0.5

  const createLoop = () => {
    if (!audio.bgmPlaying || audio.bgmGeneration !== generation) return

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      osc.connect(bgmGain)
      osc.start(ctx.currentTime + i * interval)
      osc.stop(ctx.currentTime + i * interval + interval * 0.8)
      audio.bgmOscillators.push(osc)

      osc.onended = () => {
        osc.disconnect()
        audio.bgmOscillators = audio.bgmOscillators.filter((o) => o !== osc)
        if (i === notes.length - 1) {
          createLoop()
        }
      }
    })
  }

  createLoop()
}

function stopBgm(audio: AudioContextRef): void {
  audio.bgmPlaying = false
  audio.bgmGeneration += 1
  for (const osc of audio.bgmOscillators) {
    try {
      osc.stop()
      osc.disconnect()
    } catch { /* already stopped */ }
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
    const freq = count === 1 ? 880 : 660
    playTone(audio.ctx, freq, 0.3, 0.4, 'sine')
  }, [resumeContext])

  const playShutter = useCallback(() => {
    const audio = resumeContext()
    const { ctx } = audio
    const buffer = getShutterBuffer(audio)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = 0.3
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
    }
  }, [resumeContext])

  const playFanfare = useCallback(() => {
    const audio = resumeContext()
    const { ctx } = audio
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      playTone(ctx, freq, 0.4, 0.3, 'square', i * 0.15)
    })
  }, [resumeContext])

  const playComplete = useCallback(() => {
    const audio = resumeContext()
    const { ctx } = audio
    const notes = [1046.50, 783.99, 659.25, 523.25]
    notes.forEach((freq, i) => {
      playTone(ctx, freq, 0.6, 0.2, 'sine', i * 0.2)
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

  // useMemo で毎レンダー新オブジェクト生成を防止
  return useMemo(() => ({
    playCountdown,
    playShutter,
    playFanfare,
    playComplete,
    startBgm: startBgmAction,
    stopBgm: stopBgmAction,
  }), [playCountdown, playShutter, playFanfare, playComplete, startBgmAction, stopBgmAction])
}
