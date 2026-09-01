export type SelectionItem = {
  id: string
  handle: string
  title: string
  styleNumber: string
  color: string
  size: string
  quantity: number
  packSize: 5 | 10
  image?: string
}

type SelectionItemInput = Partial<SelectionItem> & Record<string, unknown>

export const normalizeQuantity = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return 0
  }

  const quantity =
    typeof value === "number" || typeof value === "string" ? Number(value) : 0

  return Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : 0
}

const stringValue = (value: unknown) =>
  typeof value === "string" ? value : ""

export const normalizeSelectionItem = (
  value: unknown
): SelectionItem | null => {
  if (!value || typeof value !== "object") {
    return null
  }

  const item = value as SelectionItemInput
  const quantity = normalizeQuantity(item.quantity)
  const id = stringValue(item.id)

  if (!id || quantity === 0) {
    return null
  }

  return {
    id,
    handle: stringValue(item.handle),
    title: stringValue(item.title),
    styleNumber: stringValue(item.styleNumber),
    color: stringValue(item.color),
    size: stringValue(item.size),
    quantity,
    packSize: normalizeQuantity(item.packSize) === 10 ? 10 : 5,
    image: typeof item.image === "string" ? item.image : undefined,
  }
}

export const normalizeSelectionItems = (items: unknown): SelectionItem[] => {
  if (!Array.isArray(items)) {
    return []
  }

  return items.reduce<SelectionItem[]>((normalized, item) => {
    const selectionItem = normalizeSelectionItem(item)
    if (selectionItem) {
      normalized.push(selectionItem)
    }
    return normalized
  }, [])
}

export const parseStoredSelection = (stored: string | null): SelectionItem[] => {
  if (!stored) {
    return []
  }

  try {
    return normalizeSelectionItems(JSON.parse(stored))
  } catch {
    return []
  }
}

export const mergeSelectionItem = (
  items: SelectionItem[],
  item: unknown
): SelectionItem[] => {
  const nextItem = normalizeSelectionItem(item)
  const normalizedItems = normalizeSelectionItems(items)

  if (!nextItem) {
    return normalizedItems
  }

  const existing = normalizedItems.find((entry) => entry.id === nextItem.id)

  if (!existing) {
    return [...normalizedItems, nextItem]
  }

  return normalizedItems.map((entry) =>
    entry.id === nextItem.id
      ? {
          ...entry,
          quantity: normalizeQuantity(
            normalizeQuantity(entry.quantity) + nextItem.quantity
          ),
        }
      : entry
  )
}

export type ClearSelectionAction = "confirm" | "cancel" | "dismiss"

export const applySelectionClearAction = (
  items: SelectionItem[],
  action: ClearSelectionAction
): SelectionItem[] =>
  action === "confirm" ? [] : normalizeSelectionItems(items)

export const selectionTotals = (items: SelectionItem[]) => {
  const normalizedItems = normalizeSelectionItems(items)

  return {
    styles: new Set(normalizedItems.map((item) => item.handle)).size,
    pieces: normalizedItems.reduce(
      (total, item) => total + normalizeQuantity(item.quantity),
      0
    ),
    packs: normalizedItems.reduce(
      (total, item) =>
        total + Math.ceil(normalizeQuantity(item.quantity) / item.packSize),
      0
    ),
  }
}

export const createWhatsAppMessage = ({
  items,
  pageUrl,
}: {
  items: SelectionItem[]
  pageUrl: string
}) => {
  const normalizedItems = normalizeSelectionItems(items)
  const totals = selectionTotals(normalizedItems)
  const lines = normalizedItems.map(
    (item) =>
      `• ${item.title} | Style: ${item.styleNumber} | Color: ${item.color} | Size: ${item.size} | Qty: ${item.quantity} pcs | Pack: ${item.packSize} pcs`
  )

  return [
    "Hello FOUR SEASONS CLOTHING, I would like a wholesale quotation.",
    "",
    "Selection List:",
    ...lines,
    "",
    `Total styles: ${totals.styles}`,
    `Total pieces: ${totals.pieces}`,
    `Packing: mixed ${totals.packs} pack(s)`,
    `Page: ${pageUrl}`,
    "",
    "Please confirm wholesale price, ready stock, shipping cost and delivery time.",
  ].join("\n")
}

export const createWhatsAppLink = (phone: string, message: string) => {
  const normalizedPhone = phone.replace(/[^0-9]/g, "")
  if (!normalizedPhone) return null
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}
