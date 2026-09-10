"use client"

import {
  createWhatsAppLink,
  createWhatsAppMessage,
  createStoreInquiryPayload,
  inquiryProgress,
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
import { useEffect, useMemo, useRef, useState } from "react"

export default function SelectionDrawer() {
  const {
    items,
    drawerOpen,
    focusedHandle,
    openDrawer,
    closeDrawer,
    updateQuantity,
    removeItem,
    removeProduct,
    clear,
  } = useSelection()
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false)
  const [inquiryError, setInquiryError] = useState<string | null>(null)
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false)
  const [contactName, setContactName] = useState("")
  const [customerWhatsapp, setCustomerWhatsapp] = useState("")
  const [country, setCountry] = useState("")
  const [message, setMessage] = useState("")
  const closeDrawerRef = useRef(closeDrawer)
  closeDrawerRef.current = closeDrawer
  const pathname = usePathname()
  const totals = selectionTotals(items)
  const progress = inquiryProgress(items)
  const meetsOrderMinimum = meetsWholesaleOrderMinimum(items)
  const piecesRemaining = Math.max(0, WHOLESALE_ORDER_MOQ - totals.pieces)
  const selectedProducts = useMemo(() => {
    const groups = new Map<string, typeof items>()

    items.forEach((item) => {
      if (item.quantity <= 0) return
      const key = item.productId || item.handle
      groups.set(key, [...(groups.get(key) || []), item])
    })

    return Array.from(groups.values())
  }, [items])
  const whatsapp = createWhatsAppLink(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    createWhatsAppMessage({
      items,
      pageUrl: typeof window === "undefined" ? pathname : window.location.href,
    })
  )

  useEffect(() => {
    if (!drawerOpen || !focusedHandle) return

    const frame = window.requestAnimationFrame(() => {
      const target = Array.from(
        document.querySelectorAll<HTMLElement>("[data-inquiry-handle]")
      ).find((element) => element.dataset.inquiryHandle === focusedHandle)

      target?.scrollIntoView({ block: "center", behavior: "smooth" })
      target?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [drawerOpen, focusedHandle, items])

  useEffect(() => {
    if (!drawerOpen) return

    const scrollPosition = window.scrollY
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }

    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollPosition}px`
    document.body.style.width = "100%"

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawerRef.current()
    }
    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = previous.overflow
      document.body.style.position = previous.position
      document.body.style.top = previous.top
      document.body.style.width = previous.width
      window.scrollTo(0, scrollPosition)
    }
  }, [drawerOpen])

  const keepFocusedFieldVisible = (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    window.setTimeout(() => {
      event.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" })
    }, 250)
  }

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
      clear("confirm")
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
        onClick={() => openDrawer()}
        className="min-h-11 shrink-0 whitespace-nowrap border border-zinc-300 px-2 text-[11px] font-semibold uppercase tracking-[0.08em] hover:border-zinc-950 xsmall:px-3 xsmall:tracking-[0.1em]"
      >
        <span className="md:hidden">List ({totals.pieces})</span>
        <span className="hidden md:inline">Inquiry List ({totals.pieces} / {WHOLESALE_ORDER_MOQ})</span>
      </button>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-[100] h-[100dvh] bg-black/40"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDrawer()
            }
          }}
        >
          <aside
            className="ml-auto h-[100dvh] w-full min-w-0 max-w-md overflow-x-hidden overflow-y-auto overscroll-contain bg-white pb-[max(24px,env(safe-area-inset-bottom))] shadow-2xl"
            data-testid="inquiry-list-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="sticky top-0 z-10 flex min-w-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 xsmall:px-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  FOUR SEASONS CLOTHING
                </p>
                <h2 className="text-xl font-semibold">Inquiry List</h2>
                <p className="mt-1 text-xs text-zinc-500" aria-live="polite">
                  {totals.styles} style(s) · {progress.label}
                </p>
              </div>
              <button aria-label="Close" onClick={closeDrawer} className="ml-3 flex min-h-11 min-w-11 shrink-0 items-center justify-center">
                <XMark />
              </button>
            </header>

            <div className="px-4 pt-4 xsmall:px-5">
              {selectedProducts.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-base font-semibold text-zinc-950">
                    Your inquiry list is empty
                  </p>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                    Browse products and select sizes to start an inquiry.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {selectedProducts.map((productItems) => {
                    const product = productItems[0]

                    return (
                    <div
                      key={product.productId || product.handle}
                      className="border-b border-zinc-200 pb-6 text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-zinc-950"
                      data-inquiry-handle={product.handle}
                      tabIndex={-1}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 gap-3">
                          <Thumbnail
                            thumbnail={product.image}
                            size="square"
                            className="h-16 w-16 shrink-0 bg-zinc-100"
                          />
                          <div className="min-w-0">
                            <p className="line-clamp-2 break-words font-semibold leading-5 text-zinc-950">
                              {product.title}
                            </p>
                            <p className="mt-1 break-words text-xs uppercase tracking-[0.08em] text-zinc-500">
                              Style No. {product.styleNumber}
                            </p>
                          </div>
                        </div>
                        <button
                          aria-label={`Remove ${product.title} from Inquiry List`}
                          onClick={() => removeProduct(product.handle)}
                          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center"
                        >
                          <Trash className="text-zinc-500" />
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4">
                        {productItems.map((item) => (
                          <div key={item.id} className="min-w-0 border-t border-zinc-100 pt-4">
                            <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-2 text-xs">
                              <div className="min-w-0">
                                <p className="text-zinc-500">Color</p>
                                <p className="mt-1 break-words font-medium text-zinc-950">{item.color}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-zinc-500">Size</p>
                                <p className="mt-1 break-words font-medium text-zinc-950">{item.size}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-zinc-500">Pieces</p>
                                <p className="mt-1 font-medium text-zinc-950">{item.quantity}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-zinc-500">Unit price</p>
                                <p className="mt-1 break-words font-medium text-zinc-950">
                                  {item.unitPrice || "Contact for Price"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2">
                              <BulkTableQuantity
                                variantId={item.id}
                                maxQuantity={item.availableQuantity}
                                onChange={updateQuantity}
                                value={item.quantity}
                              />
                              <button
                                type="button"
                                className="min-h-11 px-2 text-xs text-zinc-500 underline underline-offset-4"
                                onClick={() => removeItem(item.id)}
                              >
                                Remove size
                              </button>
                            </div>
                            {item.availableQuantity !== undefined && (
                              <p className="mt-2 text-xs text-zinc-500">
                                {item.availableQuantity} available
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>

            {selectedProducts.length > 0 && (
            <div className="mx-4 mt-6 border-t border-zinc-200 pt-4 xsmall:mx-5">
              <div className="mb-4 flex flex-wrap justify-between gap-2 text-sm">
                <span>{totals.styles} style(s)</span>
                <span className="font-semibold" aria-live="polite">
                  {progress.label}
                </span>
              </div>
              {!meetsOrderMinimum && items.length > 0 && (
                <div className="mb-4 border-l-2 border-[#8A6A38] pl-3 text-sm text-[#6F542C]">
                  <p>Minimum order quantity is 100 pieces in total. You can mix different styles, colors and sizes.</p>
                  <p className="mt-1 font-semibold">Add {piecesRemaining} more {piecesRemaining === 1 ? "piece" : "pieces"} to send your inquiry.</p>
                </div>
              )}
              <div className="mb-4 grid gap-2.5 text-sm">
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
                    onFocus={keepFocusedFieldVisible}
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
                    onFocus={keepFocusedFieldVisible}
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
                    onFocus={keepFocusedFieldVisible}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-zinc-600">Message (optional)</span>
                  <textarea
                    aria-label="Message"
                    className="h-24 max-h-28 min-h-24 resize-y border border-zinc-300 px-3 py-2"
                    maxLength={2000}
                    onChange={(event) => setMessage(event.target.value)}
                    value={message}
                    onFocus={keepFocusedFieldVisible}
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
              <ul className="mb-4 grid gap-1.5 border-y border-zinc-200 py-3 text-xs leading-5 text-zinc-600">
                <li>✓ Ready stock in Guangzhou, China</li>
                <li>✓ Product inspection available</li>
                <li>✓ Worldwide freight quotation available</li>
                <li>✓ Confirm stock and shipping on WhatsApp</li>
              </ul>
              <button
                  className={`min-h-12 w-full bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-white ${
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
            )}
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
