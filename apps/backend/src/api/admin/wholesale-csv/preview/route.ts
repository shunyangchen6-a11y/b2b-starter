import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"
import { validateWholesaleCsvUpload } from "../../../../lib/wholesale-csv"
import { previewWholesaleCsv } from "../../../../lib/wholesale-csv-service"

const validateUpload = (body: unknown) => {
  const input = body as { csv?: unknown; filename?: unknown }
  try { return validateWholesaleCsvUpload(input?.filename, input?.csv) }
  catch (error) { throw new MedusaError(MedusaError.Types.INVALID_DATA, error instanceof Error ? error.message : "Invalid CSV upload.") }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const csv = validateUpload(req.body)
  res.json(await previewWholesaleCsv(req.scope, csv))
}
