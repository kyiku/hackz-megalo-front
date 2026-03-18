import { create } from 'zustand'

import { isValidRoomId } from '@/lib/validation'

type Role = 'pc' | 'phone'

type RoomPhase =
  | 'idle'
  | 'filter-select'
  | 'shooting'
  | 'preview'
  | 'doodle'
  | 'processing'
  | 'result'
  | 'complete'

type RoomState = {
  readonly roomId: string | null
  readonly role: Role | null
  readonly phase: RoomPhase
  readonly phoneConnected: boolean
  readonly selectedFilter: string | null
  readonly sessionId: string | null
  readonly previewPhotos: readonly string[]
}

type RoomActions = {
  readonly createRoom: () => string
  readonly joinRoom: (roomId: string, role: Role) => void
  readonly setPhase: (phase: RoomPhase) => void
  readonly setPhoneConnected: (connected: boolean) => void
  readonly setSelectedFilter: (filter: string | null) => void
  readonly setSessionId: (sessionId: string | null) => void
  readonly setPreviewPhotos: (photos: readonly string[] | ((prev: readonly string[]) => readonly string[])) => void
  readonly leaveRoom: () => void
}

const initialState: RoomState = {
  roomId: null,
  role: null,
  phase: 'idle',
  phoneConnected: false,
  selectedFilter: null,
  sessionId: null,
  previewPhotos: [],
}

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const limit = Math.floor(256 / chars.length) * chars.length
  const result: string[] = []
  while (result.length < 6) {
    const array = new Uint8Array(1)
    crypto.getRandomValues(array)
    const byte = array[0]
    if (byte !== undefined && byte < limit) {
      result.push(chars[byte % chars.length] ?? 'A')
    }
  }
  return result.join('')
}

export const useRoomStore = create<RoomState & RoomActions>()((set) => ({
  ...initialState,

  createRoom: () => {
    const roomId = generateRoomId()
    set({ roomId, role: 'pc', phase: 'idle', phoneConnected: false })
    return roomId
  },

  joinRoom: (roomId, role) => {
    if (!isValidRoomId(roomId)) {
      throw new Error('Invalid room ID')
    }
    set({ roomId, role })
  },

  setPhase: (phase) => set({ phase }),

  setPhoneConnected: (connected) => set({ phoneConnected: connected }),

  setSelectedFilter: (filter) => set({ selectedFilter: filter }),

  setSessionId: (sessionId) => set({ sessionId }),

  setPreviewPhotos: (photos) => set((state) => ({
    previewPhotos: typeof photos === 'function' ? photos(state.previewPhotos) : photos,
  })),

  leaveRoom: () => set(initialState),
}))
