export type SelectionItem = {
  id: string
  productId?: string
  handle: string
  title: string
  styleNumber: string
  variantId: string
  sku: string
  color: string
  size: string
  quantity: number
  packSize: 5 | 10
  availableQuantity?: number
  image?: string
}

export type StoreInquiryItem = Pick<
  SelectionItem,
  | "title"
  | "styleNumber"
  | "variantId"
  | "sku"
  | "color"
  | "size"
  | "quantity"
  | "packSize"
>

export type StoreInquiryPayload = {
  page_url: string
  total_styles: number
  total_pieces: number
  items: StoreInquiryItem[]
  contact_name: string
  whatsapp: string
  country: string
  message?: string
}

export const WHOLESALE_VARIANT_MOQ = 5
export const WHOLESALE_ORDER_MOQ = 100

type SelectionItemInput = Partial<SelectionItem> & Record<string, unknown>

export const normalizeQuantity = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return 0
  }

  const quantity =
    typeof value === "number" || typeof value === "string" ? Number(value) : 0

  return Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : 0
}

export const maximumSelectableQuantity = (availableQuantity: unknown) =>
  normalizeQuantity(availableQuantity)

const isNonNegativeSafeInteger = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return false
  const quantity = typeof value === "number" || typeof value === "string"
    ? Number(value)
    : Number.NaN

  return Number.isSafeInteger(quantity) && quantity >= 0
}

export const normalizeSelectionQuantity = (
  value: unknown,
  availableQuantity?: unknown
) => {
  const quantity = normalizeQuantity(value)
  const cappedQuantity = typeof availableQuantity === "undefined"
    ? quantity
    : Math.min(quantity, maximumSelectableQuantity(availableQuantity))

  if (
    typeof availableQuantity !== "undefined" &&
    cappedQuantity === maximumSelectableQuantity(availableQuantity)
  ) {
    return cappedQuantity
  }

  return Math.floor(cappedQuantity / WHOLESALE_VARIANT_MOQ) * WHOLESALE_VARIANT_MOQ
}

export const isValidSelectionQuantity = (
  value: unknown,
  availableQuantity?: unknown
) => {
  if (!isNonNegativeSafeInteger(value)) return false

  const quantity = normalizeQuantity(value)
  const maximumQuantity = typeof availableQuantity === "undefined"
    ? undefined
    : maximumSelectableQuantity(availableQuantity)

  if (quantity === 0) return true
  if (maximumQuantity !== undefined && quantity > maximumQuantity) return false
  if (maximumQuantity !== undefined && quantity === maximumQuantity) return true

  return (
    quantity >= WHOLESALE_VARIANT_MOQ &&
    quantity % WHOLESALE_VARIANT_MOQ === 0
  )
}

export const increaseSelectionQuantity = (
  value: unknown,
  availableQuantity?: unknown
) => {
  const quantity = normalizeSelectionQuantity(value, availableQuantity)
  if (typeof availableQuantity === "undefined") {
    return quantity + WHOLESALE_VARIANT_MOQ
  }

  const maximumQuantity = maximumSelectableQuantity(availableQuantity)
  if (quantity >= maximumQuantity) return maximumQuantity

  const nextQuantity = quantity + WHOLESALE_VARIANT_MOQ
  return nextQuantity <= maximumQuantity ? nextQuantity : maximumQuantity
}

export const decreaseSelectionQuantity = (
  value: unknown,
  availableQuantity?: unknown
) => {
  const quantity = normalizeSelectionQuantity(value, availableQuantity)
  if (quantity === 0) return 0

  if (typeof availableQuantity !== "undefined") {
    const maximumQuantity = maximumSelectableQuantity(availableQuantity)
    if (quantity === maximumQuantity && maximumQuantity % WHOLESALE_VARIANT_MOQ !== 0) {
      return Math.floor(maximumQuantity / WHOLESALE_VARIANT_MOQ) * WHOLESALE_VARIANT_MOQ
    }
  }

  return Math.max(quantity - WHOLESALE_VARIANT_MOQ, 0)
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
  const availableQuantity = typeof item.availableQuantity === "undefined"
    ? undefined
    : normalizeQuantity(item.availableQuantity)
  const quantity = normalizeSelectionQuantity(item.quantity, availableQuantity)
  const id = stringValue(item.id)

  if (!id || quantity === 0) {
    return null
  }

  return {
    id,
    productId: stringValue(item.productId) || undefined,
    handle: stringValue(item.handle),
    title: stringValue(item.title),
    styleNumber: stringValue(item.styleNumber),
    variantId: stringValue(item.variantId) || id,
    sku: stringValue(item.sku),
    color: stringValue(item.color),
    size: stringValue(item.size),
    quantity,
    packSize: normalizeQuantity(item.packSize) === 10 ? 10 : 5,
    availableQuantity,
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
          quantity: normalizeSelectionQuantity(
            normalizeSelectionQuantity(entry.quantity, entry.availableQuantity) + nextItem.quantity,
            entry.availableQuantity
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

export const meetsWholesaleOrderMinimum = (items: SelectionItem[]) =>
  selectionTotals(items).pieces >= WHOLESALE_ORDER_MOQ

export const inquiryProgress = (items: SelectionItem[]) => {
  const pieces = selectionTotals(items).pieces
  const remaining = Math.max(0, WHOLESALE_ORDER_MOQ - pieces)

  return {
    pieces,
    remaining,
    reached: remaining === 0,
    label: `${pieces} / ${WHOLESALE_ORDER_MOQ} · ${
      remaining === 0
        ? "MOQ reached"
        : `Add ${remaining} more ${remaining === 1 ? "piece" : "pieces"}`
    }`,
  }
}

export const isSelectionWithinAvailability = (items: SelectionItem[]) =>
  items.every(
    (item) =>
      isValidSelectionQuantity(item.quantity, item.availableQuantity)
  )

export const createStoreInquiryPayload = ({
  items,
  pageUrl,
  contactName,
  whatsapp,
  country,
  message,
}: {
  items: SelectionItem[]
  pageUrl: string
  contactName: string
  whatsapp: string
  country: string
  message?: string
}): StoreInquiryPayload => {
  const normalizedItems = normalizeSelectionItems(items)
  const totals = selectionTotals(normalizedItems)
  const payload: StoreInquiryPayload = {
    page_url: pageUrl,
    total_styles: totals.styles,
    total_pieces: totals.pieces,
    contact_name: contactName.trim(),
    whatsapp: whatsapp.trim(),
    country: country.trim(),
    items: normalizedItems.map(({ title, styleNumber, variantId, sku, color, size, quantity, packSize }) => ({
      title,
      styleNumber,
      variantId,
      sku,
      color,
      size,
      quantity,
      packSize,
    })),
  }

  if (message) payload.message = message

  return payload
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
    "Inquiry List:",
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
