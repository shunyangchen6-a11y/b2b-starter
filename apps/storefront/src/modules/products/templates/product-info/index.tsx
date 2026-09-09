import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import { productStyleNumber, wholesaleValue } from "@/lib/util/wholesale"
import { formatWholesaleProductPrice } from "@/lib/util/get-product-price"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const priceLabel = formatWholesaleProductPrice(product)

  return (
    <div id="product-info" className="min-w-0">
      <div className="flex flex-col gap-y-4 w-full">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Style No. {productStyleNumber(product)}</p>
        <Heading
          level="h1"
          className="break-words text-3xl leading-tight text-ui-fg-base md:text-[2.5rem] md:leading-10"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        <p
          className="break-words text-xl font-semibold leading-6 text-zinc-950 sm:text-2xl sm:leading-7"
          data-testid="wholesale-product-price"
        >
          {priceLabel}
        </p>
        <div className="grid grid-cols-1 gap-2 text-sm text-zinc-600 xsmall:grid-cols-2">
          <span className="min-w-0 break-words">MOQ: {wholesaleValue(product.metadata, "moq", "5")} pcs</span>
          <span className="min-w-0 break-words">Pack: {wholesaleValue(product.metadata, "pack_size", "5")} pcs</span>
        </div>
      </div>
    </div>
  )
}

export default ProductInfo
