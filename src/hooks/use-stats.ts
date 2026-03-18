'use client'

import { useCallback, useEffect, useState } from 'react'

const APPSYNC_URL = process.env.NEXT_PUBLIC_APPSYNC_URL ?? ''
const APPSYNC_API_KEY = process.env.NEXT_PUBLIC_APPSYNC_API_KEY ?? ''
const POLL_INTERVAL_MS = 10000

type Stats = {
  readonly totalSessions: number
  readonly avgProcessingTime: number
  readonly todaySessions: number
  readonly filterRanking: readonly { readonly filter: string; readonly count: number }[]
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

async function fetchStats(): Promise<Stats> {
  if (!APPSYNC_URL || !APPSYNC_API_KEY) return DEFAULT_STATS

  try {
    const response = await fetch(APPSYNC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': APPSYNC_API_KEY,
      },
      body: JSON.stringify({ query: STATS_QUERY }),
    })

    if (!response.ok) return DEFAULT_STATS

    const body = (await response.json()) as {
      data?: { getStats?: Stats }
    }

    return body.data?.getStats ?? DEFAULT_STATS
  } catch {
    return DEFAULT_STATS
  }
}

export function useStats(): {
  readonly stats: Stats
  readonly isLoading: boolean
} {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const result = await fetchStats()
    setStats(result)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void refresh()

    const interval = setInterval(() => {
      void refresh()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [refresh])

  return { stats, isLoading }
}
