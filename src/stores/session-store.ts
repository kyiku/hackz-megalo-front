import { create } from 'zustand'

type FilterType = 'simple' | 'ai'

type SimpleFilter = 'natural' | 'skin-smooth' | 'brightness' | 'monochrome' | 'sepia'
type AiFilter = 'anime' | 'pop-art' | 'watercolor'

type Filter = {
  readonly type: FilterType
  readonly value: SimpleFilter | AiFilter
}

type ProcessingStep =
  | 'uploading'
  | 'face-detection'
  | 'filter-apply'
  | 'collage-generate'
  | 'print-prepare'
  | 'complete'

type SessionState = {
  readonly sessionId: string | null
  readonly filter: Filter | null
  readonly photos: readonly string[]
  readonly processingStep: ProcessingStep | null
  readonly collageUrl: string | null
  readonly caption: string | null
}

type SessionActions = {
  readonly setFilter: (filter: Filter) => void
  readonly addPhoto: (photoDataUrl: string) => void
  readonly replacePhoto: (index: number, photoDataUrl: string) => void
  readonly clearPhotos: () => void
  readonly startSession: (sessionId: string) => void
  readonly setProcessingStep: (step: ProcessingStep) => void
  readonly setResult: (collageUrl: string, caption: string | null) => void
  readonly reset: () => void
}

const initialState: SessionState = {
  sessionId: null,
  filter: null,
  photos: [],
  processingStep: null,
  collageUrl: null,
  caption: null,
}

export const useSessionStore = create<SessionState & SessionActions>()((set) => ({
  ...initialState,

  setFilter: (filter) => set({ filter }),

  addPhoto: (photoDataUrl) =>
    set((state) => ({
      photos: [...state.photos, photoDataUrl],
    })),

  replacePhoto: (index, photoDataUrl) =>
    set((state) => ({
      photos: state.photos.map((photo, i) => (i === index ? photoDataUrl : photo)),
    })),

  clearPhotos: () => set({ photos: [] }),

  startSession: (sessionId) => set({ sessionId }),

  setProcessingStep: (step) => set({ processingStep: step }),

  setResult: (collageUrl, caption) =>
    set({ collageUrl, caption, processingStep: 'complete' }),

  reset: () => set(initialState),
}))
