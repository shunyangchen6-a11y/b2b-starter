import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { productStyleNumber, wholesaleValue } from "@/lib/util/wholesale"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="min-w-0">
      <div className="flex flex-col gap-y-4 w-full">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Style No. {productStyleNumber(product)}</p>
        <Heading
          level="h1"
          className="break-words text-3xl leading-tight text-ui-fg-base md:text-[2.5rem] md:leading-10"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        <Text
          className="text-2xl text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {product.subtitle}
        </Text>
        <p className="text-sm font-medium text-zinc-800">Contact for Wholesale Price</p>
        <div className="grid grid-cols-1 gap-2 text-xs text-zinc-600 xsmall:grid-cols-2"><span>Fabric: {wholesaleValue(product.metadata, "fabric")}</span><span>MOQ: {wholesaleValue(product.metadata, "moq", "5")} pcs</span><span>Pack: {wholesaleValue(product.metadata, "pack_size", "5")} pcs</span><span>Category: {product.categories?.[0]?.name || "Men's wholesale"}</span></div>
      </div>
    </div>
  )
}

export default ProductInfo
