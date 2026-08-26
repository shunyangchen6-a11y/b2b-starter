import { HttpTypes } from "@medusajs/types"

export const WHOLESALE_FILTER_KEYS = [
  "category",
  "size",
  "color",
  "fabric",
  "stock_status",
] as const

export type WholesaleFilterKey = (typeof WHOLESALE_FILTER_KEYS)[number]
export type WholesaleFilters = Record<WholesaleFilterKey, string[]>

export const WHOLESALE_CATEGORY_HANDLES = new Set([
  "jogger-pants",
  "cargo-pants",
  "casual-pants",
  "jeans",
  "t-shirts",
])

const emptyFilters = (): WholesaleFilters => ({
  category: [],
  size: [],
  color: [],
  fabric: [],
  stock_status: [],
})

const normalise = (value: string) => value.trim().toLowerCase()

const metadataValue = (product: HttpTypes.StoreProduct, key: string) => {
  const value = product.metadata?.[key]
  return typeof value === "string" || typeof value === "number" ? String(value) : ""
}

const variantOptionValues = (product: HttpTypes.StoreProduct, optionTitle: string) => {
  const optionIds = new Set(
    product.options
      ?.filter((option) => option.title?.toLowerCase() === optionTitle.toLowerCase())
      .map((option) => option.id)
  )

  return Array.from(
    new Set(
      product.variants?.flatMap((variant) =>
        variant.options
          ?.filter((option) => Boolean(option.option_id) && optionIds.has(option.option_id!))
          .map((option) => option.value)
          .filter((value): value is string => Boolean(value)) || []
      ) || []
    )
  )
}

export const parseWholesaleFilters = (searchParams: Record<string, string | string[] | undefined>) => {
  const filters = emptyFilters()

  for (const key of WHOLESALE_FILTER_KEYS) {
    const values = searchParams[key]
    const valuesArray = Array.isArray(values) ? values : values ? [values] : []
    filters[key] = Array.from(
      new Set(
        valuesArray
          .flatMap((value) => value.split(","))
          .map((value) => value.trim())
          .filter(Boolean)
      )
    )
  }

  return filters
}

export const hasWholesaleFilters = (filters: WholesaleFilters) =>
  WHOLESALE_FILTER_KEYS.some((key) => filters[key].length > 0)

export const wholesaleFilterCount = (filters: WholesaleFilters) =>
  WHOLESALE_FILTER_KEYS.reduce((count, key) => count + filters[key].length, 0)

export const filterWholesaleProducts = (
  products: HttpTypes.StoreProduct[],
  filters: WholesaleFilters
) =>
  products.filter((product) => {
    const categories =
      product.categories
        ?.map((category) => category.handle)
        .filter((handle): handle is string => Boolean(handle)) || []
    const colors = variantOptionValues(product, "Color")
    const sizes = variantOptionValues(product, "Size")
    const matchesOne = (selected: string[], available: string[]) =>
      !selected.length || available.some((value) => selected.some((filter) => normalise(value) === normalise(filter)))

    return (
      matchesOne(filters.category, categories) &&
      matchesOne(filters.color, colors) &&
      matchesOne(filters.size, sizes) &&
      matchesOne(filters.fabric, [metadataValue(product, "fabric")]) &&
      matchesOne(filters.stock_status, [metadataValue(product, "stock_status")])
    )
  })

export type WholesaleFilterOption = { value: string; label: string }
export type WholesaleFilterOptions = Record<WholesaleFilterKey, WholesaleFilterOption[]>

const sortOptions = (options: WholesaleFilterOption[]) =>
  options.sort((a, b) => a.label.localeCompare(b.label))

export const getWholesaleFilterOptions = (
  products: HttpTypes.StoreProduct[]
): WholesaleFilterOptions => {
  const categoryOptions = new Map<string, string>()
  const colorOptions = new Set<string>()
  const sizeOptions = new Set<string>()
  const fabricOptions = new Set<string>()
  const stockStatusOptions = new Set<string>()

  products.forEach((product) => {
    product.categories?.forEach((category) => {
      if (category.handle && WHOLESALE_CATEGORY_HANDLES.has(category.handle)) {
        categoryOptions.set(category.handle, category.name || category.handle)
      }
    })
    variantOptionValues(product, "Color").forEach((value) => colorOptions.add(value))
    variantOptionValues(product, "Size").forEach((value) => sizeOptions.add(value))
    const fabric = metadataValue(product, "fabric")
    const stockStatus = metadataValue(product, "stock_status")
    if (fabric) fabricOptions.add(fabric)
    if (stockStatus) stockStatusOptions.add(stockStatus)
  })

  return {
    category: sortOptions(Array.from(categoryOptions, ([value, label]) => ({ value, label }))),
    size: sortOptions(Array.from(sizeOptions, (value) => ({ value, label: value }))),
    color: sortOptions(Array.from(colorOptions, (value) => ({ value, label: value }))),
    fabric: sortOptions(Array.from(fabricOptions, (value) => ({ value, label: value }))),
    stock_status: ["in_stock", "low_stock", "sold_out"]
      .filter((value) => stockStatusOptions.has(value))
      .map((value) => ({ value, label: value.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) })),
  }
}

export const getWholesaleFilterLabel = (
  options: WholesaleFilterOptions,
  key: WholesaleFilterKey,
  value: string
) => options[key].find((option) => option.value === value)?.label || value
