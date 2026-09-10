"use client"

import { HttpTypes } from "@medusajs/types"
import ProductVariantsTable from "../product-variants-table"
import ProductInquiryButton from "../product-inquiry-button"
import ProductInquiryProgress from "../product-inquiry-progress"
import { productStyleNumber, wholesaleStockStatus } from "@/lib/util/wholesale"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}

export default function ProductActions({
  product,
  region,
}: ProductActionsProps) {
  return (
    <>
      <div className="flex flex-col gap-y-2 w-full">
        <ProductVariantsTable product={product} region={region} />
        <ProductInquiryProgress />
        <ProductInquiryButton
          productId={product.id}
          handle={product.handle || product.id}
          title={product.title}
          styleNumber={productStyleNumber(product)}
          image={product.thumbnail || undefined}
          disabled={wholesaleStockStatus(product) === "Sold Out"}
          className="mt-2"
          variantTargetId="product-variant-selection"
        />
      </div>
    </>
  )
}
