"use client"

import { inquiryProgress } from "@/lib/selection/quote"
import { useSelection } from "@/lib/selection/selection-context"

export default function ProductInquiryProgress() {
  const { items } = useSelection()
  const progress = inquiryProgress(items)

  return (
    <div className="border-y border-zinc-200 py-3" data-testid="product-inquiry-progress">
      <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
        <span className="text-zinc-500">Total inquiry MOQ</span>
        <span className="text-right font-semibold text-zinc-950" aria-live="polite">
          {progress.label}
        </span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden bg-zinc-200" aria-hidden>
        <div
          className="h-full bg-zinc-950 transition-[width] duration-200"
          style={{ width: `${Math.min(100, progress.pieces)}%` }}
        />
      </div>
      {!progress.reached && (
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          Add at least 100 pieces across mixed styles, colors and sizes before sending on WhatsApp.
        </p>
      )}
    </div>
  )
}
