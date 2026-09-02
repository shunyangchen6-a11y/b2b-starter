import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { CreateInquiryType } from "../../api/store/inquiries/validators"

export const validateInquiryInventoryStep = createStep(
  "validate-inquiry-inventory",
  async (input: CreateInquiryType, { container }) => {
    const productService = container.resolve(Modules.PRODUCT) as any
    const inventoryService = container.resolve(Modules.INVENTORY) as any
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
    const requestedByVariantId = new Map<string, { sku: string; quantity: number }>()

    for (const item of input.items) {
      const existing = requestedByVariantId.get(item.variantId)
      if (existing && existing.sku !== item.sku) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "A selected variant has inconsistent SKU data."
        )
      }
      requestedByVariantId.set(item.variantId, {
        sku: item.sku,
        quantity: (existing?.quantity || 0) + item.quantity,
      })
    }

    const variantIds = Array.from(requestedByVariantId.keys())
    const variants = await productService.listProductVariants(
      { id: { $in: variantIds } },
      { select: ["id", "sku", "product_id"] }
    )
    const variantsById = new Map<string, any>(
      variants.map((variant: any) => [variant.id, variant])
    )
    const productIds = variants.map((variant: any) => variant.product_id).filter(Boolean)
    const { data: products } = productIds.length
      ? await query.graph({
          entity: "product",
          fields: ["variants.id", "variants.inventory_items.inventory_item_id"],
          filters: { id: { $in: productIds } },
        })
      : { data: [] }
    const inventoryItemIds = products.flatMap((product: any) =>
      (product.variants || []).flatMap((variant: any) =>
        (variant.inventory_items || []).map((item: { inventory_item_id: string }) => item.inventory_item_id)
      )
    )
    const levels = inventoryItemIds.length
      ? await inventoryService.listInventoryLevels({ inventory_item_id: inventoryItemIds })
      : []
    const availableByItemId = new Map<string, number>()

    for (const level of levels) {
      const available = Math.max(
        0,
        Number(level.stocked_quantity || 0) - Number(level.reserved_quantity || 0)
      )
      availableByItemId.set(
        level.inventory_item_id,
        (availableByItemId.get(level.inventory_item_id) || 0) + available
      )
    }

    for (const [variantId, requested] of requestedByVariantId) {
      const variant = variantsById.get(variantId)
      if (!variant || variant.sku !== requested.sku) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "A selected product variant is no longer available. Refresh the page and try again."
        )
      }
      const inventoryVariant = products
        .flatMap((product: any) => product.variants || [])
        .find((candidate: any) => candidate.id === variantId)
      const inventoryItemId = inventoryVariant?.inventory_items?.[0]?.inventory_item_id
      const availableQuantity = inventoryItemId
        ? availableByItemId.get(inventoryItemId) || 0
        : 0

      if (requested.quantity > availableQuantity) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Only ${availableQuantity} piece(s) are available for SKU ${requested.sku}.`
        )
      }
    }

    return new StepResponse(input)
  }
)
