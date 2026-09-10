import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import Product from "../product-preview"
import { filterWholesaleCatalogProducts } from "@/lib/util/wholesale-filters"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const queryParams: HttpTypes.StoreProductParams & {
    limit?: number
    tag_id?: string[]
    collection_id?: string[]
    is_giftcard?: boolean
  } = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  queryParams.is_giftcard = false
  queryParams.limit = 100

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return filterWholesaleCatalogProducts(response.products)
      .filter((responseProduct) => responseProduct.id !== product.id)
      .slice(0, 4)
  })

  if (!products.length) {
    return null
  }

  return (
    <section className="flex flex-col gap-y-6 border-t border-zinc-200 bg-white py-10 md:py-16">
      <Heading level="h2" className="text-xl font-medium uppercase tracking-[0.06em] text-neutral-950 md:text-2xl">
        You might also like
      </Heading>
      <ul className="grid grid-cols-2 gap-x-2 gap-y-8 md:grid-cols-4 md:gap-x-3">
        {products.map((product) => (
          <li key={product.id}>
            <Product region={region} product={product} />
          </li>
        ))}
      </ul>
    </section>
  )
}
