"use client"

import { HttpTypes } from "@medusajs/types"
import ProductPrice from "../product-price"
import ProductVariantsTable from "../product-variants-table"
import ProductInquiryButton from "../product-inquiry-button"
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
        <ProductPrice product={product} />
        <ProductInquiryButton
          productId={product.id}
          handle={product.handle || product.id}
          title={product.title}
          styleNumber={productStyleNumber(product)}
          image={product.thumbnail || undefined}
          disabled={wholesaleStockStatus(product) === "Sold Out"}
          className="mb-2"
        />
        <ProductVariantsTable product={product} region={region} />
      </div>
    </>
  )
}
