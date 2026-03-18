export type Tool = 'pen' | 'stamp' | 'text' | 'move'

export type PenColor = '#1a1a1a' | '#e05280' | '#ffffff' | '#d4a520' | '#2aaa6a' | '#93c5fd'
export type PenSize = 2 | 4 | 8 | 14

export type StampId = 'heart' | 'star' | 'sparkle' | 'ribbon' | 'flower' | 'music'

export type Stamp = {
  readonly id: StampId
  readonly label: string
  readonly svg: string
}

export type DoodleLayer =
  | { readonly type: 'path'; readonly points: readonly { x: number; y: number }[]; readonly color: string; readonly size: number }
  | { readonly type: 'stamp'; readonly stampId: StampId; readonly x: number; readonly y: number; readonly scale: number; readonly rotation: number }
  | { readonly type: 'text'; readonly content: string; readonly x: number; readonly y: number; readonly color: string; readonly fontSize: number; readonly rotation: number }

export const PEN_COLORS: readonly PenColor[] = [
  '#1a1a1a',
  '#e05280',
  '#ffffff',
  '#d4a520',
  '#2aaa6a',
  '#93c5fd',
]

export const PEN_SIZES: readonly PenSize[] = [2, 4, 8, 14]

export const STAMPS: readonly Stamp[] = [
  { id: 'heart', label: 'ハート', svg: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
  { id: 'star', label: '星', svg: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { id: 'sparkle', label: 'キラキラ', svg: 'M12 2L14 9L22 9L16 14L18 22L12 18L6 22L8 14L2 9L10 9L12 2Z' },
  { id: 'ribbon', label: 'リボン', svg: 'M12 2C9 2 7 4 7 6c0 1.5.8 2.8 2 3.5V11H9l-4 8h3l1-2 1 2h4l1-2 1 2h3l-4-8h-0V9.5c1.2-.7 2-2 2-3.5 0-2-2-4-5-4z' },
  { id: 'flower', label: '花', svg: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm0-18C9.8 4 8 5.8 8 8c0 2.5 2 4.5 3 7h2c1-2.5 3-4.5 3-7 0-2.2-1.8-4-4-4z' },
  { id: 'music', label: '音符', svg: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z' },
]

export const STAMP_SCALES = [1, 1.5, 2, 3, 4] as const
