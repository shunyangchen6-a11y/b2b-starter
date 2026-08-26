import { useSelection } from "@/lib/selection/selection-context"
import { productStyleNumber, wholesaleValue } from "@/lib/util/wholesale"
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

  const totalQuantity = Array.from(quantities.values()).reduce((acc, current) => acc + current, 0)

  const handleQuantityChange = (variantId: string, quantity: number) => {
    setQuantities((prev) => {
      const next = new Map(prev)
      quantity > 0 ? next.set(variantId, quantity) : next.delete(variantId)
      return next
    })
  }

  const handleAddToSelection = () => {
    quantities.forEach((quantity, variantId) => {
      const variant = product.variants?.find((entry) => entry.id === variantId)
      if (!variant || !quantity) return
      const options = Object.fromEntries((variant.options || []).map((option) => [option.option_id || option.id || "option", option.value || ""]))
      addItem({
        id: variant.id,
        handle: product.handle || product.id,
        title: product.title,
        styleNumber: productStyleNumber(product),
        color: Object.values(options)[0] || wholesaleValue(product.metadata, "color", "Mixed"),
        size: Object.values(options)[1] || Object.values(options)[0] || "Mixed",
        quantity,
        packSize: wholesaleValue(product.metadata, "pack_size", "5") === "10" ? 10 : 5,
        image: product.thumbnail || undefined,
      })
    })
    setQuantities(new Map())
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto p-px">
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
                      onChange={handleQuantityChange}
                    />
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
        className="w-full h-10"
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
