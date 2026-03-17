import { apiRequest } from './client'
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  ProcessStartResponse,
  SessionResponse,
} from './types'

export async function createSession(
  request: CreateSessionRequest,
): Promise<CreateSessionResponse> {
  const result = await apiRequest<CreateSessionResponse>('/api/session', {
    method: 'POST',
    body: JSON.stringify(request),
  })

  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'セッションの作成に失敗しました')
  }

  return result.data
}

export async function getSession(sessionId: string): Promise<SessionResponse> {
  const result = await apiRequest<SessionResponse>(`/api/session/${sessionId}`)

  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'セッション情報の取得に失敗しました')
  }

  return result.data
}

export async function startProcessing(sessionId: string): Promise<ProcessStartResponse> {
  const result = await apiRequest<ProcessStartResponse>(
    `/api/session/${sessionId}/process`,
    { method: 'POST' },
  )

  if (!result.success || !result.data) {
    throw new Error(result.error ?? '処理の開始に失敗しました')
  }

  return result.data
}

export async function uploadPhoto(uploadUrl: string, photoBlob: Blob): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: photoBlob,
    headers: { 'Content-Type': 'image/jpeg' },
  })

  if (!response.ok) {
    throw new Error(`写真のアップロードに失敗しました: HTTP ${response.status}`)
  }
}
