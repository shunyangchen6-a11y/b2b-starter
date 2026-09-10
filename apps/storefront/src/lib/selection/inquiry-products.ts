import type { SelectionItem } from "./quote"

export type InquiryProductDraft = {
  productId: string
  handle: string
  title: string
  styleNumber: string
  image?: string
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
