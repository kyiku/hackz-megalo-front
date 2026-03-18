'use client'

import { useStats } from '@/hooks/use-stats'

const FILTER_LABELS: Record<string, string> = {
  natural: 'ナチュラル',
  beauty: '美肌',
  bright: '明るさ',
  mono: 'モノクロ',
  sepia: 'セピア',
  anime: 'アニメ風',
  popart: 'ポップアート',
  watercolor: '水彩画',
}

export function StatsDashboard() {
  const { stats, isLoading, error } = useStats()

  if (isLoading) {
    return (
      <div className="receipt-text text-center text-[10px] text-ink-light">
        統計を読み込み中...
      </div>
    )
  }

  return (
    <div className="receipt-text w-full space-y-3">
      <div className="border-b border-dashed border-ink-light/30 pb-1 text-center text-[10px] tracking-[0.2em] text-ink-light">
        TODAY&apos;S STATS
      </div>

      {error && (
        <p className="text-center text-[10px] text-red">{error}</p>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-ink-light">本日の撮影数</span>
        <span className="font-bold text-ink">{stats.todaySessions} 件</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-ink-light">累計撮影数</span>
        <span className="font-bold text-ink">{stats.totalSessions} 件</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-ink-light">平均処理時間</span>
        <span className="font-bold text-ink">
          {stats.avgProcessingTime > 0
            ? `${stats.avgProcessingTime.toFixed(1)} 秒`
            : '-- 秒'}
        </span>
      </div>

      {stats.filterRanking.length > 0 && (
        <>
          <div className="border-t border-dashed border-ink-light/30 pt-2 text-center text-[10px] tracking-[0.2em] text-ink-light">
            FILTER RANKING
          </div>

          <div className="space-y-1">
            {stats.filterRanking.slice(0, 5).map((item, i) => (
              <div key={item.filter} className="flex items-center justify-between text-sm">
                <span className="text-ink-light">
                  {i + 1}. {FILTER_LABELS[item.filter] ?? item.filter}
                </span>
                <span className="font-mono text-ink">{item.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
