import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"

const expectedHandles = [
  "fs-test-classic-jogger-pants",
  "fs-test-multi-pocket-cargo-pants",
  "fs-test-straight-leg-casual-pants",
  "fs-test-regular-fit-jeans",
  "fs-test-basic-cotton-t-shirt",
]

const expectedQuantityByStatus = {
  in_stock: 180,
  low_stock: 24,
  sold_out: 0,
} as const

export default async function verifyWholesaleTestData({
  container,
}: {
  container: MedusaContainer
}) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const inventoryService = container.resolve(Modules.INVENTORY) as any
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "status",
      "metadata",
      "categories.handle",
      "sales_channels.id",
      "variants.sku",
      "variants.inventory_quantity",
      "variants.manage_inventory",
      "variants.inventory_items.inventory_item_id",
      "variants.options.value",
    ],
    filters: { handle: { $in: expectedHandles } },
  })

  const failures: string[] = []
  const inventoryItemIds = products.flatMap((product: any) =>
    (product.variants || []).flatMap((variant: any) =>
      (variant.inventory_items || []).map((item: any) => item.inventory_item_id)
    )
  )
  const inventoryLevels = inventoryItemIds.length
    ? await inventoryService.listInventoryLevels({ inventory_item_id: inventoryItemIds })
    : []
  const availableByItemId = new Map<string, number>()
  for (const level of inventoryLevels) {
    const available = Math.max(
      0,
      Number(level.stocked_quantity || 0) - Number(level.reserved_quantity || 0)
    )
    availableByItemId.set(
      level.inventory_item_id,
      (availableByItemId.get(level.inventory_item_id) || 0) + available
    )
  }
  if (products.length !== expectedHandles.length) {
    failures.push(`expected ${expectedHandles.length} products but found ${products.length}`)
  }

  for (const handle of expectedHandles) {
    const product = products.find((item: any) => item.handle === handle)
    if (!product) {
      failures.push(`missing ${handle}`)
      continue
    }

    const metadata = product.metadata || {}
    for (const key of [
      "category",
      "fabric",
      "pack_size",
      "moq",
      "stock_status",
      "video_url",
      "wholesale_only",
    ]) {
      if (metadata[key] === undefined) failures.push(`${handle} is missing metadata.${key}`)
    }

    if (!product.categories?.some((category: any) => category.handle === metadata.category)) {
      failures.push(`${handle} category metadata does not match its Medusa category`)
    }
    if (!product.sales_channels?.length) {
      failures.push(`${handle} is not linked to a sales channel`)
    }

    const skus = product.variants?.map((variant: any) => variant.sku) || []
    if (!skus.length || new Set(skus).size !== skus.length || skus.some((sku: string) => !sku)) {
      failures.push(`${handle} has missing or duplicate variant SKUs`)
    }
    if (product.variants?.some((variant: any) => !variant.inventory_items?.length)) {
      failures.push(`${handle} has variants without an inventory item`)
    }
    const expectedQuantity = expectedQuantityByStatus[metadata.stock_status as keyof typeof expectedQuantityByStatus]
    for (const variant of product.variants || []) {
      const itemId = variant.inventory_items?.[0]?.inventory_item_id
      const availableQuantity = itemId ? availableByItemId.get(itemId) || 0 : 0
      if (variant.manage_inventory !== true) {
        failures.push(`${handle} has a variant without managed inventory`)
      }
      if (availableQuantity !== expectedQuantity) {
        failures.push(`${handle} variant ${variant.sku} has ${availableQuantity} available, expected ${expectedQuantity}`)
      }
    }
  }

  if (failures.length) {
    console.log("WHOLESALE_TEST_DATA_VERIFICATION: FAIL")
    failures.forEach((failure) => console.log(`- ${failure}`))
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Wholesale test data verification failed"
    )
  }

  console.log("WHOLESALE_TEST_DATA_VERIFICATION: PASS")
  products
    .sort((a: any, b: any) => a.handle.localeCompare(b.handle))
    .forEach((product: any) => {
      console.log(
        `${product.handle}: status=${product.status}, variants=${product.variants?.length || 0}, stock_status=${product.metadata.stock_status}, sales_channels=${product.sales_channels?.length || 0}`
      )
    })
}
