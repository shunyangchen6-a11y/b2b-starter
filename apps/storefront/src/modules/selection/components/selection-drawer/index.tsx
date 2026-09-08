"use client"

import {
  createWhatsAppLink,
  createWhatsAppMessage,
  createStoreInquiryPayload,
  isSelectionWithinAvailability,
  meetsWholesaleOrderMinimum,
  selectionTotals,
  WHOLESALE_ORDER_MOQ,
} from "@/lib/selection/quote"
import { useSelection } from "@/lib/selection/selection-context"
import { submitInquiryAndOpenWhatsApp } from "@/lib/selection/submit-inquiry"
import Thumbnail from "@/modules/products/components/thumbnail"
import BulkTableQuantity from "@/modules/products/components/bulk-table-quantity"
import { Trash, XMark } from "@medusajs/icons"
import * as Dialog from "@radix-ui/react-dialog"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function SelectionDrawer() {
  const { items, updateQuantity, removeItem, clear } = useSelection()
  const [open, setOpen] = useState(false)
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false)
  const [inquiryError, setInquiryError] = useState<string | null>(null)
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false)
  const [contactName, setContactName] = useState("")
  const [customerWhatsapp, setCustomerWhatsapp] = useState("")
  const [country, setCountry] = useState("")
  const [message, setMessage] = useState("")
  const pathname = usePathname()
  const totals = selectionTotals(items)
  const meetsOrderMinimum = meetsWholesaleOrderMinimum(items)
  const piecesRemaining = Math.max(0, WHOLESALE_ORDER_MOQ - totals.pieces)
  const whatsapp = createWhatsAppLink(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    createWhatsAppMessage({
      items,
      pageUrl: typeof window === "undefined" ? pathname : window.location.href,
    })
  )

  const sendInquiry = async () => {
    if (!whatsapp || !items.length) return

    if (!meetsOrderMinimum) {
      setInquiryError("Minimum order quantity is 100 pieces in total. You can mix different styles, colors and sizes.")
      return
    }

    if (items.some((item) => !item.sku)) {
      setInquiryError("One or more selected variants are missing a SKU. Remove and add them again before sending your inquiry.")
      return
    }

    if (!isSelectionWithinAvailability(items)) {
      setInquiryError("One or more selected quantities are not valid for available stock. Use 5-piece increments or select the final available quantity for that SKU.")
      return
    }

    if (!contactName.trim() || !country.trim() || customerWhatsapp.replace(/\D/g, "").length < 6) {
      setInquiryError("Enter your name, WhatsApp number, and country before sending your inquiry.")
      return
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const payload = createStoreInquiryPayload({
      items,
      pageUrl: window.location.href,
      contactName,
      whatsapp: customerWhatsapp,
      country,
      message: message.trim() || undefined,
    })

    setInquiryError(null)
    setIsSubmittingInquiry(true)

    try {
      await submitInquiryAndOpenWhatsApp({
        backendUrl,
        payload,
        publishableApiKey:
          process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || undefined,
        whatsappUrl: whatsapp,
        openWhatsApp: (url) => window.open(url, "_blank", "noopener,noreferrer"),
      })
    } catch (error) {
      setInquiryError(
        error instanceof Error
          ? error.message
          : "Unable to save your inquiry. Please try again."
      )
    } finally {
      setIsSubmittingInquiry(false)
    }
  }

  const confirmClear = () => {
    clear("confirm")
    setClearConfirmationOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="min-h-11 shrink-0 whitespace-nowrap border border-zinc-300 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] hover:border-zinc-950 xsmall:px-3 xsmall:tracking-[0.1em]"
      >
        <span className="md:hidden">List ({totals.pieces})</span>
        <span className="hidden md:inline">Inquiry List ({totals.pieces} / {WHOLESALE_ORDER_MOQ})</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/40"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false)
            }
          }}
        >
          <aside
            className="ml-auto flex h-full w-full min-w-0 max-w-md flex-col overflow-x-hidden bg-white p-4 xsmall:p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-w-0 items-center justify-between border-b border-zinc-200 pb-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  FOUR SEASONS CLOTHING
                </p>
                <h2 className="text-xl font-semibold">Inquiry List</h2>
              </div>
              <button aria-label="Close" onClick={() => setOpen(false)} className="ml-3 flex min-h-11 min-w-11 shrink-0 items-center justify-center">
                <XMark />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-4">
              {items.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Your Inquiry List is empty. Add styles and quantities to
                  request a wholesale quote.
                </p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="border-b border-zinc-100 py-4 text-sm">
                    <div className="flex min-w-0 justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <Thumbnail
                          thumbnail={item.image}
                          size="square"
                          className="w-14 shrink-0 rounded bg-zinc-100"
                        />
                        <div className="min-w-0">
                          <p className="break-words font-medium">{item.title}</p>
                          <p className="break-words text-xs text-zinc-500">
                            Style {item.styleNumber} · {item.color} · {item.size}
                          </p>
                          <p className="mt-1 break-words text-xs text-zinc-500">
                            {item.packSize}-piece pack
                          </p>
                        </div>
                      </div>
                      <button
                        aria-label="Remove item"
                        onClick={() => removeItem(item.id)}
                        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center"
                      >
                        <Trash className="text-zinc-500" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="mr-1 text-xs text-zinc-500">Pieces</label>
                      <BulkTableQuantity
                        variantId={item.id}
                        maxQuantity={item.availableQuantity}
                        onChange={updateQuantity}
                        value={item.quantity}
                      />
                      {item.availableQuantity !== undefined && (
                        <span className="text-xs text-zinc-500">
                          {item.availableQuantity} available
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="shrink-0 border-t border-zinc-200 pt-4">
              <div className="mb-4 flex justify-between text-sm">
                <span>{totals.styles} style(s)</span>
                <span>{totals.pieces} / {WHOLESALE_ORDER_MOQ} pieces</span>
              </div>
              {!meetsOrderMinimum && items.length > 0 && (
                <div className="mb-4 border-l-2 border-[#8A6A38] pl-3 text-sm text-[#6F542C]">
                  <p>Minimum order quantity is 100 pieces in total. You can mix different styles, colors and sizes.</p>
                  <p className="mt-1 font-semibold">Add {piecesRemaining} more {piecesRemaining === 1 ? "piece" : "pieces"} to send your inquiry.</p>
                </div>
              )}
              <div className="mb-4 grid gap-3 text-sm">
                <p className="font-semibold text-zinc-950">Your inquiry details</p>
                <label className="grid gap-1">
                  <span className="text-xs text-zinc-600">Customer Name *</span>
                  <input
                    aria-label="Customer Name"
                    autoComplete="name"
                    className="min-h-11 border border-zinc-300 px-3"
                    maxLength={120}
                    onChange={(event) => setContactName(event.target.value)}
                    required
                    value={contactName}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-zinc-600">WhatsApp Number *</span>
                  <input
                    aria-label="WhatsApp Number"
                    autoComplete="tel"
                    className="min-h-11 border border-zinc-300 px-3"
                    inputMode="tel"
                    maxLength={40}
                    onChange={(event) => setCustomerWhatsapp(event.target.value)}
                    required
                    value={customerWhatsapp}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-zinc-600">Country *</span>
                  <input
                    aria-label="Country"
                    autoComplete="country-name"
                    className="min-h-11 border border-zinc-300 px-3"
                    maxLength={120}
                    onChange={(event) => setCountry(event.target.value)}
                    required
                    value={country}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-zinc-600">Message (optional)</span>
                  <textarea
                    aria-label="Message"
                    className="min-h-24 border border-zinc-300 px-3 py-2"
                    maxLength={2000}
                    onChange={(event) => setMessage(event.target.value)}
                    value={message}
                  />
                </label>
              </div>
              {!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
                <p className="mb-3 text-xs text-amber-700">
                  WhatsApp is not configured. Set NEXT_PUBLIC_WHATSAPP_NUMBER
                  before deployment.
                </p>
              )}
              {inquiryError && (
                <p role="alert" className="mb-3 text-sm text-red-700">
                  {inquiryError}
                </p>
              )}
              <button
                  className={`min-h-11 w-full bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-white ${
                  !whatsapp || !items.length || !meetsOrderMinimum || isSubmittingInquiry
                    ? "cursor-not-allowed opacity-40"
                    : "hover:bg-zinc-800"
                }`}
                onClick={() => void sendInquiry()}
                disabled={!whatsapp || !items.length || !meetsOrderMinimum || isSubmittingInquiry}
              >
                {isSubmittingInquiry
                  ? "Saving inquiry..."
                  : "Send Inquiry on WhatsApp"}
              </button>
              <button
                onClick={() => setClearConfirmationOpen(true)}
                className="mt-3 min-h-11 w-full text-xs text-zinc-500 underline underline-offset-4"
                disabled={!items.length}
              >
                Clear Inquiry List
              </button>
            </div>
          </aside>
        </div>
      )}

      <Dialog.Root
        open={clearConfirmationOpen}
        onOpenChange={setClearConfirmationOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay
            data-testid="clear-selection-overlay"
            className="fixed inset-0 z-[125] bg-black/50"
          />
          <Dialog.Content
            data-testid="clear-selection-confirmation"
            className="fixed left-1/2 top-1/2 z-[130] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-2xl focus:outline-none"
          >
            <Dialog.Title className="text-lg font-semibold text-zinc-950">
              Clear Inquiry List?
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-sm text-zinc-600">
              Clear all selected products and quantities?
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                aria-label="Close clear Inquiry List confirmation"
                className="absolute right-4 top-4 flex min-h-11 min-w-11 items-center justify-center text-zinc-500 hover:text-zinc-950"
              >
                <XMark />
              </button>
            </Dialog.Close>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button className="min-h-11 border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-950">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={confirmClear}
                className="min-h-11 bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Clear Inquiry List
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
