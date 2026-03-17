'use client'

import { useEffect, useRef, useState } from 'react'

type Comment = {
  readonly id: number
  readonly text: string
  readonly lane: number
  readonly startTime: number
}

type YajiCommentProps = {
  readonly wsRef: React.RefObject<WebSocket | null>
}

const LANE_COUNT = 8
const COMMENT_DURATION = 5000

let commentId = 0

export function YajiComment({ wsRef }: YajiCommentProps) {
  const [comments, setComments] = useState<readonly Comment[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ws = wsRef.current
    if (!ws) return

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: { text: string }
        }

        if (msg.type === 'yajiComment') {
          commentId += 1
          const newComment: Comment = {
            id: commentId,
            text: msg.data.text,
            lane: Math.floor(Math.random() * LANE_COUNT),
            startTime: Date.now(),
          }

          setComments((prev) => [...prev, newComment])
        }
      } catch {
        // ignore
      }
    }

    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [wsRef])

  // 古いコメントを定期的に削除
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setComments((prev) =>
        prev.filter((c) => now - c.startTime < COMMENT_DURATION),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="absolute whitespace-nowrap font-bold text-white animate-[yajiSlide_5s_linear_forwards]"
          style={{
            top: `${(comment.lane / LANE_COUNT) * 80 + 5}%`,
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            fontSize: '20px',
          }}
        >
          {comment.text}
        </div>
      ))}
    </div>
  )
}
