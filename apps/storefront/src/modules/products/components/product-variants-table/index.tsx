import { useSelection } from "@/lib/selection/selection-context"
import {
  normalizeQuantity,
  normalizeSelectionQuantity,
} from "@/lib/selection/quote"
import { productStyleNumber, variantAvailableQuantity, wholesaleValue } from "@/lib/util/wholesale"
import { formatWholesaleVariantPrice } from "@/lib/util/get-product-price"
import { groupVariantsByColor } from "@/lib/util/product-variant-groups"
import { HttpTypes } from "@medusajs/types"
import Button from "@/modules/common/components/button"
import { useState } from "react"
import BulkTableQuantity from "../bulk-table-quantity"

const ProductVariantsTable = ({
  product,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) => {
  const { addItem } = useSelection()
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map())

  const totalQuantity = Array.from(quantities.values()).reduce(
    (total, quantity) => total + normalizeQuantity(quantity),
    0
  )

  const optionValue = (variant: HttpTypes.StoreProductVariant, optionTitle: string) => {
    const optionId = product.options?.find(
      (option) => option.title?.toLowerCase() === optionTitle.toLowerCase()
    )?.id
    return variant.options?.find((option) => option.option_id === optionId)?.value || "—"
  }

  const colorOptionId = product.options?.find(
    (option) => option.title?.toLowerCase() === "color"
  )?.id
  const variantGroups = groupVariantsByColor(
    product.variants || [],
    colorOptionId
  )

  const handleQuantityChange = (variantId: string, quantity: number) => {
    const variant = product.variants?.find((entry) => entry.id === variantId)
    const availableQuantity = variant?.manage_inventory === false
      ? Number.MAX_SAFE_INTEGER
      : variant ? variantAvailableQuantity(variant) : 0
    const normalizedQuantity = normalizeSelectionQuantity(quantity, availableQuantity)

    setQuantities((prev) => {
      const next = new Map(prev)
      normalizedQuantity > 0
        ? next.set(variantId, normalizedQuantity)
        : next.delete(variantId)
      return next
    })
  }

  const handleAddToSelection = () => {
    quantities.forEach((quantity, variantId) => {
      const variant = product.variants?.find((entry) => entry.id === variantId)
      const availableQuantity = variant?.manage_inventory === false
        ? Number.MAX_SAFE_INTEGER
        : variant ? variantAvailableQuantity(variant) : 0
      const normalizedQuantity = normalizeSelectionQuantity(quantity, availableQuantity)
      if (!variant || normalizedQuantity === 0) return
      const options = Object.fromEntries((variant.options || []).map((option) => [option.option_id || option.id || "option", option.value || ""]))
      addItem({
        id: variant.id,
        productId: product.id,
        handle: product.handle || product.id,
        title: product.title,
        styleNumber: productStyleNumber(product),
        variantId: variant.id,
        sku: variant.sku || "",
        color: Object.values(options)[0] || wholesaleValue(product.metadata, "color", "Mixed"),
        size: Object.values(options)[1] || Object.values(options)[0] || "Mixed",
        quantity: normalizedQuantity,
        packSize: wholesaleValue(product.metadata, "pack_size", "5") === "10" ? 10 : 5,
        availableQuantity: Number.isSafeInteger(availableQuantity) ? availableQuantity : undefined,
        image: product.thumbnail || undefined,
        unitPrice: formatWholesaleVariantPrice(variant),
      })
    })
    setQuantities(new Map())
  }

  return (
    <div id="product-variant-selection" className="flex min-w-0 scroll-mt-24 flex-col gap-6">
      <div className="grid min-w-0 gap-4" data-testid="color-grouped-variants">
        {variantGroups.map(({ color, variants }) => (
          <section key={color} className="min-w-0 border border-zinc-200 bg-white">
            <h3 className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-950">
              {color}
            </h3>
            <div className="divide-y divide-zinc-100">
              {variants.map((variant) => {
                const availableQuantity = variant.manage_inventory === false
                  ? undefined
                  : variantAvailableQuantity(variant)

                return (
                  <article
                    key={variant.id}
                    className="grid min-w-0 grid-cols-2 gap-3 p-4 lg:grid-cols-[minmax(90px,0.65fr)_minmax(120px,0.9fr)_minmax(210px,1.5fr)] lg:items-center"
                    data-testid="grouped-variant-row"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Size</p>
                      <p className="mt-1 text-base font-semibold text-zinc-950">{optionValue(variant, "Size")}</p>
                      <p className="mt-1 truncate text-[11px] text-zinc-400" title={variant.sku || undefined}>
                        {variant.sku || "SKU unavailable"}
                      </p>
                    </div>
                    <div className="min-w-0 text-right lg:text-left">
                      <p className="break-words text-sm font-medium text-zinc-900">
                        {formatWholesaleVariantPrice(variant)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {typeof availableQuantity === "number"
                          ? `${availableQuantity} available`
                          : "Available on request"}
                      </p>
                    </div>
                    <div className="col-span-2 min-w-0 lg:col-span-1">
                      <BulkTableQuantity
                        variantId={variant.id}
                        maxQuantity={availableQuantity}
                        onChange={handleQuantityChange}
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <Button
        onClick={handleAddToSelection}
        variant="secondary"
        className="min-h-11 w-full md:h-10"
        disabled={totalQuantity === 0}
        data-testid="add-product-button"
      >
        {totalQuantity === 0
          ? "Choose sizes and quantities"
          : `Save ${totalQuantity} pieces to Inquiry List`}
      </Button>
    </div>
  )
}

export default ProductVariantsTable
