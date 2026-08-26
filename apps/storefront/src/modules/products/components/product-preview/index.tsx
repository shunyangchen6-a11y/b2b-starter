import { productStyleNumber, wholesaleStockStatus } from "@/lib/util/wholesale"
import { HttpTypes } from "@medusajs/types"
import { Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  if (!product) {
    return null
  }

  const stockStatus = wholesaleStockStatus(product)
  const sizes = product.variants?.map((variant) => variant.options?.map((option) => option.value).filter(Boolean).join(" / ")).filter(Boolean).slice(0, 3)

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div
        data-testid="product-wrapper"
        className="flex flex-col gap-4 relative aspect-[3/5] w-full overflow-hidden p-4 bg-white shadow-borders-base rounded-lg group-hover:shadow-[0_0_0_3px_rgba(180,132,38,0.35)] transition-shadow ease-in-out duration-150"
      >
        <div className="w-full h-full p-10">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="square"
            isFeatured={isFeatured}
          />
        </div>
        <div className="flex flex-col txt-compact-medium">
          <Text className="text-amber-700 text-xs font-semibold uppercase tracking-wide">Style {productStyleNumber(product)}</Text>
          <Text className="text-ui-fg-base" data-testid="product-title">
            {product.title}
          </Text>
        </div>
        <Text className="text-sm font-medium">Contact for Wholesale Price</Text>
        <div className="flex justify-between">
          <div className="flex flex-row gap-1 items-center">
            <span
              className={clx({
                "text-green-500": stockStatus === "In Stock",
                "text-orange-500": stockStatus === "Low Stock",
                "text-red-500": stockStatus === "Sold Out",
              })}
            >
              •
            </span>
            <Text className="text-neutral-600 text-xs">
              {stockStatus}
            </Text>
          </div>
          <Text className="text-neutral-500 text-[0.65rem] truncate max-w-[45%]">{sizes?.join(" · ") || "Sizes on request"}</Text>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
