import { apiRequest } from './client'

type YajiFrameUrlResponse = {
  readonly uploadUrl: string
  readonly key: string
}

export async function getYajiFrameUrl(
  sessionId: string,
): Promise<YajiFrameUrlResponse> {
  const result = await apiRequest<YajiFrameUrlResponse>(
    `/api/session/${sessionId}/yaji-frame-url`,
    { method: 'POST' },
  )

  if (!result.success || !result.data) {
    throw new Error(result.error ?? 'やじフレームURLの取得に失敗しました')
  }

  return result.data
}

export async function uploadYajiFrame(
  uploadUrl: string,
  frameBlob: Blob,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: frameBlob,
    headers: { 'Content-Type': 'image/jpeg' },
  })

  if (!response.ok) {
    throw new Error(`Frame upload failed: HTTP ${response.status}`)
  }
}
