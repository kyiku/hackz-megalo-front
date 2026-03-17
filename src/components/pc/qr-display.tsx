'use client'

import { QRCodeSVG } from 'qrcode.react'

type QrDisplayProps = {
  readonly roomId: string
}

export function QrDisplay({ roomId }: QrDisplayProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const joinUrl = `${origin}/room/${roomId}`

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-3">
        <QRCodeSVG
          value={joinUrl}
          size={200}
          level="M"
          bgColor="#ffffff"
          fgColor="#1a1a1a"
        />
      </div>

      <div className="receipt-text text-center">
        <p className="text-xs text-ink-light">スマホでスキャンして参加</p>
        <p className="mt-1 font-mono text-[10px] text-ink-light">ROOM: {roomId}</p>
      </div>
    </div>
  )
}
