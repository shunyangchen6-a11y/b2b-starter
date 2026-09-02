import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"
import {
  isAdminActor,
  isPreviewInventorySyncEnabled,
  syncFsTestInventory,
} from "../../../../lib/preview-fs-test-inventory-sync"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  if (!isAdminActor(req.auth_context)) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Administrator authentication is required.")
  }
  if (!isPreviewInventorySyncEnabled()) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "FS-TEST inventory sync is available only in the explicitly enabled Medusa Cloud Preview environment."
    )
  }

  res.json({ summary: await syncFsTestInventory(req.scope) })
}
