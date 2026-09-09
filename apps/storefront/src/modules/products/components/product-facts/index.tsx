import {
  CheckCircleSolid,
  ExclamationCircleSolid,
  InformationCircleSolid,
} from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { wholesaleStockStatus, wholesaleValue } from "@/lib/util/wholesale"

const ProductFacts = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const managedVariants = product.variants?.filter(
    (variant) => variant.manage_inventory !== false
  )

  const inventoryQuantity =
    managedVariants?.reduce(
      (acc, variant) => acc + (variant.inventory_quantity ?? 0),
      0
    ) || 0

  const hasManageInventory = !!managedVariants?.length
  const stockStatus = wholesaleStockStatus(product)

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
      <span className="flex items-center gap-x-2 text-neutral-600 text-sm">
        {product.mid_code && (
          <>
            <InformationCircleSolid />
            MID: {product.mid_code}
          </>
        )}
      </span>
      {wholesaleValue(product.metadata, "video_url", "") !== "" && <a className="text-sm text-zinc-950 underline underline-offset-4" href={wholesaleValue(product.metadata, "video_url", "")} target="_blank" rel="noreferrer">Watch product video</a>}
    </div>
  )
}

export default ProductFacts
