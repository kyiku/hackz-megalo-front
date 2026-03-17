export type ApiResponse<T> = {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
}

export type CreateSessionRequest = {
  readonly filterType: 'simple' | 'ai'
  readonly filter: string
  readonly photoCount: number
}

export type CreateSessionResponse = {
  readonly sessionId: string
  readonly uploadUrls: readonly string[]
}

export type SessionStatus = {
  readonly sessionId: string
  readonly status: 'uploading' | 'processing' | 'complete' | 'error'
  readonly step?: string
  readonly collageUrl?: string
  readonly caption?: string
}
