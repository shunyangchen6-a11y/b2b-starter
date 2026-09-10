"use client"

import {
  InquiryProductDraft,
} from "@/lib/selection/inquiry-products"
import { useSelection } from "@/lib/selection/selection-context"
import { useEffect, useRef, useState } from "react"

type ProductInquiryButtonProps = InquiryProductDraft & {
  disabled?: boolean
  className?: string
  variantTargetId?: string
}

export default function ProductInquiryButton({
  disabled = false,
  className = "",
  variantTargetId,
  ...product
}: ProductInquiryButtonProps) {
  const { addProductDraft, hasSelectedProduct, openDrawer } = useSelection()
  const [loading, setLoading] = useState(false)
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const added = hasSelectedProduct(product.handle)

  useEffect(() => () => {
    if (loadingTimer.current) clearTimeout(loadingTimer.current)
  }, [])

  const handleClick = () => {
    if (disabled || loading) return

    if (!added) {
      if (variantTargetId) {
        document.getElementById(variantTargetId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
        return
      }

      setLoading(true)
      addProductDraft(product)
      loadingTimer.current = setTimeout(() => setLoading(false), 250)
    }

    openDrawer(product.handle)
  }

  return (
    <button
      type="button"
      aria-busy={loading}
      aria-label={`${added ? "View inquiry for" : "Inquire about"} ${product.title}`}
      className={`min-h-11 w-full bg-zinc-950 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:text-white ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading ? "ADDING..." : added ? "VIEW INQUIRY" : "INQUIRE NOW"}
    </button>
  )
}
