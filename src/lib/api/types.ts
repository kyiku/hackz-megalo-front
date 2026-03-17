export type ApiResponse<T> = {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
}

export type SimpleFilter = 'natural' | 'beauty' | 'bright' | 'mono' | 'sepia'
export type AiFilter = 'anime' | 'popart' | 'watercolor'

export type CreateSessionRequest = {
  readonly filterType: 'simple' | 'ai'
  readonly filter: SimpleFilter | AiFilter
  readonly photoCount: number
}

export type UploadUrl = {
  readonly index: number
  readonly url: string
}

export type CreateSessionResponse = {
  readonly sessionId: string
  readonly uploadUrls: readonly UploadUrl[]
  readonly websocketUrl: string
}

export type SessionStatus =
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'printed'
  | 'failed'

export type SessionResponse = {
  readonly sessionId: string
  readonly status: SessionStatus
  readonly filterType: 'simple' | 'ai'
  readonly filter: string
  readonly caption?: string
  readonly collageImageUrl?: string
  readonly createdAt: string
}

export type ProcessStartResponse = {
  readonly sessionId: string
  readonly status: 'processing'
}

export type WsProgressEvent = {
  readonly type: 'statusUpdate'
  readonly data: {
    readonly sessionId: string
    readonly status: string
    readonly step: string
    readonly progress: number
    readonly message: string
  }
}

export type WsCompletedEvent = {
  readonly type: 'completed'
  readonly data: {
    readonly sessionId: string
    readonly collageImageUrl: string
  }
}

export type WsErrorEvent = {
  readonly type: 'error'
  readonly data: {
    readonly sessionId: string
    readonly message: string
  }
}

export type WsEvent = WsProgressEvent | WsCompletedEvent | WsErrorEvent
