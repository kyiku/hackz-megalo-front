'use client'

import { useEffect, useRef, useState } from 'react'

// AppSync API Key はクライアント公開前提の読み取り専用キー
// WAF + API Keyスコープで保護（ハッカソン用途）
const APPSYNC_URL = process.env.NEXT_PUBLIC_APPSYNC_URL ?? ''
const APPSYNC_API_KEY = process.env.NEXT_PUBLIC_APPSYNC_API_KEY ?? ''
const POLL_INTERVAL_MS = 10000

type FilterRankingItem = {
  readonly filter: string
  readonly count: number
}

type Stats = {
  readonly totalSessions: number
  readonly avgProcessingTime: number
  readonly todaySessions: number
  readonly filterRanking: readonly FilterRankingItem[]
}

const DEFAULT_STATS: Stats = {
  totalSessions: 0,
  avgProcessingTime: 0,
  todaySessions: 0,
  filterRanking: [],
}

const STATS_QUERY = `
  query GetStats {
    getStats {
      totalSessions
      avgProcessingTime
      todaySessions
      filterRanking {
        filter
        count
      }
    }
  }
`

type GraphQLResponse = {
  readonly data?: { readonly getStats?: Stats }
  readonly errors?: readonly { readonly message: string }[]
}

function isValidStats(value: unknown): value is Stats {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.totalSessions === 'number' &&
    typeof obj.avgProcessingTime === 'number' &&
    typeof obj.todaySessions === 'number' &&
    Array.isArray(obj.filterRanking)
  )
}

async function fetchStats(): Promise<{ readonly stats: Stats; readonly error: string | null }> {
  if (!APPSYNC_URL || !APPSYNC_API_KEY) {
    return { stats: DEFAULT_STATS, error: null }
  }

  try {
    const response = await fetch(APPSYNC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': APPSYNC_API_KEY,
      },
      body: JSON.stringify({ query: STATS_QUERY }),
    })

    if (!response.ok) {
      return { stats: DEFAULT_STATS, error: `HTTP ${response.status}` }
    }

    const body = (await response.json()) as GraphQLResponse

    if (body.errors && body.errors.length > 0) {
      return { stats: DEFAULT_STATS, error: body.errors[0]?.message ?? 'GraphQL error' }
    }

    const data = body.data?.getStats
    if (!isValidStats(data)) {
      return { stats: DEFAULT_STATS, error: null }
    }

    return { stats: data, error: null }
  } catch {
    return { stats: DEFAULT_STATS, error: '通信エラー' }
  }
}

export function useStats(): {
  readonly stats: Stats
  readonly isLoading: boolean
  readonly error: string | null
} {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const visibleRef = useRef(true)

  // Page Visibility API でバックグラウンドタブのポーリングを抑制
  useEffect(() => {
    const handler = () => {
      visibleRef.current = !document.hidden
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      if (!visibleRef.current) return
      const result = await fetchStats()
      if (cancelled) return
      setStats(result.stats)
      setError(result.error)
      setIsLoading(false)
    }

    void poll()

    const interval = setInterval(() => {
      void poll()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return { stats, isLoading, error }
}
