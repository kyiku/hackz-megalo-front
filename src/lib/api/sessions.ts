import { apiRequest } from './client'
import type { CreateSessionRequest, CreateSessionResponse, SessionStatus } from './types'

export async function createSession(
  request: CreateSessionRequest,
): Promise<CreateSessionResponse> {
  const result = await apiRequest<CreateSessionResponse>('/sessions', {
    method: 'POST',
    body: JSON.stringify(request),
  })

  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'Failed to create session')
  }

  return result.data
}

export async function getSessionStatus(sessionId: string): Promise<SessionStatus> {
  const result = await apiRequest<SessionStatus>(`/sessions/${sessionId}`)

  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'Failed to get session status')
  }

  return result.data
}
