jest.mock("@medusajs/medusa/core-flows", () => ({
  updateProductVariantsWorkflow: jest.fn(() => ({ run: jest.fn() })),
}))

import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  fsTestStockQuantity,
  isAdminActor,
  isPreviewInventorySyncEnabled,
  syncFsTestInventory,
} from "../lib/preview-fs-test-inventory-sync"

describe("Preview FS-TEST inventory sync", () => {
  it("requires an explicitly enabled Preview environment and an administrator actor", () => {
    expect(isPreviewInventorySyncEnabled({ MEDUSA_PREVIEW_INVENTORY_SYNC_ENABLED: "true", MEDUSA_CLOUD_ENVIRONMENT_TYPE: "preview-instance" })).toBe(true)
    expect(isPreviewInventorySyncEnabled({ MEDUSA_PREVIEW_INVENTORY_SYNC_ENABLED: "true", MEDUSA_CLOUD_ENVIRONMENT_TYPE: "production" })).toBe(false)
    expect(isPreviewInventorySyncEnabled({ MEDUSA_PREVIEW_INVENTORY_SYNC_ENABLED: "true", MEDUSA_CLOUD_ENVIRONMENT_TYPE: "long-lived" })).toBe(false)
    expect(isPreviewInventorySyncEnabled({ MEDUSA_CLOUD_ENVIRONMENT_TYPE: "preview-instance" })).toBe(false)
    expect(isAdminActor({ actor_id: "user_1", actor_type: "user" })).toBe(true)
    expect(isAdminActor({ actor_id: "customer_1", actor_type: "customer" })).toBe(false)
    expect(isAdminActor()).toBe(false)
  })

  it("uses the fixed inventory values", () => {
    expect(fsTestStockQuantity("in_stock")).toBe(180)
    expect(fsTestStockQuantity("low_stock")).toBe(24)
    expect(fsTestStockQuantity("sold_out")).toBe(0)
    expect(fsTestStockQuantity("unknown")).toBeNull()
  })

  it("creates only a missing FS-TEST inventory item and remains idempotent", async () => {
    let linkedInventoryItemId: string | undefined
    let stockLevel: { id: string; inventory_item_id: string; location_id: string; stocked_quantity: number } | undefined
    const createInventoryItems = jest.fn(async () => [{ id: "inventory_fs_test" }])
    const createInventoryLevels = jest.fn(async (input: any) => {
      stockLevel = { id: "level_fs_test", inventory_item_id: "inventory_fs_test", location_id: "sl_default", stocked_quantity: input.stocked_quantity }
    })
    const updateInventoryLevels = jest.fn(async (input: any) => {
      stockLevel = { id: input.id, inventory_item_id: "inventory_fs_test", location_id: "sl_default", stocked_quantity: input.stocked_quantity }
    })
    const query = {
      graph: jest.fn(async ({ entity }: any) => {
        if (entity === "stock_location") return { data: [{ id: "sl_default", name: "Default Stock Location" }] }
        return {
          data: [{
            id: "product_fs_test",
            metadata: { stock_status: "in_stock" },
            variants: [
              { id: "variant_fs_test", sku: "FS-TEST-JOGGER-BLACK-S", inventory_items: linkedInventoryItemId ? [{ inventory_item_id: linkedInventoryItemId }] : [] },
              { id: "variant_other", sku: "OTHER-SKU", inventory_items: [] },
            ],
          }],
        }
      }),
    }
    const container = {
      resolve: (key: string) => {
        if (key === ContainerRegistrationKeys.QUERY) return query
        if (key === ContainerRegistrationKeys.LINK) return { create: jest.fn(async ({ inventory }: any) => { linkedInventoryItemId = inventory.inventory_item_id }) }
        if (key === Modules.INVENTORY) return {
          createInventoryItems,
          listInventoryLevels: jest.fn(async () => stockLevel ? [{ id: stockLevel.id, inventory_item_id: "inventory_fs_test", location_id: "sl_default", stocked_quantity: stockLevel.stocked_quantity }] : []),
          createInventoryLevels,
          updateInventoryLevels,
        }
        if (key === Modules.PRODUCT) return {
          listProductVariants: jest.fn(async () => [{ id: "variant_fs_test", product_id: "product_fs_test", sku: "FS-TEST-JOGGER-BLACK-S" }]),
        }
        throw new Error(`Unexpected dependency: ${key}`)
      },
    } as any

    const first = await syncFsTestInventory(container)
    expect(createInventoryItems).toHaveBeenCalledTimes(1)
    expect(createInventoryLevels).toHaveBeenCalledTimes(1)
    expect(stockLevel).toMatchObject({ inventory_item_id: "inventory_fs_test", location_id: "sl_default", stocked_quantity: 180 })

    const second = await syncFsTestInventory(container)

    expect(first).toMatchObject({ scanned_variants: 1, synchronized_variants: 1, status_counts: { in_stock: 1, low_stock: 0, sold_out: 0 }, failures: [] })
    expect(second).toMatchObject({ scanned_variants: 1, synchronized_variants: 1, status_counts: { in_stock: 1, low_stock: 0, sold_out: 0 }, failures: [] })
    expect(createInventoryItems).toHaveBeenCalledTimes(1)
    expect(createInventoryLevels).toHaveBeenCalledTimes(1)
    expect(updateInventoryLevels).not.toHaveBeenCalled()
    expect(stockLevel?.stocked_quantity).toBe(180)
  })
})
