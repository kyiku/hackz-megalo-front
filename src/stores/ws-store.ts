import { create } from 'zustand'

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ?? '').trim()

type WsState = {
  readonly ws: WebSocket | null
  readonly isConnected: boolean
  readonly roomId: string | null
  readonly role: 'pc' | 'phone' | null
}

type WsActions = {
  readonly connect: (roomId: string, role: 'pc' | 'phone') => void
  readonly disconnect: () => void
  readonly send: (action: string, data: Record<string, unknown>) => void
}

export const useWsStore = create<WsState & WsActions>()((set, get) => ({
  ws: null,
  isConnected: false,
  roomId: null,
  role: null,

  connect: (roomId, role) => {
    const state = get()

    // 既に同じルームに接続済みならスキップ
    if (state.ws && state.roomId === roomId && state.role === role) {
      if (state.ws.readyState === WebSocket.OPEN || state.ws.readyState === WebSocket.CONNECTING) {
        return
      }
    }

    // 既存接続があれば閉じる（再接続ループを防ぐためnullに先にセット）
    if (state.ws) {
      const oldWs = state.ws
      set({ ws: null, isConnected: false })
      oldWs.close()
    }

    if (!WS_URL) return

    set({ roomId, role })

    const ws = new WebSocket(WS_URL)

    ws.addEventListener('open', () => {
      set({ isConnected: true })
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { roomId, role },
      }))
    })

    ws.addEventListener('close', () => {
      // 現在のwsと一致する場合のみ再接続
      const current = get()
      if (current.ws !== ws) return

      set({ isConnected: false })

      // 再接続
      if (current.roomId && current.role) {
        const reconnectRoomId = current.roomId
        const reconnectRole = current.role
        setTimeout(() => {
          const still = get()
          // wsがnullのままなら（他のconnectが走っていなければ）再接続
          if (still.ws === ws || still.ws === null) {
            set({ ws: null })
            get().connect(reconnectRoomId, reconnectRole)
          }
        }, 2000)
      }
    })

    ws.addEventListener('error', () => {
      if (process.env.NODE_ENV === 'development') {
        console.error('WebSocket connection error')
      }
    })

    set({ ws })
  },

  disconnect: () => {
    const state = get()
    set({ ws: null, isConnected: false, roomId: null, role: null })
    if (state.ws) {
      state.ws.close()
    }
  },

  send: (action, data) => {
    const ws = get().ws
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ action, data }))
  },
}))
