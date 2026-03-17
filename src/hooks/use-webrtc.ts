'use client'

import { useEffect, useRef, useState } from 'react'

type WebRtcRole = 'phone' | 'pc'

type UseWebRtcOptions = {
  readonly ws: WebSocket | null
  readonly roomId: string | null
  readonly role: WebRtcRole
  readonly localStream?: MediaStream | null
}

type UseWebRtcReturn = {
  readonly remoteStream: MediaStream | null
  readonly isConnected: boolean
  readonly iceState: string | null
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export function useWebRtc({
  ws,
  roomId,
  role,
  localStream,
}: UseWebRtcOptions): UseWebRtcReturn {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [iceState, setIceState] = useState<string | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([])

  // 全てのロジックを1つのuseEffectに集約
  useEffect(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !roomId) return

    const sendSignal = (action: string, data: Record<string, unknown>) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action, data: { ...data, roomId } }))
      }
    }

    const createPC = (): RTCPeerConnection => {
      pcRef.current?.close()

      const pc = new RTCPeerConnection(RTC_CONFIG)
      pcRef.current = pc

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('webrtc_ice', { candidate: JSON.stringify(event.candidate) })
        }
      }

      pc.ontrack = (event) => {
        const stream = event.streams[0]
        if (stream) setRemoteStream(stream)
      }

      pc.onconnectionstatechange = () => {
        setIsConnected(pc.connectionState === 'connected')
      }

      pc.oniceconnectionstatechange = () => {
        setIceState(pc.iceConnectionState)
      }

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream)
        })
      }

      return pc
    }

    const flushQueue = async (pc: RTCPeerConnection) => {
      const queue = iceCandidateQueueRef.current
      iceCandidateQueueRef.current = []
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch { /* ignore */ }
      }
    }

    const handleMessage = async (event: MessageEvent) => {
      let msg: { type: string; data: { sdp?: string; candidate?: string } }
      try {
        msg = JSON.parse(event.data as string)
      } catch {
        return
      }

      // PC側: offerを受信 → answer返す
      if (msg.type === 'webrtc_offer' && role === 'pc') {
        try {
          const pc = createPC()
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: msg.data.sdp ?? '' }))
          await flushQueue(pc)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          sendSignal('webrtc_answer', { sdp: answer.sdp })
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to handle offer:', err)
          }
        }
      }

      // スマホ側: answerを受信
      if (msg.type === 'webrtc_answer' && role === 'phone') {
        try {
          const pc = pcRef.current
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: msg.data.sdp ?? '' }))
            await flushQueue(pc)
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to handle answer:', err)
          }
        }
      }

      // ICE candidate
      if (msg.type === 'webrtc_ice') {
        try {
          const candidate = JSON.parse(msg.data.candidate ?? '{}') as RTCIceCandidateInit
          const pc = pcRef.current
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } else {
            iceCandidateQueueRef.current = [...iceCandidateQueueRef.current, candidate]
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to handle ICE:', err)
          }
        }
      }
    }

    ws.addEventListener('message', handleMessage)

    // スマホ側: カメラ映像があればオファー送信
    let startCallTimer: ReturnType<typeof setTimeout> | null = null
    if (role === 'phone' && localStream) {
      startCallTimer = setTimeout(async () => {
        try {
          const pc = createPC()
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          sendSignal('webrtc_offer', { sdp: offer.sdp })
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to start call:', err)
          }
        }
      }, 500)
    }

    return () => {
      ws.removeEventListener('message', handleMessage)
      if (startCallTimer) clearTimeout(startCallTimer)
      pcRef.current?.close()
      pcRef.current = null
      iceCandidateQueueRef.current = []
      setRemoteStream(null)
      setIsConnected(false)
      setIceState(null)
    }
  }, [ws, roomId, role, localStream])

  return { remoteStream, isConnected, iceState }
}
