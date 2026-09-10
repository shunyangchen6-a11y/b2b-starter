import { CheckCircleSolid, ExclamationCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { wholesaleStockStatus, wholesaleValue } from "@/lib/util/wholesale"
import { formatWholesaleProductPrice } from "@/lib/util/get-product-price"

const ProductFacts = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const hasManageInventory = !!product.variants?.some(
    (variant) => variant.manage_inventory !== false
  )
  const stockStatus = wholesaleStockStatus(product)
  const optionId = (title: string) => product.options?.find(
    (option) => option.title?.toLowerCase() === title.toLowerCase()
  )?.id
  const optionValue = (
    variant: NonNullable<typeof product.variants>[number],
    title: string
  ) => variant.options?.find(
    (option) => option.option_id === optionId(title)
  )?.value
  const colors = Array.from(new Set(
    product.variants?.map((variant) => optionValue(variant, "Color")).filter(Boolean) || []
  ))
  const sizes = Array.from(new Set(
    product.variants?.map((variant) => optionValue(variant, "Size")).filter(Boolean) || []
  ))
  const stockUpdated = wholesaleValue(product.metadata, "stock_updated_at", "")
  const stockUpdatedDate = stockUpdated && !Number.isNaN(Date.parse(stockUpdated))
    ? new Date(stockUpdated).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })
    : null

  return (
    <div className="flex flex-col gap-y-2 w-full">
      {product.subtitle && (
        <p className="break-words text-sm leading-6 text-zinc-600">
          {product.subtitle}
        </p>
      )}
      <p className="text-sm text-zinc-600">
        Category: {product.categories?.[0]?.name || "Men's wholesale"}
      </p>
      <dl className="grid grid-cols-1 gap-2 border-y border-zinc-200 py-4 text-sm text-zinc-700 xsmall:grid-cols-2">
        <div><dt className="font-semibold text-zinc-950">Style No.</dt><dd>{wholesaleValue(product.metadata, "style_number", product.handle || product.id)}</dd></div>
        <div><dt className="font-semibold text-zinc-950">Fabric</dt><dd>{wholesaleValue(product.metadata, "fabric")}</dd></div>
        <div><dt className="font-semibold text-zinc-950">Color</dt><dd>{colors.join(", ") || "—"}</dd></div>
        <div><dt className="font-semibold text-zinc-950">Available Sizes</dt><dd>{sizes.join(", ") || "—"}</dd></div>
        <div><dt className="font-semibold text-zinc-950">Pack Size</dt><dd>{wholesaleValue(product.metadata, "pack_size", "5")} pcs</dd></div>
        <div><dt className="font-semibold text-zinc-950">Total MOQ</dt><dd>100 pcs</dd></div>
        <div className="xsmall:col-span-2"><dt className="font-semibold text-zinc-950">Wholesale price</dt><dd>{formatWholesaleProductPrice(product)}</dd></div>
      </dl>
      {stockUpdatedDate && <p className="text-xs text-zinc-500">Stock updated: {stockUpdatedDate}</p>}
      {hasManageInventory && (stockStatus === "In Stock" ? (
        <span className="flex items-center gap-x-2 text-neutral-600 text-sm">
          <CheckCircleSolid className="text-emerald-700" /> Can be shipped
          Ready Stock · Contact us for real-time quantity
        </span>
      ) : (
        <span className="flex items-center gap-x-2 text-neutral-600 text-sm ">
          <ExclamationCircleSolid className="text-[#8A6A38]" />
          {stockStatus === "Sold Out" ? "Sold Out · Ask for similar styles" : "Low Stock · Contact us before ordering"}
        </span>
      ))}
      {wholesaleValue(product.metadata, "video_url", "") !== "" && <a className="text-sm text-zinc-950 underline underline-offset-4" href={wholesaleValue(product.metadata, "video_url", "")} target="_blank" rel="noreferrer">Watch product video</a>}
    </div>
  )
}

export default ProductFacts
