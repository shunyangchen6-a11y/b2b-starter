import { HttpTypes } from "@medusajs/types"

type WholesaleMetadata = Record<string, unknown> | null | undefined

export const WHOLESALE_LOW_STOCK_THRESHOLD = 50

export const wholesaleValue = (metadata: WholesaleMetadata, key: string, fallback = "—") => {
  const value = metadata?.[key]
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback
}

export const variantAvailableQuantity = (variant: HttpTypes.StoreProductVariant) => {
  const quantity = Number(variant.inventory_quantity)
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0
}

export const wholesaleAvailableQuantity = (product: HttpTypes.StoreProduct) =>
  product.variants
    ?.filter((variant) => variant.manage_inventory !== false)
    .reduce((total, variant) => total + variantAvailableQuantity(variant), 0) || 0

export const wholesaleStockStatusCode = (product: HttpTypes.StoreProduct) => {
  const quantity = wholesaleAvailableQuantity(product)
  if (quantity === 0) return "sold_out"
  return quantity <= WHOLESALE_LOW_STOCK_THRESHOLD ? "low_stock" : "in_stock"
}

export const wholesaleStockStatus = (product: HttpTypes.StoreProduct) =>
  ({
    in_stock: "In Stock",
    low_stock: "Low Stock",
    sold_out: "Sold Out",
  }[wholesaleStockStatusCode(product)])

export const productStyleNumber = (product: HttpTypes.StoreProduct) =>
  wholesaleValue(product.metadata, "style_number", product.handle?.toUpperCase() || product.id)
