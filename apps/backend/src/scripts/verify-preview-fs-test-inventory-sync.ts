import { MedusaContainer } from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"
import { syncFsTestInventory } from "../lib/preview-fs-test-inventory-sync"
import verifyWholesaleTestData from "./verify-wholesale-test-data"

const expectedStatusCounts = { in_stock: 24, low_stock: 24, sold_out: 10 }

const assert = (condition: unknown, message: string) => {
  if (!condition) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
  }
}

export default async function verifyPreviewFsTestInventorySync({
  container,
}: {
  container: MedusaContainer
}) {
  console.log("PREVIEW_FS_TEST_INVENTORY_SYNC_VERIFICATION: starting")
  const first = await syncFsTestInventory(container)
  console.log("PREVIEW_FS_TEST_INVENTORY_SYNC_VERIFICATION: first sync complete")
  const second = await syncFsTestInventory(container)
  console.log("PREVIEW_FS_TEST_INVENTORY_SYNC_VERIFICATION: second sync complete")

  for (const result of [first, second]) {
    assert(result.scanned_variants === 58, "Expected to scan exactly 58 existing FS-TEST variants.")
    assert(result.synchronized_variants === 58, "Expected all FS-TEST variants to synchronize.")
    assert(result.failures.length === 0, "FS-TEST inventory synchronization returned failures.")
    assert(
      JSON.stringify(result.status_counts) === JSON.stringify(expectedStatusCounts),
      "FS-TEST inventory synchronization returned incorrect status counts."
    )
  }

  await verifyWholesaleTestData({ container })
  console.log("PREVIEW_FS_TEST_INVENTORY_SYNC_VERIFICATION: PASS")
  console.log("- Ran twice without adding inventory quantities")
  console.log("- Verified 58 existing FS-TEST variants and their actual inventory levels")
}
