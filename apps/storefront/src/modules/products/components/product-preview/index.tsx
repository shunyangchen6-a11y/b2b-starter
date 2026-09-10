import { productStyleNumber, wholesaleStockStatus } from "@/lib/util/wholesale"
import { formatWholesaleProductPrice } from "@/lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import ProductInquiryButton from "../product-inquiry-button"

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
  const priceLabel = formatWholesaleProductPrice(product)
  const sizes = product.variants?.map((variant) => variant.options?.map((option) => option.value).filter(Boolean).join(" / ")).filter(Boolean).slice(0, 3)

  return (
    <article
      data-testid="product-wrapper"
      className="relative flex min-w-0 w-full flex-col bg-white"
    >
      <LocalizedClientLink href={`/products/${product.handle}`} className="group flex min-w-0 flex-1 flex-col">
        <div data-testid="product-image-frame" className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
            framed
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 border-t border-zinc-100 pt-3 txt-compact-medium">
          <Text className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Style {productStyleNumber(product)}</Text>
          <Text className="min-h-10 line-clamp-2 break-words text-sm font-medium leading-5 text-zinc-950" data-testid="product-title">
            {product.title}
          </Text>
          <Text
            className="break-words text-base font-semibold leading-5 text-zinc-950"
            data-testid="wholesale-product-price"
          >
            {priceLabel}
          </Text>
          <div className="mt-auto flex min-w-0 items-end justify-between gap-2 pt-1">
            <Text
              className={clx("wholesale-status", {
                "wholesale-status--in-stock": stockStatus === "In Stock",
                "wholesale-status--low-stock": stockStatus === "Low Stock",
                "wholesale-status--sold-out": stockStatus === "Sold Out",
              })}
            >
              {stockStatus}
            </Text>
            <Text className="max-w-[45%] truncate text-[11px] text-zinc-500">{sizes?.join(" · ") || "Sizes on request"}</Text>
          </div>
        </div>
      </LocalizedClientLink>
      <ProductInquiryButton
        productId={product.id}
        handle={product.handle || product.id}
        title={product.title}
        styleNumber={productStyleNumber(product)}
        image={product.thumbnail || undefined}
        disabled={stockStatus === "Sold Out"}
        className="mt-3"
      />
    </article>
  )
}
