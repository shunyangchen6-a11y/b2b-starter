"use client"

import {
  applySelectionClearAction,
  ClearSelectionAction,
  mergeSelectionItem,
  normalizeQuantity,
  parseStoredSelection,
  SelectionItem,
} from "./quote"
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "four-seasons-selection-list"

type SelectionContextValue = {
  items: SelectionItem[]
  addItem: (item: SelectionItem) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clear: (action: ClearSelectionAction) => void
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

export function SelectionProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<SelectionItem[]>([])
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const restoredItems = parseStoredSelection(stored)

    if (stored && restoredItems.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY)
    }

    setItems(restoredItems)
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [hasHydrated, items])

  const value = useMemo<SelectionContextValue>(() => ({
    items,
    addItem: (item) =>
      setItems((current) => mergeSelectionItem(current, item)),
    updateQuantity: (id, quantity) => {
      const normalizedQuantity = normalizeQuantity(quantity)

      if (normalizedQuantity === 0) {
        return
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, quantity: normalizedQuantity } : item
        )
      )
    },
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clear: (action) =>
      setItems((current) => applySelectionClearAction(current, action)),
  }), [items])

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export const useSelection = () => {
  const context = useContext(SelectionContext)
  if (!context) throw new Error("useSelection must be used inside SelectionProvider")
  return context
}
