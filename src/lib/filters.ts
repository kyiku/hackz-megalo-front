export type SimpleFilterId = 'natural' | 'skin-smooth' | 'brightness' | 'monochrome' | 'sepia'
export type AiFilterId = 'anime' | 'pop-art' | 'watercolor'
export type FilterId = SimpleFilterId | AiFilterId

export type FilterInfo = {
  readonly id: FilterId
  readonly name: string
  readonly description: string
  readonly type: 'simple' | 'ai'
  readonly emoji: string
  readonly processingTime: string
}

export const SIMPLE_FILTERS: readonly FilterInfo[] = [
  {
    id: 'natural',
    name: 'ナチュラル',
    description: 'そのまま、ありのままで',
    type: 'simple',
    emoji: '✨',
    processingTime: '即座',
  },
  {
    id: 'skin-smooth',
    name: '美肌',
    description: 'つるすべ肌に補正',
    type: 'simple',
    emoji: '🍑',
    processingTime: '~1秒',
  },
  {
    id: 'brightness',
    name: '明るさ補正',
    description: 'パッと明るく映える',
    type: 'simple',
    emoji: '☀️',
    processingTime: '~1秒',
  },
  {
    id: 'monochrome',
    name: 'モノクロ',
    description: 'レシートとの相性バツグン',
    type: 'simple',
    emoji: '🖤',
    processingTime: '~1秒',
  },
  {
    id: 'sepia',
    name: 'セピア',
    description: 'エモいレトロ感',
    type: 'simple',
    emoji: '📷',
    processingTime: '~1秒',
  },
] as const

export const AI_FILTERS: readonly FilterInfo[] = [
  {
    id: 'anime',
    name: 'アニメ風',
    description: 'AIがイラスト風に変換',
    type: 'ai',
    emoji: '🎨',
    processingTime: '~15秒',
  },
  {
    id: 'pop-art',
    name: 'ポップアート',
    description: 'カラフルでポップに',
    type: 'ai',
    emoji: '🎪',
    processingTime: '~15秒',
  },
  {
    id: 'watercolor',
    name: '水彩画',
    description: 'やわらかい水彩タッチ',
    type: 'ai',
    emoji: '🌊',
    processingTime: '~15秒',
  },
] as const

export const ALL_FILTERS: readonly FilterInfo[] = [...SIMPLE_FILTERS, ...AI_FILTERS]
