import { create } from 'zustand'

type Role = 'pc' | 'phone'

type RoomPhase =
  | 'idle'
  | 'filter-select'
  | 'shooting'
  | 'preview'
  | 'processing'
  | 'result'
  | 'complete'

type RoomState = {
  readonly roomId: string | null
  readonly role: Role | null
  readonly phase: RoomPhase
  readonly phoneConnected: boolean
  readonly selectedFilter: string | null
}

type RoomActions = {
  readonly createRoom: () => string
  readonly joinRoom: (roomId: string, role: Role) => void
  readonly setPhase: (phase: RoomPhase) => void
  readonly setPhoneConnected: (connected: boolean) => void
  readonly setSelectedFilter: (filter: string | null) => void
  readonly leaveRoom: () => void
}

const initialState: RoomState = {
  roomId: null,
  role: null,
  phase: 'idle',
  phoneConnected: false,
  selectedFilter: null,
}

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export const useRoomStore = create<RoomState & RoomActions>()((set) => ({
  ...initialState,

  createRoom: () => {
    const roomId = generateRoomId()
    set({ roomId, role: 'pc', phase: 'idle', phoneConnected: false })
    return roomId
  },

  joinRoom: (roomId, role) =>
    set({ roomId, role }),

  setPhase: (phase) => set({ phase }),

  setPhoneConnected: (connected) => set({ phoneConnected: connected }),

  setSelectedFilter: (filter) => set({ selectedFilter: filter }),

  leaveRoom: () => set(initialState),
}))
