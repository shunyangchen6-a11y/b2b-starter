"use client"

import {
  createWhatsAppLink,
  createWhatsAppMessage,
  createStoreInquiryPayload,
  selectionTotals,
} from "@/lib/selection/quote"
import { useSelection } from "@/lib/selection/selection-context"
import { submitInquiryAndOpenWhatsApp } from "@/lib/selection/submit-inquiry"
import Thumbnail from "@/modules/products/components/thumbnail"
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
  const whatsapp = createWhatsAppLink(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    createWhatsAppMessage({
      items,
      pageUrl: typeof window === "undefined" ? pathname : window.location.href,
    })
  )

  const sendInquiry = async () => {
    if (!whatsapp || !items.length) return

    if (items.some((item) => !item.sku)) {
      setInquiryError("One or more selected variants are missing a SKU. Remove and add them again before sending your inquiry.")
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
        className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:border-amber-600"
      >
        Selection List ({totals.pieces})
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
            className="ml-auto flex h-full w-full max-w-md flex-col bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  FOUR SEASONS CLOTHING
                </p>
                <h2 className="text-xl font-semibold">Selection List</h2>
              </div>
              <button aria-label="Close" onClick={() => setOpen(false)}>
                <XMark />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {items.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Your selection list is empty. Add styles and quantities to
                  request a wholesale quote.
                </p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="border-b border-zinc-100 py-4 text-sm">
                    <div className="flex justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <Thumbnail
                          thumbnail={item.image}
                          size="square"
                          className="w-14 shrink-0 rounded bg-zinc-100"
                        />
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-zinc-500">
                            Style {item.styleNumber} · {item.color} · {item.size}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {item.packSize}-piece pack
                          </p>
                        </div>
                      </div>
                      <button
                        aria-label="Remove item"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash className="text-zinc-500" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <label className="text-xs text-zinc-500">Pieces</label>
                      <input
                        aria-label={`Quantity for ${item.title}`}
                        className="w-20 border border-zinc-300 px-2 py-1"
                        min="1"
                        type="number"
                        value={item.quantity}
                        onChange={(event) =>
                          updateQuantity(item.id, Number(event.target.value))
                        }
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-zinc-200 pt-4">
              <div className="mb-4 flex justify-between text-sm">
                <span>{totals.styles} style(s)</span>
                <span>{totals.pieces} piece(s)</span>
              </div>
              <div className="mb-4 grid gap-3 text-sm">
                <p className="font-semibold text-zinc-950">Your inquiry details</p>
                <label className="grid gap-1">
                  <span className="text-xs text-zinc-600">Customer Name *</span>
                  <input
                    aria-label="Customer Name"
                    autoComplete="name"
                    className="border border-zinc-300 px-3 py-2"
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
                    className="border border-zinc-300 px-3 py-2"
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
                    className="border border-zinc-300 px-3 py-2"
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
                    className="min-h-20 border border-zinc-300 px-3 py-2"
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
                className={`w-full bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-white ${
                  !whatsapp || !items.length || isSubmittingInquiry
                    ? "cursor-not-allowed opacity-40"
                    : "hover:bg-amber-700"
                }`}
                onClick={() => void sendInquiry()}
                disabled={!whatsapp || !items.length || isSubmittingInquiry}
              >
                {isSubmittingInquiry
                  ? "Saving inquiry..."
                  : "Send Inquiry on WhatsApp"}
              </button>
              <button
                onClick={() => setClearConfirmationOpen(true)}
                className="mt-3 w-full text-xs text-zinc-500 underline"
                disabled={!items.length}
              >
                Clear selection
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
              Clear selection?
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-sm text-zinc-600">
              Clear all selected products and quantities?
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                aria-label="Close clear selection confirmation"
                className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-950"
              >
                <XMark />
              </button>
            </Dialog.Close>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button className="border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-950">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={confirmClear}
                className="bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Clear Selection
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
