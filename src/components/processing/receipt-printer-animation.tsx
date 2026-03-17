'use client'

export function ReceiptPrinterAnimation() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-32">
        <div className="absolute bottom-0 h-10 w-32 rounded-lg bg-ink shadow-md" />
        <div className="absolute bottom-8 left-2 right-2 h-4 rounded-t-sm bg-ink-light" />
        <div className="absolute bottom-10 left-1/2 w-20 -translate-x-1/2 animate-[receiptSlide_2s_ease-in-out_infinite] overflow-hidden">
          <div className="receipt-texture receipt-torn-edge h-16 w-full rounded-t-sm border border-cream-dark" />
        </div>
      </div>
    </div>
  )
}
