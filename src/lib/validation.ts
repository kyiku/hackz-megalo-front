const ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/
const ROOM_ID_PATTERN = /^[A-Z0-9]{6}$/

export function isValidSessionId(id: string): boolean {
  return ID_PATTERN.test(id)
}

export function isValidRoomId(roomId: string): boolean {
  return ROOM_ID_PATTERN.test(roomId)
}
