export const WHOLESALE_CATEGORY_DEFINITIONS = [
  { handle: "jogger-pants", name: "Jogger Pants" },
  { handle: "cargo-pants", name: "Cargo Pants" },
  { handle: "casual-pants", name: "Casual Pants" },
  { handle: "jeans", name: "Jeans" },
  { handle: "t-shirts", name: "T-Shirts" },
] as const

export const WHOLESALE_CATEGORIES = new Set<string>(
  WHOLESALE_CATEGORY_DEFINITIONS.map((category) => category.handle)
)

export const missingWholesaleCategoryDefinitions = (
  existingHandles: Iterable<string>,
  requestedHandles: Iterable<string> = WHOLESALE_CATEGORIES
) => {
  const existing = new Set(existingHandles)
  const requested = new Set(requestedHandles)

  return WHOLESALE_CATEGORY_DEFINITIONS.filter(
    (category) => requested.has(category.handle) && !existing.has(category.handle)
  )
}
