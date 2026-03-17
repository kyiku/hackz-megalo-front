export type SimpleFilterId = 'natural' | 'skin-smooth' | 'brightness' | 'monochrome' | 'sepia'
export type AiFilterId = 'anime' | 'pop-art' | 'watercolor'
export type FilterId = SimpleFilterId | AiFilterId

export type FilterInfo = {
  readonly id: FilterId
  readonly name: string
  readonly description: string
  readonly type: 'simple' | 'ai'
  readonly color: string
  readonly processingTime: string
}

export const SIMPLE_FILTERS: readonly FilterInfo[] = [
  {
    id: 'natural',
    name: 'ナチュラル',
    description: 'そのまま',
    type: 'simple',
    color: '#e8e4de',
    processingTime: '即座',
  },
  {
    id: 'skin-smooth',
    name: '美肌',
    description: 'なめらか補正',
    type: 'simple',
    color: '#f5cac3',
    processingTime: '~1秒',
  },
  {
    id: 'brightness',
    name: '明るさ',
    description: '映える仕上がり',
    type: 'simple',
    color: '#fde68a',
    processingTime: '~1秒',
  },
  {
    id: 'monochrome',
    name: 'モノクロ',
    description: 'レシート映え',
    type: 'simple',
    color: '#404040',
    processingTime: '~1秒',
  },
  {
    id: 'sepia',
    name: 'セピア',
    description: 'レトロ',
    type: 'simple',
    color: '#c4a882',
    processingTime: '~1秒',
  },
] as const

export const AI_FILTERS: readonly FilterInfo[] = [
  {
    id: 'anime',
    name: 'アニメ風',
    description: 'AIが変換',
    type: 'ai',
    color: '#93c5fd',
    processingTime: '~15秒',
  },
  {
    id: 'pop-art',
    name: 'ポップアート',
    description: 'カラフル',
    type: 'ai',
    color: '#f472b6',
    processingTime: '~15秒',
  },
  {
    id: 'watercolor',
    name: '水彩画',
    description: 'やわらか',
    type: 'ai',
    color: '#6ee7b7',
    processingTime: '~15秒',
  },
] as const

export const ALL_FILTERS: readonly FilterInfo[] = [...SIMPLE_FILTERS, ...AI_FILTERS]

import type { AiFilter, SimpleFilter } from './api/types'

type ApiFilter = SimpleFilter | AiFilter

const FILTER_ID_TO_API: Record<FilterId, ApiFilter> = {
  'natural': 'natural',
  'skin-smooth': 'beauty',
  'brightness': 'bright',
  'monochrome': 'mono',
  'sepia': 'sepia',
  'anime': 'anime',
  'pop-art': 'popart',
  'watercolor': 'watercolor',
}

export function toApiFilterName(filterId: FilterId): ApiFilter {
  return FILTER_ID_TO_API[filterId]
}
