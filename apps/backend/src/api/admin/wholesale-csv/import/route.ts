import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"
import { validateWholesaleCsvUpload } from "../../../../lib/wholesale-csv"
import { importWholesaleCsv, previewWholesaleCsv } from "../../../../lib/wholesale-csv-service"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as { csv?: unknown; filename?: unknown; confirm?: unknown }
  let csv: string
  try { csv = validateWholesaleCsvUpload(body?.filename, body?.csv) }
  catch (error) { throw new MedusaError(MedusaError.Types.INVALID_DATA, error instanceof Error ? error.message : "Invalid CSV upload.") }
  if (body.confirm !== true) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Import must be explicitly confirmed after preview.")
  const preview = await previewWholesaleCsv(req.scope, csv)
  if (preview.issues.length) return res.status(400).json(preview)
  const summary = await importWholesaleCsv(req.scope, csv)
  res.json({ summary })
}
