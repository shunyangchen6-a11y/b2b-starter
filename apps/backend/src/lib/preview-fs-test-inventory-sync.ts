import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"

const FS_TEST_SKU_PREFIX = "FS-TEST-"
const PREVIEW_HANDLE_PATTERN = /(^|[-_])(?:preview|pr)(?:[-_]|$)/

type StockStatus = "in_stock" | "low_stock" | "sold_out"
type SyncFailure = { sku: string; reason: string }

export type FsTestInventorySyncSummary = {
  scanned_variants: number
  synchronized_variants: number
  status_counts: Record<StockStatus, number>
  failures: SyncFailure[]
}

export const isPreviewInventorySyncEnabled = (env: NodeJS.ProcessEnv = process.env) => {
  const handle = env.MEDUSA_CLOUD_ENVIRONMENT_HANDLE?.trim().toLowerCase() || ""
  return (
    env.MEDUSA_PREVIEW_INVENTORY_SYNC_ENABLED === "true" &&
    PREVIEW_HANDLE_PATTERN.test(handle)
  )
}

export const isAdminActor = (authContext?: { actor_id?: string; actor_type?: string }) =>
  authContext?.actor_type === "user" && Boolean(authContext.actor_id)

export const fsTestStockQuantity = (status: unknown): number | null => {
  if (status === "in_stock") return 180
  if (status === "low_stock") return 24
  if (status === "sold_out") return 0
  return null
}

const emptyStatusCounts = (): Record<StockStatus, number> => ({
  in_stock: 0,
  low_stock: 0,
  sold_out: 0,
})

export const syncFsTestInventory = async (
  container: MedusaContainer
): Promise<FsTestInventorySyncSummary> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const link = container.resolve(ContainerRegistrationKeys.LINK) as any
  const inventoryService = container.resolve(Modules.INVENTORY) as any
  const productService = container.resolve(Modules.PRODUCT) as any
  const summary: FsTestInventorySyncSummary = {
    scanned_variants: 0,
    synchronized_variants: 0,
    status_counts: emptyStatusCounts(),
    failures: [],
  }

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  const stockLocation = stockLocations.find(
    (location: { name?: string }) => location.name === "Default Stock Location"
  ) || stockLocations[0]
  if (!stockLocation) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "A stock location is required before FS-TEST inventory can be synchronized."
    )
  }

  const fsTestVariants = await productService.listProductVariants(
    { sku: { $like: `${FS_TEST_SKU_PREFIX}%` } },
    { select: ["id", "product_id", "sku"] }
  )
  const productIds = Array.from(
    new Set(fsTestVariants.map((variant: any) => variant.product_id).filter(Boolean))
  )
  if (!productIds.length) return summary

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "metadata",
      "variants.id",
      "variants.sku",
      "variants.manage_inventory",
      "variants.allow_backorder",
      "variants.inventory_items.inventory_item_id",
    ],
    filters: { id: { $in: productIds } },
  })
  const productById = new Map<string, any>(
    products.map((product: any) => [product.id, product])
  )
  const variants = fsTestVariants
    .filter((variant: any) => typeof variant.sku === "string" && variant.sku.startsWith(FS_TEST_SKU_PREFIX))
    .map((variant: any) => {
      const product = productById.get(variant.product_id)
      const inventoryVariant = product?.variants?.find(
        (candidate: any) => candidate.id === variant.id
      )
      return { variant, product, inventoryVariant }
    })

  summary.scanned_variants = variants.length
  const validVariants = variants.filter(({ variant, product, inventoryVariant }: any) => {
    const quantity = fsTestStockQuantity(product?.metadata?.stock_status)
    if (!product || !inventoryVariant || quantity === null) {
      summary.failures.push({
        sku: variant.sku,
        reason: !product || !inventoryVariant
          ? "The existing product variant could not be loaded."
          : "The product has an unsupported stock_status metadata value.",
      })
      return false
    }
    return true
  })

  const missingInventory = validVariants.filter(
    ({ inventoryVariant }: any) => !inventoryVariant.inventory_items?.length
  )
  if (missingInventory.length) {
    const inventoryItems = await inventoryService.createInventoryItems(
      missingInventory.map(({ variant }: any) => ({ sku: variant.sku }))
    )
    for (const [index, { variant }] of missingInventory.entries()) {
      await link.create({
        [Modules.PRODUCT]: { variant_id: variant.id },
        [Modules.INVENTORY]: { inventory_item_id: inventoryItems[index].id },
      })
    }
  }

  const { data: refreshedProducts } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "metadata",
      "variants.id",
      "variants.sku",
      "variants.manage_inventory",
      "variants.allow_backorder",
      "variants.inventory_items.inventory_item_id",
    ],
    filters: { id: { $in: productIds } },
  })
  const refreshedByVariantId = new Map(
    refreshedProducts.flatMap((product: any) =>
      (product.variants || []).map((variant: any) => [variant.id, { variant, product }])
    )
  )
  const readyVariants = validVariants.flatMap(({ variant }: any) => {
    const refreshed = refreshedByVariantId.get(variant.id) as
      | { variant: { id: string; sku: string; inventory_items?: { inventory_item_id: string }[] }; product: { metadata?: Record<string, unknown> } }
      | undefined
    if (!refreshed?.variant.inventory_items?.[0]?.inventory_item_id) {
      summary.failures.push({ sku: variant.sku, reason: "No inventory item could be linked to this variant." })
      return []
    }
    return [refreshed]
  })

  const variantsNeedingInventoryConfig = readyVariants.filter(
    ({ variant }: any) => variant.manage_inventory !== true || variant.allow_backorder !== false
  )
  if (variantsNeedingInventoryConfig.length) {
    await updateProductVariantsWorkflow(container).run({
      input: {
        product_variants: variantsNeedingInventoryConfig.map(({ variant }: any) => ({
          id: variant.id,
          manage_inventory: true,
          allow_backorder: false,
        })),
      },
    })
  }

  const inventoryItemIds = readyVariants.map(
    ({ variant }: any) => variant.inventory_items?.[0]?.inventory_item_id
  ).filter(Boolean)
  const existingLevels = inventoryItemIds.length
    ? await inventoryService.listInventoryLevels({ inventory_item_id: inventoryItemIds })
    : []
  const levelByInventoryItemId = new Map(
    existingLevels
      .filter((level: any) => level.location_id === stockLocation.id)
      .map((level: any) => [level.inventory_item_id, level])
  )

  for (const { variant, product } of readyVariants) {
    const status = product.metadata?.stock_status as StockStatus
    const stockedQuantity = fsTestStockQuantity(status)
    const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
    if (stockedQuantity === null || !inventoryItemId) {
      summary.failures.push({ sku: variant.sku, reason: "Inventory synchronization data is incomplete." })
      continue
    }

    try {
      const level = levelByInventoryItemId.get(inventoryItemId) as any
      if (level && Number(level.stocked_quantity) !== stockedQuantity) {
        await inventoryService.updateInventoryLevels({
          id: level.id,
          stocked_quantity: stockedQuantity,
        })
      } else if (!level) {
        await inventoryService.createInventoryLevels({
          inventory_item_id: inventoryItemId,
          location_id: stockLocation.id,
          stocked_quantity: stockedQuantity,
        })
        levelByInventoryItemId.set(inventoryItemId, { stocked_quantity: stockedQuantity })
      }
      summary.synchronized_variants += 1
      summary.status_counts[status] += 1
    } catch (error) {
      summary.failures.push({
        sku: variant.sku,
        reason: error instanceof Error ? error.message : "Unable to synchronize inventory.",
      })
    }
  }

  return summary
}
