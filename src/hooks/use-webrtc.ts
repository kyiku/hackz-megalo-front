'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type WebRtcRole = 'phone' | 'pc'

type UseWebRtcOptions = {
  readonly wsRef: React.RefObject<WebSocket | null>
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
  wsRef,
  roomId,
  role,
  localStream,
}: UseWebRtcOptions): UseWebRtcReturn {
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const sendSignaling = useCallback(
    (action: string, data: Record<string, unknown>) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN || !roomId) return
      ws.send(JSON.stringify({ action, data: { ...data, roomId } }))
    },
    [wsRef, roomId],
  )

  const createPeerConnection = useCallback(() => {
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
  }, [localStream, sendSignaling])

  const handleOffer = useCallback(
    async (sdp: string) => {
      const pc = createPeerConnection()
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendSignaling('webrtc_answer', { sdp: answer.sdp })
    },
    [createPeerConnection, sendSignaling],
  )

  const handleAnswer = useCallback(async (sdp: string) => {
    const pc = pcRef.current
    if (!pc) return
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }))
  }, [])

  const handleIce = useCallback(async (candidateStr: string) => {
    const pc = pcRef.current
    if (!pc) return
    try {
      const candidate = JSON.parse(candidateStr) as RTCIceCandidateInit
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch {
      // ignore invalid candidates
    }
  }, [])

  // スマホ側: オファーを送信
  const startCall = useCallback(async () => {
    const pc = createPeerConnection()
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendSignaling('webrtc_offer', { sdp: offer.sdp })
  }, [createPeerConnection, sendSignaling])

  // WebSocketメッセージをリッスン
  useEffect(() => {
    const ws = wsRef.current
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
      } catch {
        // ignore
      }
    }

    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [wsRef, roomId, role, handleOffer, handleAnswer, handleIce])

  // スマホ側: ルーム参加後にオファー送信
  useEffect(() => {
    if (role === 'phone' && roomId && localStream) {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return

      // ルーム参加
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { roomId, role: 'phone' },
      }))

      // 少し待ってからオファー送信
      const timer = setTimeout(() => {
        void startCall()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [role, roomId, localStream, wsRef, startCall])

  // PC側: ルーム参加
  useEffect(() => {
    if (role === 'pc' && roomId) {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) return

      ws.send(JSON.stringify({
        action: 'join_room',
        data: { roomId, role: 'pc' },
      }))
    }
  }, [role, roomId, wsRef])

  // クリーンアップ
  useEffect(() => {
    return () => {
      pcRef.current?.close()
      pcRef.current = null
    }
  }, [])

  return { remoteStream, isConnected }
}
