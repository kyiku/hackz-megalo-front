'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

export function useWebRtc({
  ws,
  roomId,
  role,
  localStream,
}: UseWebRtcOptions): UseWebRtcReturn {
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([])
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const closePeerConnection = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    iceCandidateQueueRef.current = []
  }, [])

  const sendSignaling = useCallback(
    (action: string, data: Record<string, unknown>) => {
      if (!ws || ws.readyState !== WebSocket.OPEN || !roomId) return
      ws.send(JSON.stringify({ action, data: { ...data, roomId } }))
    },
    [ws, roomId],
  )

  const flushIceCandidateQueue = useCallback(async (pc: RTCPeerConnection) => {
    const queue = iceCandidateQueueRef.current
    iceCandidateQueueRef.current = []
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to add queued ICE candidate:', err)
        }
      }
    }
  }, [])

  const createPeerConnection = useCallback(() => {
    closePeerConnection()

    const pc = new RTCPeerConnection(RTC_CONFIG)
    pcRef.current = pc

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignaling('webrtc_ice', { candidate: JSON.stringify(event.candidate) })
      }
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      if (stream) {
        setRemoteStream(stream)
      }
    }

    pc.onconnectionstatechange = () => {
      setIsConnected(pc.connectionState === 'connected')
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream)
      })
    }

    return pc
  }, [localStream, sendSignaling, closePeerConnection])

  const handleOffer = useCallback(
    async (sdp: string) => {
      try {
        const pc = createPeerConnection()
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }))
        await flushIceCandidateQueue(pc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignaling('webrtc_answer', { sdp: answer.sdp })
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to handle WebRTC offer:', err)
        }
      }
    },
    [createPeerConnection, sendSignaling, flushIceCandidateQueue],
  )

  const handleAnswer = useCallback(async (sdp: string) => {
    try {
      const pc = pcRef.current
      if (!pc) return
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }))
      await flushIceCandidateQueue(pc)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to handle WebRTC answer:', err)
      }
    }
  }, [flushIceCandidateQueue])

  const handleIce = useCallback(async (candidateStr: string) => {
    try {
      const candidate = JSON.parse(candidateStr) as RTCIceCandidateInit
      const pc = pcRef.current
      if (!pc || !pc.remoteDescription) {
        iceCandidateQueueRef.current = [...iceCandidateQueueRef.current, candidate]
        return
      }
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to add ICE candidate:', err)
      }
    }
  }, [])

  const startCall = useCallback(async () => {
    try {
      const pc = createPeerConnection()
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendSignaling('webrtc_offer', { sdp: offer.sdp })
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to start WebRTC call:', err)
      }
    }
  }, [createPeerConnection, sendSignaling])

  // WebSocketメッセージをリッスン（wsが変わると再登録）
  useEffect(() => {
    if (!ws || !roomId) return

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: { sdp?: string; candidate?: string }
        }

        if (msg.type === 'webrtc_offer' && role === 'pc') {
          void handleOffer(msg.data.sdp ?? '')
        }
        if (msg.type === 'webrtc_answer' && role === 'phone') {
          void handleAnswer(msg.data.sdp ?? '')
        }
        if (msg.type === 'webrtc_ice') {
          void handleIce(msg.data.candidate ?? '')
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to parse WebRTC signaling:', err)
        }
      }
    }

    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [ws, roomId, role, handleOffer, handleAnswer, handleIce])

  // スマホ側: WebSocket接続後にオファー送信
  useEffect(() => {
    if (role !== 'phone' || !roomId || !localStream) return
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    const timer = setTimeout(() => {
      void startCall()
    }, 1000)

    return () => clearTimeout(timer)
  }, [role, roomId, localStream, ws, startCall])

  // クリーンアップ
  useEffect(() => {
    return () => {
      closePeerConnection()
    }
  }, [closePeerConnection])

  return { remoteStream, isConnected }
}
