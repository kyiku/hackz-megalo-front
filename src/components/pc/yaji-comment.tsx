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
const MAX_COMMENTS = 50
const MAX_TEXT_LENGTH = 200

export function YajiComment({ wsRef }: YajiCommentProps) {
  const [comments, setComments] = useState<readonly Comment[]>([])
  const commentIdRef = useRef(0)

  useEffect(() => {
    const ws = wsRef.current
    if (!ws) return

    const handler = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          data: { text: unknown }
        }

        if (msg.type === 'yajiComment') {
          const rawText = msg.data.text
          if (typeof rawText !== 'string' || rawText.length === 0 || rawText.length > MAX_TEXT_LENGTH) return

          commentIdRef.current += 1
          const newComment: Comment = {
            id: commentIdRef.current,
            text: rawText.slice(0, MAX_TEXT_LENGTH),
            lane: Math.floor(Math.random() * LANE_COUNT),
            startTime: Date.now(),
          }

          setComments((prev) => {
            const updated = [...prev, newComment]
            return updated.length > MAX_COMMENTS ? updated.slice(-MAX_COMMENTS) : updated
          })
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to parse yaji comment:', err)
        }
      }
    }

    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [wsRef])

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
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
