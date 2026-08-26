import { HttpTypes } from "@medusajs/types"

type WholesaleMetadata = Record<string, unknown> | null | undefined

export const wholesaleValue = (metadata: WholesaleMetadata, key: string, fallback = "—") => {
  const value = metadata?.[key]
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback
}

export const wholesaleStockStatus = (product: HttpTypes.StoreProduct) => {
  const configured = wholesaleValue(product.metadata, "stock_status", "")
  if (configured) {
    return (
      {
        in_stock: "In Stock",
        low_stock: "Low Stock",
        sold_out: "Sold Out",
      }[configured] || configured
    )
  }
  const quantity = product.variants?.reduce((total, variant) => total + (variant.inventory_quantity || 0), 0) || 0
  return quantity === 0 ? "Sold Out" : quantity <= 50 ? "Low Stock" : "In Stock"
}

export const productStyleNumber = (product: HttpTypes.StoreProduct) =>
  wholesaleValue(product.metadata, "style_number", product.handle?.toUpperCase() || product.id)
