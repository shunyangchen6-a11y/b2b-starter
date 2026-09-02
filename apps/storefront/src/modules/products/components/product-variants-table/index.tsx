import { useSelection } from "@/lib/selection/selection-context"
import { normalizeQuantity } from "@/lib/selection/quote"
import { productStyleNumber, variantAvailableQuantity, wholesaleValue } from "@/lib/util/wholesale"
import { HttpTypes } from "@medusajs/types"
import { clx, Table } from "@medusajs/ui"
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

  const handleQuantityChange = (variantId: string, quantity: number) => {
    const variant = product.variants?.find((entry) => entry.id === variantId)
    const availableQuantity = variant?.manage_inventory === false
      ? Number.MAX_SAFE_INTEGER
      : variant ? variantAvailableQuantity(variant) : 0
    const normalizedQuantity = Math.min(normalizeQuantity(quantity), availableQuantity)

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
      const normalizedQuantity = Math.min(normalizeQuantity(quantity), availableQuantity)
      if (!variant || normalizedQuantity === 0) return
      const options = Object.fromEntries((variant.options || []).map((option) => [option.option_id || option.id || "option", option.value || ""]))
      addItem({
        id: variant.id,
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
      })
    })
    setQuantities(new Map())
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid gap-3 md:hidden" data-testid="mobile-variant-cards">
        {product.variants?.map((variant) => {
          const availableQuantity = variant.manage_inventory === false
            ? undefined
            : variantAvailableQuantity(variant)

          return (
            <article
              key={variant.id}
              className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              data-testid="mobile-variant-card"
            >
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="col-span-2 min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">SKU</dt>
                  <dd className="mt-1 break-words font-medium leading-5 text-zinc-950">{variant.sku || "—"}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Color</dt>
                  <dd className="mt-1 break-words text-zinc-900">{optionValue(variant, "Color")}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Size</dt>
                  <dd className="mt-1 break-words text-zinc-900">{optionValue(variant, "Size")}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Wholesale price</dt>
                  <dd className="mt-1 text-zinc-900">Contact for Wholesale Price</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Available</dt>
                  <dd className="mt-1 font-medium text-zinc-900">
                    {typeof availableQuantity === "number" ? `${availableQuantity} available` : "Available on request"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 border-t border-zinc-100 pt-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Pieces</p>
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
      <div className="hidden overflow-x-auto p-px md:block">
        <Table className="w-full rounded-xl overflow-hidden shadow-borders-base border-none ">
          <Table.Header className="border-t-0">
            <Table.Row className="bg-neutral-100 border-none hover:!bg-neutral-100">
              <Table.HeaderCell className="px-4">SKU</Table.HeaderCell>
              {product.options?.map((option) => {
                if (option.title === "Default option") {
                  return null
                }
                return (
                  <Table.HeaderCell key={option.id} className="px-4 border-x">
                    {option.title}
                  </Table.HeaderCell>
                )
              })}
              <Table.HeaderCell className="px-4 border-x">Wholesale price</Table.HeaderCell>
              <Table.HeaderCell className="px-4">Pieces</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body className="border-none">
            {product.variants?.map((variant, index) => {
              const availableQuantity = variant.manage_inventory === false
                ? undefined
                : variantAvailableQuantity(variant)
              return (
                <Table.Row
                  key={variant.id}
                  className={clx({
                    "border-b-0": index === product.variants?.length! - 1,
                  })}
                >
                  <Table.Cell className="px-4">{variant.sku}</Table.Cell>
                  {variant.options?.map((option, index) => {
                    if (option.value === "Default option value") {
                      return null
                    }
                    return (
                      <Table.Cell key={option.id} className="px-4 border-x">
                        {option.value}
                      </Table.Cell>
                    )
                  })}
                  <Table.Cell className="px-4 border-x text-xs text-zinc-500">Contact for Wholesale Price</Table.Cell>
                  <Table.Cell className="pl-1 !pr-1">
                    <BulkTableQuantity
                      variantId={variant.id}
                      maxQuantity={availableQuantity}
                      onChange={handleQuantityChange}
                    />
                    {typeof availableQuantity === "number" && (
                      <p className="px-2 pt-1 text-xs text-zinc-500">
                        {availableQuantity} available
                      </p>
                    )}
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </div>
      <Button
        onClick={handleAddToSelection}
        variant="primary"
        className="min-h-11 w-full md:h-10"
        disabled={totalQuantity === 0}
        data-testid="add-product-button"
      >
        {totalQuantity === 0
          ? "Choose product variant(s) above"
          : "Add to Selection List"}
      </Button>
    </div>
  )
}

export default ProductVariantsTable
