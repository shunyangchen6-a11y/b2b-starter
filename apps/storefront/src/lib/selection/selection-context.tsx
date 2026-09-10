"use client"

import {
  applySelectionClearAction,
  ClearSelectionAction,
  mergeSelectionItem,
  normalizeSelectionQuantity,
  parseStoredSelection,
  SelectionItem,
} from "./quote"
import {
  addInquiryProductDraft,
  InquiryProductDraft,
  parseStoredInquiryProducts,
  reconcileStoredInquiry,
  removeDraftForSelectedProduct,
  selectionContainsProduct,
  selectionHasQuantityForProduct,
} from "./inquiry-products"
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "four-seasons-selection-list"
const PRODUCT_STORAGE_KEY = "four-seasons-inquiry-products"

type SelectionContextValue = {
  items: SelectionItem[]
  productDrafts: InquiryProductDraft[]
  drawerOpen: boolean
  focusedHandle: string | null
  addItem: (item: SelectionItem) => void
  addProductDraft: (product: InquiryProductDraft) => void
  removeProductDraft: (handle: string) => void
  isProductAdded: (handle: string) => boolean
  hasSelectedProduct: (handle: string) => boolean
  openDrawer: (handle?: string) => void
  closeDrawer: () => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clear: (action: ClearSelectionAction) => void
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

export function SelectionProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<SelectionItem[]>([])
  const [productDrafts, setProductDrafts] = useState<InquiryProductDraft[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [focusedHandle, setFocusedHandle] = useState<string | null>(null)
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const restoredItems = parseStoredSelection(stored)
    const restoredProducts = parseStoredInquiryProducts(
      window.localStorage.getItem(PRODUCT_STORAGE_KEY)
    )

    if (stored && restoredItems.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY)
    }

    setItems(restoredItems)
    setProductDrafts(restoredProducts.filter(
      (draft) => !restoredItems.some((item) => item.handle === draft.handle)
    ))
    setHasHydrated(true)

    const productIds = Array.from(new Set([
      ...restoredItems.map((item) => item.productId).filter(Boolean),
      ...restoredProducts.map((draft) => draft.productId),
    ])) as string[]
    const legacyHandles = Array.from(new Set(
      restoredItems
        .filter((item) => !item.productId && item.handle)
        .map((item) => item.handle)
    ))

    if (!productIds.length && !legacyHandles.length) {
      setItems([])
      setProductDrafts([])
      return
    }

    const validateStoredProducts = async () => {
      const backendUrl =
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
      const search = new URLSearchParams({
        limit: "100",
        fields: "id,*variants.id",
      })
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
      const headers = publishableKey
        ? { "x-publishable-api-key": publishableKey }
        : undefined
      productIds.forEach((id) => search.append("id[]", id))
      const requests = [
        ...(productIds.length
          ? [fetch(`${backendUrl}/store/products?${search}`, { headers })]
          : []),
        ...legacyHandles.map((handle) => {
          const legacySearch = new URLSearchParams({
            handle,
            limit: "1",
            fields: "id,*variants.id",
          })
          return fetch(`${backendUrl}/store/products?${legacySearch}`, { headers })
        }),
      ]
      const responses = await Promise.all(requests)

      if (responses.some((response) => !response.ok)) return
      const responseBodies = await Promise.all(responses.map((response) =>
        response.json() as Promise<{
          products?: Array<{ id: string; variants?: Array<{ id?: string }> }>
        }>
      ))
      const availableProducts = responseBodies.flatMap(
        (body) => body.products || []
      )
      const reconciled = reconcileStoredInquiry(
        restoredItems,
        restoredProducts,
        availableProducts
      )
      setItems(reconciled.items)
      setProductDrafts(reconciled.drafts)
    }

    void validateStoredProducts().catch(() => {
      // Keep the saved inquiry on temporary network errors. It is only pruned
      // after a successful catalog response confirms an item is unavailable.
    })
  }, [])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.localStorage.setItem(
      PRODUCT_STORAGE_KEY,
      JSON.stringify(productDrafts)
    )
  }, [hasHydrated, items, productDrafts])

  const value = useMemo<SelectionContextValue>(() => ({
    items,
    productDrafts,
    drawerOpen,
    focusedHandle,
    addItem: (item) => {
      setItems((current) => mergeSelectionItem(current, item))
      setProductDrafts((current) => removeDraftForSelectedProduct(current, item))
    },
    addProductDraft: (product) =>
      setProductDrafts((current) =>
        addInquiryProductDraft(current, items, product)
      ),
    removeProductDraft: (handle) =>
      setProductDrafts((current) =>
        current.filter((product) => product.handle !== handle)
      ),
    isProductAdded: (handle) =>
      selectionContainsProduct(items, productDrafts, handle),
    hasSelectedProduct: (handle) =>
      selectionHasQuantityForProduct(items, handle),
    openDrawer: (handle) => {
      setFocusedHandle(handle || null)
      setDrawerOpen(true)
    },
    closeDrawer: () => {
      setDrawerOpen(false)
      setFocusedHandle(null)
    },
    updateQuantity: (id, quantity) =>
      setItems((current) => {
        const selectedItem = current.find((item) => item.id === id)
        const normalizedQuantity = normalizeSelectionQuantity(
          quantity,
          selectedItem?.availableQuantity
        )

        if (normalizedQuantity === 0) {
          return current.filter((item) => item.id !== id)
        }

        return current.map((item) =>
          item.id === id ? { ...item, quantity: normalizedQuantity } : item
        )
      }),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clear: (action) => {
      setItems((current) => applySelectionClearAction(current, action))
      if (action === "confirm") setProductDrafts([])
    },
  }), [drawerOpen, focusedHandle, items, productDrafts])

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export const useSelection = () => {
  const context = useContext(SelectionContext)
  if (!context) throw new Error("useSelection must be used inside SelectionProvider")
  return context
}
