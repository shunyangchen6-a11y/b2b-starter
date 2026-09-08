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
import ProductFacts from "../components/product-facts"

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
    <div className="my-2 flex w-full min-w-0 max-w-full flex-col gap-y-2 overflow-x-clip">
      <div
        className="content-container grid h-fit w-full min-w-0 max-w-full grid-cols-1 gap-2 md:grid-cols-2"
        data-testid="product-container"
      >
        <ImageGallery product={product} />
        <div className="flex h-full w-full min-w-0 max-w-full flex-col items-start justify-center gap-6 bg-neutral-100 p-4 xsmall:p-6 small:p-20">
          <ProductInfo product={product} />
          <Suspense
            fallback={<ProductActions product={product} region={region} />}
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>
          <ProductFacts product={product} />
        </div>
      </div>
      <div className="content-container">
        <ProductTabs product={product} />
      </div>
      <div
        className="content-container"
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
