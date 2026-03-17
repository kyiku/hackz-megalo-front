import { create } from 'zustand'

const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ?? '').trim()

type WsState = {
  readonly ws: WebSocket | null
  readonly isConnected: boolean
}

type WsActions = {
  readonly connect: (roomId: string, role: 'pc' | 'phone') => void
  readonly disconnect: () => void
  readonly send: (action: string, data: Record<string, unknown>) => void
}

export const useWsStore = create<WsState & WsActions>()((set, get) => ({
  ws: null,
  isConnected: false,

  connect: (roomId, role) => {
    const current = get().ws
    if (current) {
      current.close()
    }

    if (!WS_URL) return

    const ws = new WebSocket(WS_URL)

    ws.addEventListener('open', () => {
      set({ isConnected: true })
      ws.send(JSON.stringify({
        action: 'join_room',
        data: { roomId, role },
      }))
    })

    ws.addEventListener('close', () => {
      set({ isConnected: false })

      // 再接続（指数バックオフ）
      const currentWs = get().ws
      if (currentWs === ws) {
        setTimeout(() => {
          const stillSame = get().ws === ws
          if (stillSame) {
            get().connect(roomId, role)
          }
        }, 2000)
      }
    })

    ws.addEventListener('error', () => {
      ws.close()
    })

    set({ ws })
  },

  disconnect: () => {
    const ws = get().ws
    if (ws) {
      set({ ws: null, isConnected: false })
      ws.close()
    }
  },

  send: (action, data) => {
    const ws = get().ws
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ action, data }))
  },
}))
