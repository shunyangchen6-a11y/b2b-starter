export const WHOLESALE_FOOTER_CATEGORIES = [
  { handle: "cargo-pants", label: "Cargo Pants" },
  { handle: "casual-pants", label: "Casual Pants" },
  { handle: "jeans", label: "Jeans" },
  { handle: "jogger-pants", label: "Jogger Pants" },
  { handle: "t-shirts", label: "T-Shirts" },
] as const

type FooterCategory = {
  handle?: string | null
}

export const selectWholesaleFooterCategories = <T extends FooterCategory>(
  categories: T[]
) => {
  const categoryByHandle = new Map(
    categories
      .filter((category): category is T & { handle: string } => Boolean(category.handle))
      .map((category) => [category.handle, category])
  )

  return WHOLESALE_FOOTER_CATEGORIES.flatMap((entry) => {
    const category = categoryByHandle.get(entry.handle)
    return category ? [{ ...entry, category }] : []
  })
}
