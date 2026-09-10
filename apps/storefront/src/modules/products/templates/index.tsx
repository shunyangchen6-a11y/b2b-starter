import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@/modules/products/components/image-gallery"
import ProductActions from "@/modules/products/components/product-actions"
import ProductTabs from "@/modules/products/components/product-tabs"
import RelatedProducts from "@/modules/products/components/related-products"
import ProductInfo from "@/modules/products/templates/product-info"
import SkeletonRelatedProducts from "@/modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import React, { Suspense } from "react"
import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col overflow-x-clip bg-white">
      <div
        className="content-container grid h-fit w-full min-w-0 max-w-[1680px] grid-cols-1 items-start gap-8 py-4 large:grid-cols-[minmax(0,3fr)_minmax(380px,2fr)] large:gap-10 large:py-6"
        data-testid="product-container"
      >
        <ImageGallery product={product} />
        <div className="flex w-full min-w-0 max-w-full flex-col items-start justify-start gap-6 bg-white large:sticky large:top-[116px] large:max-h-[calc(100vh-132px)] large:overflow-y-auto large:pr-2">
          <ProductInfo product={product} />
          <Suspense
            fallback={<ProductActions product={product} region={region} />}
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>
          <ProductTabs product={product} />
        </div>
      </div>
      <div
        className="content-container max-w-[1680px]"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </div>
  )
}

export default ProductTemplate
