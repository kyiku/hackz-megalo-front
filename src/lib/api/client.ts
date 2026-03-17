import type { ApiResponse } from './types'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'https://j9q5u6tn5k.execute-api.ap-northeast-1.amazonaws.com/dev'

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = (await response.json()) as T
    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}
