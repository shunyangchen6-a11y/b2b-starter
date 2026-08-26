"use client"

import { SelectionItem } from "./quote"
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "four-seasons-selection-list"

type SelectionContextValue = {
  items: SelectionItem[]
  addItem: (item: SelectionItem) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clear: () => void
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

export function SelectionProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<SelectionItem[]>([])

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    try { setItems(JSON.parse(stored)) } catch { window.localStorage.removeItem(STORAGE_KEY) }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo<SelectionContextValue>(() => ({
    items,
    addItem: (item) => setItems((current) => {
      const existing = current.find((entry) => entry.id === item.id)
      return existing
        ? current.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + item.quantity } : entry)
        : [...current, item]
    }),
    updateQuantity: (id, quantity) => setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clear: () => setItems([]),
  }), [items])

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export const useSelection = () => {
  const context = useContext(SelectionContext)
  if (!context) throw new Error("useSelection must be used inside SelectionProvider")
  return context
}
