"use client"

import { selectionTotals } from "@/lib/selection/quote"
import { useSelection } from "@/lib/selection/selection-context"

export default function MobileInquiryBar() {
  const { items, drawerOpen, openDrawer } = useSelection()
  const pieces = selectionTotals(items).pieces
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "")

  if (drawerOpen) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] grid grid-cols-2 gap-px border-t border-zinc-300 bg-zinc-300 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden"
      data-testid="mobile-inquiry-bar"
    >
      <button
        type="button"
        className="min-h-11 min-w-0 bg-white px-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-950"
        onClick={() => openDrawer()}
      >
        Inquiry List ({pieces})
      </button>
      {whatsappNumber ? (
        <a
          className="flex min-h-11 min-w-0 items-center justify-center bg-zinc-950 px-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
          href={`https://wa.me/${whatsappNumber}`}
          rel="noreferrer"
          target="_blank"
        >
          WhatsApp
        </a>
      ) : (
        <span className="flex min-h-11 min-w-0 cursor-not-allowed items-center justify-center bg-zinc-500 px-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
          WhatsApp
        </span>
      )}
    </div>
  )
}
