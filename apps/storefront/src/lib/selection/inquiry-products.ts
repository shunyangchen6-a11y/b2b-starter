import type { SelectionItem } from "./quote"

export type InquiryProductDraft = {
  productId: string
  handle: string
  title: string
  styleNumber: string
  image?: string
}

export type AvailableInquiryProduct = {
  id: string
  variants?: Array<{ id?: string | null }>
}

const isDraft = (value: unknown): value is InquiryProductDraft => {
  if (!value || typeof value !== "object") return false

  const draft = value as Partial<InquiryProductDraft>
  return Boolean(
    draft.productId &&
      draft.handle &&
      draft.title &&
      draft.styleNumber
  )
}

export const selectionContainsProduct = (
  items: SelectionItem[],
  drafts: InquiryProductDraft[],
  handle: string
) =>
  items.some((item) => item.handle === handle) ||
  drafts.some((draft) => draft.handle === handle)

export const selectionHasQuantityForProduct = (
  items: SelectionItem[],
  handle: string
) => items.some((item) => item.handle === handle && item.quantity > 0)

export const addInquiryProductDraft = (
  drafts: InquiryProductDraft[],
  items: SelectionItem[],
  draft: InquiryProductDraft
) =>
  selectionContainsProduct(items, drafts, draft.handle)
    ? drafts
    : [...drafts, draft]

export const removeDraftForSelectedProduct = (
  drafts: InquiryProductDraft[],
  item: SelectionItem
) => drafts.filter((draft) => draft.handle !== item.handle)

export const parseStoredInquiryProducts = (stored: string | null) => {
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isDraft)
  } catch {
    return []
  }
}

export const reconcileStoredInquiry = (
  items: SelectionItem[],
  drafts: InquiryProductDraft[],
  availableProducts: AvailableInquiryProduct[]
) => {
  const productsById = new Map(
    availableProducts.map((product) => [product.id, product])
  )

  return {
    items: items.flatMap((item) => {
      if (!item.variantId) return []
      const product = item.productId
        ? productsById.get(item.productId)
        : availableProducts.find((candidate) =>
            candidate.variants?.some((variant) => variant.id === item.variantId)
          )
      const variantExists = product?.variants?.some(
        (variant) => variant.id === item.variantId
      )

      return variantExists && product
        ? [{ ...item, productId: product.id }]
        : []
    }),
    drafts: drafts.filter((draft) => productsById.has(draft.productId)),
  }
}
