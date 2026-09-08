import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"

/**
 * Sort wholesale styles without exposing or deriving retail prices.
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  const sortedProducts = [...products]

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  return sortedProducts
}
