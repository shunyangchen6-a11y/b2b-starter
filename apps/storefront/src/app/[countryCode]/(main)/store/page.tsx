import { listCategories } from "@/lib/data/categories"
import { retrieveCustomer } from "@/lib/data/customer"
import { listGlobalProductOptions } from "@/lib/data/product-options"
import { listProducts } from "@/lib/data/products"
import { parseOptionValueIds } from "@/lib/util/option-value-query"
import { parseWholesaleFilters } from "@/lib/util/wholesale-filters"
import SkeletonProductGrid from "@/modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@/modules/store/components/refinement-list"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import PaginatedProducts from "@/modules/store/templates/paginated-products"
import { Metadata } from "next"
import { Suspense } from "react"

export const dynamicParams = true

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    optionValueIds?: string | string[]
    category?: string | string[]
    size?: string | string[]
    color?: string | string[]
    fabric?: string | string[]
    stock_status?: string | string[]
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams

  const sort = sortBy || "created_at"
  const pageNumber = page ? parseInt(page) : 1
  const optionValueIds = parseOptionValueIds(searchParams)
  const wholesaleFilters = parseWholesaleFilters(searchParams)

  const [categories, customer, productOptions, availableProducts] = await Promise.all([
    listCategories(),
    retrieveCustomer(),
    listGlobalProductOptions(),
    listProducts({
      pageParam: 1,
      queryParams: { limit: 100 },
      countryCode: params.countryCode,
    }).then(({ response }) => response.products),
  ])

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-clip bg-neutral-100">
      <div
        className="content-container flex w-full min-w-0 max-w-full flex-col gap-4 py-6"
        data-testid="category-container"
      >
        <StoreBreadcrumb />
        <div className="flex min-w-0 max-w-full flex-col gap-3 small:flex-row small:items-start">
          <RefinementList
            sortBy={sort}
            categories={categories}
            productOptions={productOptions}
            products={availableProducts}
            selectedFilters={wholesaleFilters}
          />
          <div className="w-full min-w-0 max-w-full">
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                countryCode={params.countryCode}
                customer={customer}
                optionValueIds={optionValueIds}
                wholesaleFilters={wholesaleFilters}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
;``
